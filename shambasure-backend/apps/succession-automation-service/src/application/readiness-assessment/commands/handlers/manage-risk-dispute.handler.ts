import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { AcknowledgeWarningCommand, DisputeRiskCommand } from '../impl/risk-actions.commands';

@CommandHandler(DisputeRiskCommand)
export class DisputeRiskHandler implements ICommandHandler<DisputeRiskCommand> {
  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY) private readonly repo: IReadinessRepository,
  ) {}

  async execute(command: DisputeRiskCommand): Promise<Result<void>> {
    const assessment = await this.repo.findById(command.dto.assessmentId);
    if (!assessment) return Result.fail('Assessment not found');

    const risk = assessment.riskFlags.find((r) => r.id.equals(command.dto.riskId));
    if (!risk) return Result.fail('Risk not found');

    risk.markAsDisputed(command.dto.reason, command.userId);
    // Note: Disputes might trigger a status change recalculation depending on business rules
    // For now, we save the state change.
    await this.repo.save(assessment);
    return Result.ok();
  }
}

@CommandHandler(AcknowledgeWarningCommand)
export class AcknowledgeWarningHandler implements ICommandHandler<AcknowledgeWarningCommand> {
  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY) private readonly repo: IReadinessRepository,
  ) {}

  async execute(command: AcknowledgeWarningCommand): Promise<Result<void>> {
    const assessment = await this.repo.findById(command.dto.assessmentId);
    if (!assessment) return Result.fail('Assessment not found');

    const risk = assessment.riskFlags.find((r) => r.id.equals(command.dto.riskId));
    if (!risk) return Result.fail('Risk not found');

    // Acknowledging a warning effectively resolves it as "Accepted Risk"
    assessment.resolveRiskFlag(
      command.dto.riskId,
      command.dto.notes || 'User acknowledged warning',
    );
    await this.repo.save(assessment);
    return Result.ok();
  }
}
