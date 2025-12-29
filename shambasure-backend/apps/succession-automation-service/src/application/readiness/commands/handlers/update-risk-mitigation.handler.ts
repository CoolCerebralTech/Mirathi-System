import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { UpdateRiskMitigationCommand } from '../impl/update-risk-mitigation.command';

@CommandHandler(UpdateRiskMitigationCommand)
export class UpdateRiskMitigationHandler implements ICommandHandler<UpdateRiskMitigationCommand> {
  private readonly logger = new Logger(UpdateRiskMitigationHandler.name);

  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(command: UpdateRiskMitigationCommand): Promise<Result<void>> {
    const { assessmentId, riskId, actionTaken, followUpDate } = command.dto;
    const { userId } = command;

    try {
      const assessment = await this.repository.findById(assessmentId);
      if (!assessment) return Result.fail<void>('Assessment not found');

      // Use the new public method
      assessment.recordRiskMitigation(
        riskId,
        actionTaken,
        userId,
        followUpDate ? new Date(followUpDate) : undefined,
      );

      await this.repository.save(assessment);

      this.logger.log(`Mitigation recorded for Risk ${riskId} by ${userId}`);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
