// application/family/commands/handlers/remove-family-member.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventPublisher } from '@nestjs/cqrs';

import { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../../common/base/result';
import { RemoveFamilyMemberCommand } from '../impl/remove-family-member.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(RemoveFamilyMemberCommand)
export class RemoveFamilyMemberHandler extends BaseCommandHandler<
  RemoveFamilyMemberCommand,
  Result<void>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
    commandBus: any,
    eventPublisher: EventPublisher,
  ) {
    super(commandBus, eventPublisher);
  }

  async execute(command: RemoveFamilyMemberCommand): Promise<Result<void>> {
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

      // Load family member
      const familyMember = await this.familyMemberRepository.findById(command.memberId);
      if (!familyMember) {
        return Result.fail(`Family member with ID ${command.memberId} not found`);
      }

      // Verify member belongs to the family
      if (familyMember.familyId !== command.familyId) {
        return Result.fail(`Family member does not belong to family ${command.familyId}`);
      }

      // Publish events
      const familyWithEvents = this.eventPublisher.mergeObjectContext(family);

      // Remove member from family
      familyWithEvents.removeMember(familyMember);

      // Archive the member
      familyMember.archive(command.reason, command.userId);

      // Update family
      await this.familyRepository.update(familyWithEvents);

      // Archive member
      await this.familyMemberRepository.archive(command.memberId, command.userId, command.reason);

      // Commit events
      familyWithEvents.commit();

      this.logSuccess(command, null, 'Family member removed');
      return Result.ok();
    } catch (error) {
      this.handleError(error, command, 'RemoveFamilyMemberHandler');
    }
  }
}
