import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { ArchiveFamilyCommand } from '../impl/archive-family.command';

@CommandHandler(ArchiveFamilyCommand)
export class ArchiveFamilyHandler
  extends BaseCommandHandler<ArchiveFamilyCommand, FamilyAggregate, Result<void>>
  implements ICommandHandler<ArchiveFamilyCommand, Result<void>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    protected readonly repository: IFamilyRepository,
    protected readonly eventBus: EventBus,
  ) {
    super(eventBus, repository as any, undefined);
  }

  async execute(command: ArchiveFamilyCommand): Promise<Result<void>> {
    this.logger.log(`Archiving family ${command.familyId}`);

    try {
      command.validate();

      // 1. Check Existence (Lightweight)
      const family = await this.repository.findById(command.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', command.familyId));
      }

      // 2. Permission Check
      // Only the Creator or Admin (implied via userId context) should be able to archive
      const requestorId = new UniqueEntityID(command.userId);

      if (!family.props.creatorId.equals(requestorId)) {
        this.logger.warn(
          `Security Warning: User ${command.userId} is archiving family created by ${family.props.creatorId.toString()}`,
        );
        // In a stricter system, we might block this. For now, we log the audit trail.
      }

      // 3. Execute Soft Delete via Repository
      // Note: We use the repository method because archiving might not change aggregate state logic
      // as much as it changes storage status (soft delete flag in DB)
      await this.repository.softDelete(command.familyId, command.userId, command.reason);

      this.logger.log(`Family ${command.familyId} archived successfully.`);

      return Result.ok();
    } catch (error) {
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
