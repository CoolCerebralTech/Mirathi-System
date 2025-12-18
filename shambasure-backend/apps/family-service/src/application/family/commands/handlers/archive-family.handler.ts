import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../../common/base/result';
import { ArchiveFamilyCommand } from '../impl/archive-family.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(ArchiveFamilyCommand)
export class ArchiveFamilyHandler extends BaseCommandHandler<ArchiveFamilyCommand, Result<void>> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: ArchiveFamilyCommand): Promise<Result<void>> {
    try {
      const validation = this.validateCommand(command);
      if (validation.isFailure) return Result.fail(validation.error!);

      // 1. Load Family
      const family = await this.familyRepository.findById(command.familyId);
      if (!family) return Result.fail(new Error('Family not found'));

      // 2. Domain Logic
      // Invariant: Cannot archive if active members exist (checked inside domain method)
      family.archive(command.reason, command.userId);

      // 3. Persist
      await this.familyRepository.update(family);

      // 4. Publish Events
      await this.publishDomainEvents(family);

      this.logSuccess(command, undefined, 'Family archived');
      return Result.ok();
    } catch (error) {
      this.handleError(error, command, 'ArchiveFamilyHandler');
    }
  }
}
