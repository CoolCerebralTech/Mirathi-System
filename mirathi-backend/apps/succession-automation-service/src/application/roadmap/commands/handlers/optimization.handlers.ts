// src/succession-automation/src/application/roadmap/commands/handlers/optimization.handlers.ts
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import type { IRoadmapRepository } from '../../../../domain/repositories/i-roadmap.repository';
import { EXECUTOR_ROADMAP_REPOSITORY } from '../../../../domain/repositories/i-roadmap.repository';
import { Result } from '../../../common/result';
import { CriticalPathEngineService } from '../../services/smart-navigation/critical-path-engine.service';
import { PredictiveAnalysisService } from '../../services/smart-navigation/predictive-analysis.service';
import { OptimizeRoadmapCommand } from '../impl/optimization.commands';

@CommandHandler(OptimizeRoadmapCommand)
export class OptimizeRoadmapHandler implements ICommandHandler<OptimizeRoadmapCommand> {
  private readonly logger = new Logger(OptimizeRoadmapHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
    private readonly predictiveService: PredictiveAnalysisService,
    private readonly criticalPathService: CriticalPathEngineService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: OptimizeRoadmapCommand): Promise<Result<void>> {
    const { roadmapId } = command.dto;
    const traceId = command.traceId;

    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) return Result.fail(`Roadmap not found: ${roadmapId}`);

      // 1. Identify Critical Path (Application Service)
      // This tells us which tasks cannot be delayed
      const criticalPathResult = this.criticalPathService.identifyCriticalPath([...roadmap.tasks]);
      const criticalPathIds = criticalPathResult.isSuccess
        ? criticalPathResult.getValue().map((t) => t.id.toString())
        : [];

      // 2. Predict Timeline (Application Service)
      // Uses Kenya-specific data to guess completion
      const prediction = this.predictiveService.predictTimeline(roadmap);

      if (prediction.isSuccess) {
        // 3. Apply Optimization (Domain Logic)
        // In a real system, we might update specific dates on tasks here
        // based on the prediction service output.
        // For now, the aggregate's optimization method handles internal logic
        // but we could pass the critical path IDs to it if we extended the method.

        roadmap.optimizeRoadmap();

        // Example: Update due dates based on service calculation
        const suggestedDates = this.predictiveService.suggestTaskDueDates(roadmap, criticalPathIds);
        suggestedDates.forEach((date, taskId) => {
          const task = roadmap.tasks.find((t) => t.id.equals(taskId));
          if (task) task.updateDueDate(date, 'AI_OPTIMIZER');
        });
      }

      await this.roadmapRepository.save(roadmap);

      roadmap.getDomainEvents().forEach((e) => this.eventBus.publish(e));
      roadmap.clearEvents();

      this.logger.log(
        `[${traceId}] Roadmap optimized. Critical Path length: ${criticalPathIds.length}`,
      );
      return Result.ok();
    } catch (error) {
      this.logger.error(`[${traceId}] Optimization failed`, error);
      return Result.fail(error instanceof Error ? error : new Error('Optimization failed'));
    }
  }
}
