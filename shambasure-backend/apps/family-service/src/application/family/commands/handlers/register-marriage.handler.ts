// application/family/commands/handlers/register-marriage.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { Family } from '../../../../domain/aggregates/family.aggregate';
import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import { Marriage } from '../../../../domain/entities/marriage.entity';
import { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { IMarriageRepository } from '../../../../domain/interfaces/repositories/imarriage.repository';
import { Result } from '../../common/result';
import { MarriageResponse } from '../../dto/response/marriage.response';
import { MarriageMapper } from '../../mappers/marriage.mapper';
import { RequestToDomainMapper } from '../../mappers/request-to-domain.mapper';
import { RegisterMarriageCommand } from '../impl/register-marriage.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(RegisterMarriageCommand)
export class RegisterMarriageHandler extends BaseCommandHandler<
  RegisterMarriageCommand,
  Result<MarriageResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly marriageRepository: IMarriageRepository,
    private readonly marriageMapper: MarriageMapper,
    private readonly requestMapper: RequestToDomainMapper,
    commandBus: any,
    eventPublisher: EventPublisher,
  ) {
    super(commandBus, eventPublisher);
  }

  async execute(command: RegisterMarriageCommand): Promise<Result<MarriageResponse>> {
    try {
      // Validate command
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // Validate marriage data
      const requestErrors = this.requestMapper.validateRegisterMarriageRequest(command.data);
      if (requestErrors.length > 0) {
        return Result.fail(`Invalid marriage data: ${requestErrors.join(', ')}`);
      }

      // Load family
      const family = await this.familyRepository.findById(command.familyId);
      if (!family) {
        return Result.fail(`Family with ID ${command.familyId} not found`);
      }

      // Load spouses
      const [spouse1, spouse2] = await Promise.all([
        this.familyMemberRepository.findById(command.data.spouse1Id),
        this.familyMemberRepository.findById(command.data.spouse2Id),
      ]);

      if (!spouse1 || !spouse2) {
        return Result.fail('One or both spouses not found');
      }

      // Verify spouses belong to the family
      if (spouse1.familyId !== command.familyId || spouse2.familyId !== command.familyId) {
        return Result.fail('Both spouses must belong to the same family');
      }

      // Check for existing active marriages (for monogamous types)
      const existingMarriages = await Promise.all([
        this.marriageRepository.findActiveBySpouseId(spouse1.id),
        this.marriageRepository.findActiveBySpouseId(spouse2.id),
      ]);

      if (
        command.data.type !== 'CUSTOMARY' &&
        command.data.type !== 'TRADITIONAL' &&
        command.data.type !== 'ISLAMIC'
      ) {
        // For monogamous marriage types, check if either spouse is already married
        if (existingMarriages[0] || existingMarriages[1]) {
          return Result.fail('One or both spouses are already married in a monogamous union');
        }
      }

      // Map request to domain props
      const createProps = this.requestMapper.toCreateMarriageProps(command.data);

      // Create marriage
      const marriage = Marriage.create(createProps);

      // Publish events
      const marriageWithEvents = this.eventPublisher.mergeObjectContext(marriage);
      const familyWithEvents = this.eventPublisher.mergeObjectContext(family);

      // Register marriage in family
      familyWithEvents.registerMarriage(marriageWithEvents);

      // Save marriage
      await this.marriageRepository.create(marriageWithEvents);

      // Update family
      await this.familyRepository.update(familyWithEvents);

      // Commit events
      marriageWithEvents.commit();
      familyWithEvents.commit();

      // Map to response with spouse details
      const response = this.marriageMapper.toDTO(marriageWithEvents);
      response.spouse1 = {
        id: spouse1.id,
        name: `${spouse1.name.firstName} ${spouse1.name.lastName}`,
        gender: spouse1.gender || '',
        isDeceased: spouse1.isDeceased,
      };
      response.spouse2 = {
        id: spouse2.id,
        name: `${spouse2.name.firstName} ${spouse2.name.lastName}`,
        gender: spouse2.gender || '',
        isDeceased: spouse2.isDeceased,
      };

      this.logSuccess(command, response, 'Marriage registered');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, command, 'RegisterMarriageHandler');
    }
  }
}
