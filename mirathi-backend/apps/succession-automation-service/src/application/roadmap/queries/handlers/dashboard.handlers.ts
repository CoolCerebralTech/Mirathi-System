// src/succession-automation/src/application/roadmap/queries/handlers/dashboard.handlers.ts
import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { IRoadmapRepository } from '../../../../domain/repositories/i-roadmap.repository';
import { EXECUTOR_ROADMAP_REPOSITORY } from '../../../../domain/repositories/i-roadmap.repository';
import { Result } from '../../../common/result';
import { CriticalPathEngineService } from '../../services/smart-navigation/critical-path-engine.service';
import {
  GetCriticalPathQuery,
  GetRoadmapAnalyticsQuery,
  GetRoadmapDashboardQuery,
} from '../impl/dashboard.queries';
import { RoadmapAnalyticsVm } from '../view-models/roadmap-analytics.vm';
import { RoadmapDashboardVm } from '../view-models/roadmap-dashboard.vm';
import { RoadmapTaskSummaryVm } from '../view-models/task-detail.vm';

// ==================== DASHBOARD HANDLER ====================

@QueryHandler(GetRoadmapDashboardQuery)
export class GetRoadmapDashboardHandler implements IQueryHandler<GetRoadmapDashboardQuery> {
  private readonly logger = new Logger(GetRoadmapDashboardHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
  ) {}

  async execute(query: GetRoadmapDashboardQuery): Promise<Result<RoadmapDashboardVm>> {
    const { roadmapId } = query.dto;
    const traceId = query.traceId;

    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) {
        return Result.fail(`Roadmap not found: ${roadmapId}`);
      }

      const vm = RoadmapDashboardVm.fromAggregate(roadmap);
      return Result.ok(vm);
    } catch (error) {
      this.logger.error(`[${traceId}] Failed to get dashboard`, error);
      return Result.fail(new Error('Failed to retrieve dashboard'));
    }
  }
}

// ==================== ANALYTICS HANDLER ====================

@QueryHandler(GetRoadmapAnalyticsQuery)
export class GetRoadmapAnalyticsHandler implements IQueryHandler<GetRoadmapAnalyticsQuery> {
  private readonly logger = new Logger(GetRoadmapAnalyticsHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
  ) {}

  async execute(query: GetRoadmapAnalyticsQuery): Promise<Result<RoadmapAnalyticsVm>> {
    const { roadmapId } = query.dto;

    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) return Result.fail('Roadmap not found');

      const vm = RoadmapAnalyticsVm.fromAggregate(roadmap);
      return Result.ok(vm);
    } catch (error) {
      this.logger.error(`Failed to get analytics`, error);
      return Result.fail(new Error('Failed to retrieve analytics'));
    }
  }
}

// ==================== CRITICAL PATH HANDLER ====================

@QueryHandler(GetCriticalPathQuery)
export class GetCriticalPathHandler implements IQueryHandler<GetCriticalPathQuery> {
  private readonly logger = new Logger(GetCriticalPathHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
    private readonly criticalPathService: CriticalPathEngineService,
  ) {}

  async execute(query: GetCriticalPathQuery): Promise<Result<RoadmapTaskSummaryVm[]>> {
    const { roadmapId } = query.dto;

    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) return Result.fail('Roadmap not found');

      // Calculate critical path dynamically based on current state
      const criticalPathResult = this.criticalPathService.identifyCriticalPath([...roadmap.tasks]);

      if (criticalPathResult.isFailure) {
        return Result.fail(criticalPathResult.error || 'Failed to calculate critical path');
      }

      const tasks = criticalPathResult.getValue();
      const vms = tasks.map((t) => RoadmapTaskSummaryVm.fromEntity(t));

      return Result.ok(vms);
    } catch (error) {
      this.logger.error(`Failed to get critical path`, error);
      return Result.fail(new Error('Failed to retrieve critical path'));
    }
  }
}
