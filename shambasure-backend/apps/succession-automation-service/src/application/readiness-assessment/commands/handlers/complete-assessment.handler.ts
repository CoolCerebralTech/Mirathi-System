import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { CompleteAssessmentCommand } from '../impl/complete-assessment.command';

@CommandHandler(CompleteAssessmentCommand)
export class CompleteAssessmentHandler implements ICommandHandler<CompleteAssessmentCommand> {
  private readonly logger = new Logger(CompleteAssessmentHandler.name);

  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(command: CompleteAssessmentCommand): Promise<Result<void>> {
    const { assessmentId } = command.dto;

    try {
      const assessment = await this.repository.findById(assessmentId);
      if (!assessment) return Result.fail<void>('Assessment not found');

      // Domain Rule Check: Can we file?
      if (!assessment.canFile()) {
        return Result.fail<void>(
          `Cannot complete assessment. Score is ${assessment.readinessScore.score}% and/or blocking risks exist.`,
        );
      }

      assessment.markAsComplete();
      await this.repository.save(assessment);

      this.logger.log(`Assessment ${assessmentId} marked as COMPLETE.`);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
