// src/succession-automation/src/application/roadmap/commands/handlers/generate-roadmap.handler.ts
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { ExecutorRoadmap } from '../../../../domain/aggregates/executor-roadmap.aggregate';
// FIX 1: Use 'import type' for interfaces to satisfy TS1272 in isolatedModules
import type { IRoadmapRepository } from '../../../../domain/repositories/i-roadmap.repository';
import { EXECUTOR_ROADMAP_REPOSITORY } from '../../../../domain/repositories/i-roadmap.repository';
import { Result } from '../../../common/result';
import { PredictiveAnalysisService } from '../../services/smart-navigation/predictive-analysis.service';
import { GenerateRoadmapCommand } from '../impl/generate-roadmap.command';

// Mock interface for Readiness Repo (since I don't have the file)
interface IReadinessAssessmentRepository {
  findById(id: string): Promise<any>;
}

@CommandHandler(GenerateRoadmapCommand)
export class GenerateRoadmapHandler implements ICommandHandler<GenerateRoadmapCommand> {
  private readonly logger = new Logger(GenerateRoadmapHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,

    @Inject('READINESS_ASSESSMENT_REPOSITORY')
    private readonly readinessRepository: IReadinessAssessmentRepository,

    private readonly predictiveService: PredictiveAnalysisService,
    // FIX 2: Use EventBus directly instead of EventPublisher
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: GenerateRoadmapCommand): Promise<Result<string>> {
    // FIX 3: DTO now has userId property
    const { estateId, readinessAssessmentId, executorName, userId, estateValueKES } = command.dto;
    const traceId = command.traceId;

    this.logger.log(`[${traceId}] Processing GenerateRoadmapCommand for Estate: ${estateId}`);

    try {
      // 1. IDEMPOTENCY CHECK
      const existingRoadmap = await this.roadmapRepository.existsByEstateId(estateId);
      if (existingRoadmap) {
        return Result.fail(`Roadmap already exists for Estate ID: ${estateId}`);
      }

      // 2. FETCH CONTEXT
      const readinessAssessment = await this.readinessRepository.findById(readinessAssessmentId);

      if (!readinessAssessment) {
        return Result.fail(`Readiness Assessment not found: ${readinessAssessmentId}`);
      }

      if (readinessAssessment.estateId !== estateId) {
        return Result.fail('Mismatch: Readiness Assessment does not belong to provided Estate ID');
      }

      // 3. FACTORY CREATION
      const roadmap = ExecutorRoadmap.autoGenerate(
        estateId,
        readinessAssessment.successionContext,
        readinessAssessmentId,
        readinessAssessment.readinessScore,
        userId,
        executorName,
        estateValueKES,
        [],
      );

      // 4. ENRICHMENT
      const prediction = this.predictiveService.predictTimeline(roadmap);
      if (prediction.isSuccess) {
        this.logger.log(
          `[${traceId}] AI Prediction: ${prediction.getValue().totalDurationDays} days`,
        );
      }

      // 5. PERSISTENCE
      // Save the pure domain entity
      await this.roadmapRepository.save(roadmap);

      // 6. EVENT PUBLISHING (Fix for TS2345)
      // Instead of merging context, we manually extract and publish events.
      // Assuming your AggregateRoot has a method to get uncommitted events (standard DDD pattern)
      // If your AggregateRoot has a different method name (e.g. domainEvents), adjust accordingly.
      const events = roadmap.getDomainEvents(); // Matches your Base Aggregate-Root implementation

      if (events && events.length > 0) {
        // Publish each event to the NestJS EventBus
        events.forEach((event) => this.eventBus.publish(event));

        // Clear events after publishing so they aren't republished
        roadmap.clearEvents();
      }

      this.logger.log(`[${traceId}] Roadmap generated successfully. ID: ${roadmap.id.toString()}`);

      return Result.ok(roadmap.id.toString());
    } catch (error) {
      this.logger.error(
        `[${traceId}] Failed to generate roadmap`,
        error instanceof Error ? error.stack : String(error),
      );
      return Result.fail(new Error('Internal server error during roadmap generation'));
    }
  }
}
