// src/application/guardianship/commands/handlers/submit-compliance-report.handler.ts
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { SubmitComplianceReportCommand } from '../impl/submit-compliance-report.command';

@CommandHandler(SubmitComplianceReportCommand)
export class SubmitComplianceReportHandler extends BaseCommandHandler<
  SubmitComplianceReportCommand,
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

  async execute(command: SubmitComplianceReportCommand): Promise<Result<void>> {
    try {
      await this.run(command, command.guardianshipId, (aggregate) => {
        // Domain Logic:
        // The Aggregate exposes a public method for this specific action
        // which handles locating the check and validating state.
        aggregate.submitComplianceCheck(command.complianceCheckId, {
          method: command.method,
          details: command.details,
          confirmationNumber: command.confirmationNumber,
          submittedBy: command.userId, // Auditing
        });
      });

      this.logSuccess(command, `Submitted compliance report ${command.complianceCheckId}`);
      return Result.ok();
    } catch (error) {
      // Handles "Validation Error: Critical errors found" from the Entity
      return Result.fail(error as Error);
    }
  }
}
