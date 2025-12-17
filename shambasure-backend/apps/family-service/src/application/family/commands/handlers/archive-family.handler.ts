// application/family/commands/handlers/archive-family.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { Family } from '../../../../domain/aggregates/family.aggregate';
import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../common/result';
import { ArchiveFamilyCommand } from '../impl/archive-family.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(ArchiveFamilyCommand)
export class ArchiveFamilyHandler extends BaseCommandHandler<ArchiveFamilyCommand, Result<void>> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    commandBus: any,
    eventPublisher: EventPublisher,
  ) {
    super(commandBus, eventPublisher);
  }

  async execute(command: ArchiveFamilyCommand): Promise<Result<void>> {
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

      // Check if family is already archived
      if (family.isArchived) {
        return Result.fail('Family is already archived');
      }

      // Check if family has living members
      if (family.livingMemberCount > 0) {
        return Result.fail('Cannot archive family with living members');
      }

      // Publish events
      const familyWithEvents = this.eventPublisher.mergeObjectContext(family);

      // Archive family
      familyWithEvents.archive(command.reason, command.userId);

      // Save family
      await this.familyRepository.update(familyWithEvents);

      // Commit events
      familyWithEvents.commit();

      this.logSuccess(command, null, 'Family archived');
      return Result.ok();
    } catch (error) {
      this.handleError(error, command, 'ArchiveFamilyHandler');
    }
  }
}
