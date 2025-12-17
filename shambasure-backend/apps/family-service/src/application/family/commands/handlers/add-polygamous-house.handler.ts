// application/family/commands/handlers/add-polygamous-house.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { Family } from '../../../../domain/aggregates/family.aggregate';
import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import { PolygamousHouse } from '../../../../domain/entities/polygamous-house.entity';
import { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { IPolygamousHouseRepository } from '../../../../domain/interfaces/repositories/ipolygamous-house.repository';
import { Result } from '../../common/result';
import { PolygamousHouseResponse } from '../../dto/response/polygamous-house.response';
import { PolygamousHouseMapper } from '../../mappers/polygamous-house.mapper';
import { RequestToDomainMapper } from '../../mappers/request-to-domain.mapper';
import { AddPolygamousHouseCommand } from '../impl/add-polygamous-house.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(AddPolygamousHouseCommand)
export class AddPolygamousHouseHandler extends BaseCommandHandler<
  AddPolygamousHouseCommand,
  Result<PolygamousHouseResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly polygamousHouseRepository: IPolygamousHouseRepository,
    private readonly polygamousHouseMapper: PolygamousHouseMapper,
    private readonly requestMapper: RequestToDomainMapper,
    commandBus: any,
    eventPublisher: EventPublisher,
  ) {
    super(commandBus, eventPublisher);
  }

  async execute(command: AddPolygamousHouseCommand): Promise<Result<PolygamousHouseResponse>> {
    try {
      // Validate command
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // Validate house data
      const requestErrors = this.requestMapper.validateAddPolygamousHouseRequest(command.data);
      if (requestErrors.length > 0) {
        return Result.fail(`Invalid house data: ${requestErrors.join(', ')}`);
      }

      // Load family
      const family = await this.familyRepository.findById(command.familyId);
      if (!family) {
        return Result.fail(`Family with ID ${command.familyId} not found`);
      }

      // Check house uniqueness
      const existingHouse = await this.polygamousHouseRepository.getFamilyHouseOrder(
        command.familyId,
        command.data.houseOrder,
      );
      if (existingHouse) {
        return Result.fail(`House order ${command.data.houseOrder} already exists in this family`);
      }

      // Validate house head if provided
      let houseHead: FamilyMember | null = null;
      if (command.data.houseHeadId) {
        houseHead = await this.familyMemberRepository.findById(command.data.houseHeadId);
        if (!houseHead) {
          return Result.fail(`House head with ID ${command.data.houseHeadId} not found`);
        }

        // Verify house head belongs to family
        if (houseHead.familyId !== command.familyId) {
          return Result.fail('House head must belong to the same family');
        }

        // Verify house head is female (for polygamous houses)
        if (houseHead.gender !== 'FEMALE') {
          return Result.fail('Polygamous house head must be female');
        }
      }

      // Map request to domain props
      const createProps = this.requestMapper.toCreatePolygamousHouseProps(command.data);

      // Create polygamous house
      const polygamousHouse = PolygamousHouse.create(createProps);

      // Publish events
      const houseWithEvents = this.eventPublisher.mergeObjectContext(polygamousHouse);
      const familyWithEvents = this.eventPublisher.mergeObjectContext(family);

      // Add house to family
      familyWithEvents.addPolygamousHouse(houseWithEvents);

      // Save house
      await this.polygamousHouseRepository.create(houseWithEvents);

      // Update family
      await this.familyRepository.update(familyWithEvents);

      // Commit events
      houseWithEvents.commit();
      familyWithEvents.commit();

      // Map to response
      const response = this.polygamousHouseMapper.toDTO(houseWithEvents);
      if (houseHead) {
        response.houseHead = {
          id: houseHead.id,
          name: `${houseHead.name.firstName} ${houseHead.name.lastName}`,
          gender: houseHead.gender || '',
          isDeceased: houseHead.isDeceased,
          age: houseHead.currentAge || 0,
          isIdentityVerified: houseHead.isIdentityVerified,
        };
      }

      this.logSuccess(command, response, 'Polygamous house added');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, command, 'AddPolygamousHouseHandler');
    }
  }
}
