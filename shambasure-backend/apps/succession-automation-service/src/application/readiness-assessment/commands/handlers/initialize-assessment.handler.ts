import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

// Domain
import { ReadinessAssessment } from '../../../../domain/aggregates/readiness-assessment.aggregate';
import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
// FIX: Use 'import type' for interface used in constructor injection
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { Result } from '../../../common/result';
import { ComplianceRuleEngineService } from '../../services/compliance-rule-engine.service';
import { ContextAnalyzerService } from '../../services/context-analyzer.service';
// Application
import { InitializeAssessmentCommand } from '../impl/initialize-assessment.command';

@CommandHandler(InitializeAssessmentCommand)
export class InitializeAssessmentHandler implements ICommandHandler<InitializeAssessmentCommand> {
  private readonly logger = new Logger(InitializeAssessmentHandler.name);

  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
    private readonly contextAnalyzer: ContextAnalyzerService,
    private readonly complianceEngine: ComplianceRuleEngineService,
  ) {}

  async execute(command: InitializeAssessmentCommand): Promise<Result<string>> {
    const { estateId, familyId } = command.dto;

    try {
      this.logger.log(`Initializing Readiness Assessment for Estate: ${estateId}`);

      // 1. Idempotency Check: Does an assessment already exist?
      const existing = await this.repository.findByEstateId(estateId);
      if (existing) {
        this.logger.warn(`Assessment already exists for Estate: ${estateId}`);
        return Result.ok<string>(existing.id.toString());
      }

      // 2. Build the Succession Context
      const context = await this.contextAnalyzer.analyzeContext(estateId, familyId);

      // 3. Run Initial Compliance Checks
      const initialRisks = await this.complianceEngine.runInitialChecks(
        estateId,
        familyId,
        context,
      );

      // 4. Create the Aggregate Root
      const assessment = ReadinessAssessment.create(estateId, familyId, context, initialRisks);

      // 5. Persist
      await this.repository.save(assessment);

      this.logger.log(
        `Readiness Assessment created [${assessment.id.toString()}] with Score: ${
          assessment.readinessScore.score
        }%`,
      );

      return Result.ok<string>(assessment.id.toString());
    } catch (error) {
      this.logger.error(`Failed to initialize assessment for Estate ${estateId}`, error.stack);
      return Result.fail<string>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
