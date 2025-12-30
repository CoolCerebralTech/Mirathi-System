// src/application/guardianship/commands/handlers/review-compliance-report.handler.ts
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
import { ReviewComplianceReportCommand } from '../impl/review-compliance-report.command';

@CommandHandler(ReviewComplianceReportCommand)
export class ReviewComplianceReportHandler extends BaseCommandHandler<
  ReviewComplianceReportCommand,
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

  async execute(command: ReviewComplianceReportCommand): Promise<Result<void>> {
    try {
      await this.run(command, command.guardianshipId, (aggregate) => {
        const check = aggregate.props.complianceChecks.find(
          (c: any) => c.id.toString() === command.complianceCheckId,
        );

        if (!check) {
          throw new AppErrors.NotFoundError('Compliance Check', command.complianceCheckId);
        }

        // Domain Logic: Accept
        check.accept(command.userId, command.feedback);
      });

      this.logSuccess(command, `Accepted compliance report ${command.complianceCheckId}`);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
