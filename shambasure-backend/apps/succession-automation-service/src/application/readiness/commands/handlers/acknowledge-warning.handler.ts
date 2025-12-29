import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { AcknowledgeWarningCommand } from '../impl/acknowledge-warning.command';

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
      if (!assessment) return Result.fail<void>('Assessment not found');

      const risk = assessment.riskFlags.find((r) => r.id.equals(riskId));
      if (!risk) return Result.fail<void>('Risk not found');

      // Acknowledging is effectively a manual resolution stating "I accept this risk"
      // We explicitly check if it's blocking. Acknowledging a blocking risk isn't usually allowed without fix.
      if (risk.isBlocking) {
        return Result.fail<void>(
          'Cannot simply acknowledge a Blocking/Critical risk. Action required.',
        );
      }

      const ackNotes = notes ? `Acknowledged: ${notes}` : 'User acknowledged warning';

      // Use the aggregate method to resolve
      assessment.resolveRiskFlag(riskId, ackNotes);

      await this.repository.save(assessment);
      this.logger.log(`Warning/Risk ${riskId} acknowledged by ${userId}`);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
