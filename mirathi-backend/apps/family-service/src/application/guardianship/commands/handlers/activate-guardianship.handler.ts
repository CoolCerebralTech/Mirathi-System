// src/application/guardianship/commands/handlers/activate-guardianship.handler.ts
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { ActivateGuardianshipCommand } from '../impl/activate-guardianship.command';

@CommandHandler(ActivateGuardianshipCommand)
export class ActivateGuardianshipHandler extends BaseCommandHandler<
  ActivateGuardianshipCommand,
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

  async execute(command: ActivateGuardianshipCommand): Promise<Result<void>> {
    try {
      await this.run(command, command.guardianshipId, (aggregate) => {
        // Domain Logic:
        // 1. Checks if status is PENDING_ACTIVATION
        // 2. Checks if Primary Guardian exists (Invariant)
        // 3. Schedules first Compliance Check
        aggregate.activateGuardianship();
      });

      return Result.ok();
    } catch (error) {
      // Maps domain errors (e.g., "Cannot activate without primary guardian")
      // to application failures
      return Result.fail(error as Error);
    }
  }
}
