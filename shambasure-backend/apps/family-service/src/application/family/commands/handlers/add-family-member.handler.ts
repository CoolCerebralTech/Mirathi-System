// application/family/commands/handlers/add-family-member.handler.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { Family } from '../../../../domain/aggregates/family.aggregate';
import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../common/result';
import { FamilyMemberResponse } from '../../dto/response/family-member.response';
import { FamilyMemberMapper } from '../../mappers/family-member.mapper';
import { FamilyMapper } from '../../mappers/family.mapper';
import { RequestToDomainMapper } from '../../mappers/request-to-domain.mapper';
import { AddFamilyMemberCommand } from '../impl/add-family-member.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(AddFamilyMemberCommand)
export class AddFamilyMemberHandler extends BaseCommandHandler<
  AddFamilyMemberCommand,
  Result<FamilyMemberResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly familyMapper: FamilyMapper,
    private readonly familyMemberMapper: FamilyMemberMapper,
    private readonly requestMapper: RequestToDomainMapper,
    commandBus: any,
    eventPublisher: EventPublisher,
  ) {
    super(commandBus, eventPublisher);
  }

  async execute(command: AddFamilyMemberCommand): Promise<Result<FamilyMemberResponse>> {
    try {
      // Validate command
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // Load family
      const family = await this.familyRepository.findById(command.familyId);
      if (!family) {
        return Result.fail(`Family with ID ${command.familyId} not found`);
      }

      // Validate member uniqueness
      const isUnique = await this.validateMemberUniqueness(command);
      if (!isUnique) {
        return Result.fail(
          'Family member with same National ID, KRA PIN, or User ID already exists',
        );
      }

      // Map request to domain props
      const createProps = this.requestMapper.toCreateFamilyMemberProps(command.data);

      // Create family member
      const familyMember = FamilyMember.create(createProps);

      // Publish events
      const memberWithEvents = this.eventPublisher.mergeObjectContext(familyMember);

      // Save family member
      await this.familyMemberRepository.create(memberWithEvents);

      // Update family with new member
      const familyWithEvents = this.eventPublisher.mergeObjectContext(family);
      familyWithEvents.addMember(memberWithEvents);

      // Save family (for denormalized counts)
      await this.familyRepository.update(familyWithEvents);

      // Commit events
      memberWithEvents.commit();
      familyWithEvents.commit();

      // Map to response
      const response = this.familyMemberMapper.toDTO(memberWithEvents);

      this.logSuccess(command, response, 'Family member added');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, command, 'AddFamilyMemberHandler');
    }
  }

  private async validateMemberUniqueness(command: AddFamilyMemberCommand): Promise<boolean> {
    const { nationalId, kraPin, userId } = command.data;

    // Check by National ID
    if (nationalId) {
      const existingByNationalId = await this.familyMemberRepository.findByNationalId(nationalId);
      if (existingByNationalId) {
        return false;
      }
    }

    // Check by KRA PIN
    if (kraPin) {
      const existingByKraPin = await this.familyMemberRepository.findByKraPin(kraPin);
      if (existingByKraPin) {
        return false;
      }
    }

    // Check by User ID
    if (userId) {
      const existingByUserId = await this.familyMemberRepository.findByUserId(userId);
      if (existingByUserId) {
        return false;
      }
    }

    return true;
  }
}
