import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { ResolveRiskManuallyCommand } from '../impl/resolve-risk-manually.command';

@CommandHandler(ResolveRiskManuallyCommand)
export class ResolveRiskManuallyHandler implements ICommandHandler<ResolveRiskManuallyCommand> {
  private readonly logger = new Logger(ResolveRiskManuallyHandler.name);

  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(command: ResolveRiskManuallyCommand): Promise<Result<void>> {
    const { assessmentId, riskId, resolutionNotes } = command.dto;
    const { userId } = command;

    try {
      const assessment = await this.repository.findById(assessmentId);
      if (!assessment) {
        return Result.fail<void>(`Assessment with ID ${assessmentId} not found`);
      }

      // Domain Logic: Manually resolve the specific risk
      assessment.resolveRiskFlag(riskId, `${resolutionNotes} (Resolved by: ${userId})`);

      await this.repository.save(assessment);

      this.logger.log(`Risk ${riskId} resolved manually by user ${userId}`);
      return Result.ok<void>();
    } catch (error) {
      this.logger.error(`Failed to resolve risk ${riskId}`, error.stack);
      return Result.fail<void>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
