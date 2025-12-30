import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { ComplianceRuleEngineService } from '../../services/compliance-rule-engine.service';
import { ContextAnalyzerService } from '../../services/context-analyzer.service';
import { ForceRecalculationCommand } from '../impl/force-recalculation.command';

@CommandHandler(ForceRecalculationCommand)
export class ForceRecalculationHandler implements ICommandHandler<ForceRecalculationCommand> {
  private readonly logger = new Logger(ForceRecalculationHandler.name);

  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
    private readonly complianceEngine: ComplianceRuleEngineService,
    private readonly contextAnalyzer: ContextAnalyzerService,
  ) {}

  async execute(command: ForceRecalculationCommand): Promise<Result<void>> {
    const { assessmentId, triggerReason } = command.dto;

    try {
      const assessment = await this.repository.findById(assessmentId);
      if (!assessment) {
        return Result.fail<void>('Assessment not found');
      }

      // 1. Refresh Context (e.g. maybe family structure changed)
      const freshContext = await this.contextAnalyzer.analyzeContext(
        assessment.estateId,
        assessment.familyId || '',
      );

      // Update context if changed (Aggregate handles "is it actually different?" check)
      assessment.updateContext(freshContext, 'recalculation_start');

      // 2. Run Fresh Rules
      // Note: In a real scenario, we might merge these with existing manual overrides
      const freshRisks = await this.complianceEngine.runInitialChecks(
        assessment.estateId,
        assessment.familyId || '',
        freshContext,
      );

      // 3. Update Aggregate State
      // We iterate through fresh risks. If they are new, add them.
      // Existing resolved risks should stay resolved unless re-opened logic applies.
      // For simplicity here, we assume the aggregate's 'recalculate' method or similar logic handles merging.
      // Since `recalculate` in Aggregate is parameter-less, we might need to expose a method to inject fresh risks,
      // OR we rely on the Event Handlers to add specific risks.
      // However, for a "Full Refresh", we typically want to detect *new* risks.

      freshRisks.forEach((risk) => {
        try {
          assessment.addRiskFlag(risk);
        } catch {
          // Duplicate risk ignored
        }
      });

      // 4. Trigger Recalculation logic
      assessment.recalculate(triggerReason || 'manual_force');

      await this.repository.save(assessment);
      return Result.ok<void>();
    } catch (error) {
      this.logger.error(`Failed to recalculate assessment ${assessmentId}`, error.stack);
      return Result.fail<void>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
