// src/application/guardianship/commands/handlers/request-report-amendment.handler.ts
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
import { RequestReportAmendmentCommand } from '../impl/request-report-amendment.command';

@CommandHandler(RequestReportAmendmentCommand)
export class RequestReportAmendmentHandler extends BaseCommandHandler<
  RequestReportAmendmentCommand,
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

  async execute(command: RequestReportAmendmentCommand): Promise<Result<void>> {
    try {
      await this.run(command, command.guardianshipId, (aggregate) => {
        const check = aggregate.props.complianceChecks.find(
          (c: any) => c.id.toString() === command.complianceCheckId,
        );

        if (!check) {
          throw new AppErrors.NotFoundError('Compliance Check', command.complianceCheckId);
        }

        // Domain Logic: Request Amendment
        // Transitions status to AMENDMENT_REQUESTED and creates FollowUpAction
        check.requestAmendment(command.feedback, command.newDeadline);
      });

      this.logSuccess(command, `Requested amendment for report ${command.complianceCheckId}`);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
