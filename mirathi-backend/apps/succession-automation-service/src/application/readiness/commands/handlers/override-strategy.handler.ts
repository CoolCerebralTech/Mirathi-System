import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { OverrideStrategyCommand } from '../impl/override-strategy.command';

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
      if (!assessment) return Result.fail<void>('Assessment not found');

      // Use the new public method
      assessment.overrideStrategy(newStrategy);

      await this.repository.save(assessment);

      this.logger.log(
        `Strategy overridden for ${assessmentId} by ${userId}. Reason: ${reasonForOverride}`,
      );

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
