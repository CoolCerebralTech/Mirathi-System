// src/application/guardianship/commands/handlers/record-conflict-of-interest.handler.ts
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
import { RecordConflictOfInterestCommand } from '../impl/record-conflict-of-interest.command';

@CommandHandler(RecordConflictOfInterestCommand)
export class RecordConflictOfInterestHandler extends BaseCommandHandler<
  RecordConflictOfInterestCommand,
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

  async execute(command: RecordConflictOfInterestCommand): Promise<Result<void>> {
    try {
      await this.run(command, command.guardianshipId, (aggregate) => {
        // 1. Find the guardian assignment (Active or Suspended or Pending)
        // We search all assignments because a conflict might be reported on a suspended guardian
        const assignment = aggregate.props.guardianAssignments.find(
          (g: any) => g.guardianId === command.guardianId,
        );

        if (!assignment) {
          throw new AppErrors.NotFoundError('Guardian Assignment', command.guardianId);
        }

        // 2. Record the conflict
        // NOTE: If severity is CRITICAL, the Entity automatically calls this.suspend() internally
        assignment.addConflictOfInterest(
          command.conflictType,
          command.description,
          command.severity,
        );
      });

      this.logSuccess(
        command,
        `Recorded ${command.severity} conflict for guardian ${command.guardianId}`,
      );

      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
