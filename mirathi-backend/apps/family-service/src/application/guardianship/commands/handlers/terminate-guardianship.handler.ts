// src/application/guardianship/commands/handlers/terminate-guardianship.handler.ts
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { TerminateGuardianshipCommand } from '../impl/terminate-guardianship.command';

@CommandHandler(TerminateGuardianshipCommand)
export class TerminateGuardianshipHandler extends BaseCommandHandler<
  TerminateGuardianshipCommand,
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

  async execute(command: TerminateGuardianshipCommand): Promise<Result<void>> {
    const { payload } = command;

    try {
      await this.run(command, payload.guardianshipId, (aggregate) => {
        // Domain Logic:
        // 1. Validates current status is ACTIVE
        // 2. Terminates all active Guardian Assignments
        // 3. Generates "Closing Report" compliance check
        aggregate.terminateGuardianship(payload.reason, payload.terminationDate);
      });

      this.logSuccess(command, `Terminated Guardianship ${payload.guardianshipId}`);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
