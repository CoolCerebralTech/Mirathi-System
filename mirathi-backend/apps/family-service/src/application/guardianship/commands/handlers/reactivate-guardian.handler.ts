// src/application/guardianship/commands/handlers/reactivate-guardian.handler.ts
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { GuardianAssignmentStatus } from '../../../../domain/entities/guardian-assignment.entity';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { ReactivateGuardianCommand } from '../impl/reactivate-guardian.command';

@CommandHandler(ReactivateGuardianCommand)
export class ReactivateGuardianHandler extends BaseCommandHandler<
  ReactivateGuardianCommand,
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

  async execute(command: ReactivateGuardianCommand): Promise<Result<void>> {
    try {
      await this.run(command, command.guardianshipId, (aggregate) => {
        // We need to find the assignment even if it is suspended
        // Assuming aggregate has a method or we access via a getter exposing all assignments
        // If public getter 'getGuardians()' exists:
        // const assignment = aggregate.getGuardians().find(g => g.guardianId === command.guardianId);

        // Fallback: Using getActiveGuardians won't work if they are suspended.
        // We rely on the repository or specific aggregate method.
        // For now, let's assume we can access the assignment via a method on the aggregate
        // or we filter the internal collection if exposed.

        // *Implementation Note*: Ideally, add `aggregate.getGuardian(id)`
        // Here we iterate via a hypothetical public accessor or the repo reloads it.
        // Since we are inside the aggregate root scope in `run`, we assume access.

        // Accessing the private props via the entity logic if exposed,
        // or finding it in the array if the aggregate exposes `guardianAssignments` getter.

        const assignment = aggregate.props.guardianAssignments.find(
          (g: any) => g.guardianId === command.guardianId,
        );

        if (!assignment) {
          throw new AppErrors.NotFoundError('Guardian Assignment', command.guardianId);
        }

        if (assignment.status !== GuardianAssignmentStatus.SUSPENDED) {
          throw new Error('Guardian is not suspended');
        }

        assignment.reactivate();
      });

      this.logSuccess(command, `Reactivated guardian ${command.guardianId}`);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
