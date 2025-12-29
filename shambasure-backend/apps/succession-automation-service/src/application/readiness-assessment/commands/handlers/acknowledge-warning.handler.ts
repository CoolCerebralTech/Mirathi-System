import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { RiskSeverity } from '../../../../domain/entities/risk-flag.entity';
// Repositories
import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { AcknowledgeWarningCommand } from '../impl/risk-management.commands';

@CommandHandler(AcknowledgeWarningCommand)
export class AcknowledgeWarningHandler implements ICommandHandler<AcknowledgeWarningCommand> {
  private readonly logger = new Logger(AcknowledgeWarningHandler.name);

  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(command: AcknowledgeWarningCommand): Promise<Result<void>> {
    const { assessmentId, riskId, notes } = command.dto;
    const { userId } = command;

    try {
      const assessment = await this.repository.findById(assessmentId);
      if (!assessment) return Result.fail('Assessment not found');

      // 1. Validation: Can this risk be acknowledged?
      // Business Rule: Only LOW or MEDIUM risks can be acknowledged (accepted).
      // CRITICAL/HIGH must be resolved or disputed.
      const risk = assessment.riskFlags.find((r) => r.id.equals(riskId));
      if (!risk) return Result.fail(`Risk ${riskId} not found`);

      if (risk.severity === RiskSeverity.CRITICAL || risk.severity === RiskSeverity.HIGH) {
        return Result.fail(
          `Cannot simply acknowledge ${risk.severity} risks. They must be resolved or formally disputed.`,
        );
      }

      // 2. Resolve with specific "Acknowledged" method
      // We use the standard resolve mechanism but with specific metadata
      assessment.resolveRiskFlag(
        riskId,
        `[WARNING ACKNOWLEDGED] User ${userId} accepted this risk. Notes: ${notes || 'No notes provided.'}`,
      );

      // 3. Persist
      await this.repository.save(assessment);

      this.logger.log(`Warning/Risk ${riskId} acknowledged by user ${userId}`);
      return Result.ok<void>();
    } catch (error) {
      this.logger.error(
        `Failed to acknowledge warning ${riskId}`,
        error instanceof Error ? error.stack : '',
      );
      return Result.fail<void>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
