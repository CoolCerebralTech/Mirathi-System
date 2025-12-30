import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { DisputeRiskCommand } from '../impl/dispute-risk.command';

@CommandHandler(DisputeRiskCommand)
export class DisputeRiskHandler implements ICommandHandler<DisputeRiskCommand> {
  private readonly logger = new Logger(DisputeRiskHandler.name);

  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(command: DisputeRiskCommand): Promise<Result<void>> {
    const { assessmentId, riskId, reason } = command.dto;
    const { userId } = command;

    try {
      const assessment = await this.repository.findById(assessmentId);
      if (!assessment) {
        return Result.fail<void>(`Assessment ${assessmentId} not found`);
      }

      // Locate the risk entity within the aggregate
      const risk = assessment.riskFlags.find((r) => r.id.equals(riskId));
      if (!risk) {
        return Result.fail<void>(`Risk ${riskId} not found in assessment`);
      }

      // Domain Logic: Mark as disputed
      risk.markAsDisputed(reason, userId);

      await this.repository.save(assessment);

      this.logger.log(`Risk ${riskId} disputed by user ${userId}`);
      return Result.ok<void>();
    } catch (error) {
      this.logger.error(`Failed to dispute risk ${riskId}`, error.stack);
      return Result.fail<void>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
