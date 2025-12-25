// src/application/guardianship/commands/handlers/suspend-guardian.handler.ts
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { SuspendGuardianCommand } from '../impl/suspend-guardian.command';

@CommandHandler(SuspendGuardianCommand)
export class SuspendGuardianHandler extends BaseCommandHandler<
  SuspendGuardianCommand,
  GuardianshipAggregate,
  Result<void>
> {
  constructor(
    @Inject(GUARDIANSHIP_REPOSITORY)
    repo: IGuardianshipRepository,
    eventBus: EventBus,
  ) {
    super(eventBus, repo);
  }

  async execute(command: SuspendGuardianCommand): Promise<Result<void>> {
    try {
      await this.run(command, command.guardianshipId, (aggregate) => {
        // Locate the specific guardian assignment
        // Note: We access the entity via the Aggregate's public methods
        const assignment = aggregate
          .getActiveGuardians()
          .find((g) => g.guardianId === command.guardianId);

        if (!assignment) {
          throw new AppErrors.NotFoundError('Active Guardian Assignment', command.guardianId);
        }

        // Domain Logic: Suspend the specific entity
        assignment.suspend(command.reason);
      });

      this.logSuccess(command, `Suspended guardian ${command.guardianId}`);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
