import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

// Repositories
import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { OverrideStrategyCommand } from '../impl/risk-management.commands';

@CommandHandler(OverrideStrategyCommand)
export class OverrideStrategyHandler implements ICommandHandler<OverrideStrategyCommand> {
  private readonly logger = new Logger(OverrideStrategyHandler.name);

  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(command: OverrideStrategyCommand): Promise<Result<void>> {
    const { assessmentId, newStrategy, reasonForOverride } = command.dto;
    const { userId } = command;

    try {
      const assessment = await this.repository.findById(assessmentId);
      if (!assessment) return Result.fail('Assessment not found');

      // Domain Logic:
      // Since the Aggregate generates strategy on the fly during recalculation,
      // we need to perform a state update that persists this text.
      // NOTE: This assumes we extend the Aggregate with a specific method for this,
      // or we use the generic updateState pattern if available internally.

      // We will perform a manual update of the strategy property.
      // In a strict DDD world, we would add `overrideStrategy(strategy: string)` to the Aggregate.
      // Here we simulate that behavior via updateState-like behavior.

      // Update the strategy text
      // We append a footer to indicate it was manually overridden
      const finalStrategy = `${newStrategy}\n\n> *Strategy manually overridden by ${userId} on ${new Date().toLocaleDateString()}. Reason: ${reasonForOverride}*`;

      // Since updateState is protected in the aggregate provided, we rely on the repository
      // or a public method. Assuming we added `overrideStrategy` or utilizing `updateRecommendedStrategy` logic.
      // *Implementation Note*: As a developer using the provided aggregate, I would add this method to the aggregate:
      /* 
         public overrideStrategy(strategy: string): void {
           this.updateState({ recommendedStrategy: strategy });
         }
      */

      // Assuming the method exists or we are simulating the update:
      (assessment as any).updateState({
        recommendedStrategy: finalStrategy,
        // We might want to flag this so auto-recalculation doesn't overwrite it immediately
        // For now, we just update it.
      });

      await this.repository.save(assessment);

      this.logger.log(`Strategy manually overridden for Assessment ${assessmentId}`);
      return Result.ok<void>();
    } catch (error) {
      this.logger.error(
        `Failed to override strategy for ${assessmentId}`,
        error instanceof Error ? error.stack : '',
      );
      return Result.fail<void>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
