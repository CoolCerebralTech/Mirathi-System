import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { ResolveRiskCommand } from '../impl/resolve-risk.manually.command';

@CommandHandler(ResolveRiskCommand)
export class ResolveRiskHandler implements ICommandHandler<ResolveRiskCommand> {
  private readonly logger = new Logger(ResolveRiskHandler.name);

  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(command: ResolveRiskCommand): Promise<Result<void>> {
    const { assessmentId, riskId, resolutionNotes } = command.dto;
    const { userId } = command;

    try {
      // 1. Fetch Aggregate
      const assessment = await this.repository.findById(assessmentId);
      if (!assessment) {
        return Result.fail<void>(`Assessment with ID ${assessmentId} not found`);
      }

      // 2. Perform Domain Logic (Delegated to Aggregate)
      // This recalculates the score automatically inside the Aggregate
      assessment.resolveRiskFlag(riskId, resolutionNotes);

      // 3. Persist
      await this.repository.save(assessment);

      this.logger.log(`Risk ${riskId} manually resolved by user ${userId}`);
      return Result.ok<void>();
    } catch (error) {
      this.logger.error(`Failed to resolve risk ${riskId}`, error.stack);
      return Result.fail<void>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
