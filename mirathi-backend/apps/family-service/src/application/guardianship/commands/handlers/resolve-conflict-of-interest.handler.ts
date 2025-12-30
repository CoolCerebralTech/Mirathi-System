// src/application/guardianship/commands/handlers/resolve-conflict-of-interest.handler.ts
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
import { ResolveConflictOfInterestCommand } from '../impl/resolve-conflict-of-interest.command';

@CommandHandler(ResolveConflictOfInterestCommand)
export class ResolveConflictOfInterestHandler extends BaseCommandHandler<
  ResolveConflictOfInterestCommand,
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

  async execute(command: ResolveConflictOfInterestCommand): Promise<Result<void>> {
    try {
      await this.run(command, command.guardianshipId, (aggregate) => {
        const assignment = aggregate.props.guardianAssignments.find(
          (g: any) => g.guardianId === command.guardianId,
        );

        if (!assignment) {
          throw new AppErrors.NotFoundError('Guardian Assignment', command.guardianId);
        }

        // Domain Logic: Resolve the conflict
        // This restores the Compliance Score and may allow reactivation
        assignment.resolveConflict(
          command.conflictIndex,
          command.resolution,
          command.mitigationPlan,
        );
      });

      this.logSuccess(
        command,
        `Resolved conflict #${command.conflictIndex} for guardian ${command.guardianId}`,
      );

      return Result.ok();
    } catch (error) {
      // Handle array index out of bounds or already resolved errors
      return Result.fail(error as Error);
    }
  }
}
