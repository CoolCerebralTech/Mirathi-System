// src/succession-automation/src/application/roadmap/queries/handlers/task.handlers.ts
import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RoadmapPhase } from 'apps/succession-automation-service/src/domain/aggregates/executor-roadmap.aggregate';

import type { IRoadmapRepository } from '../../../../domain/repositories/i-roadmap.repository';
import { EXECUTOR_ROADMAP_REPOSITORY } from '../../../../domain/repositories/i-roadmap.repository';
import { Result } from '../../../common/result';
import { GetTaskDetailsQuery, GetTaskHistoryQuery, GetTaskListQuery } from '../impl/task.queries';
import { PaginatedListVm } from '../view-models/paginated-list.vm';
import { RoadmapTaskDetailVm, RoadmapTaskSummaryVm } from '../view-models/task-detail.vm';

// ==================== TASK LIST HANDLER ====================

@QueryHandler(GetTaskListQuery)
export class GetTaskListHandler implements IQueryHandler<GetTaskListQuery> {
  private readonly logger = new Logger(GetTaskListHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
  ) {}

  async execute(query: GetTaskListQuery): Promise<Result<PaginatedListVm<RoadmapTaskSummaryVm>>> {
    const {
      roadmapId,
      phase,
      status,
      priority,
      category,
      isOverdue,
      dueWithinDays,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query.dto;

    const traceId = query.traceId;

    try {
      // 1. Fetch Aggregate
      // For Roadmap scale (< 500 tasks), fetching the aggregate is performant and ensures consistency.
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) return Result.fail(`Roadmap not found: ${roadmapId}`);

      let tasks = [...roadmap.tasks];

      // 2. Apply Filters (In-Memory)
      if (phase) {
        const phaseNumber = this.mapPhaseEnumToNumber(phase);
        if (phaseNumber) {
          tasks = tasks.filter((t) => t.phase === phaseNumber);
        }
      }
      if (status && status.length > 0) {
        tasks = tasks.filter((t) => status.includes(t.status));
      }
      if (priority) {
        tasks = tasks.filter((t) => t.priority === priority);
      }
      if (category) {
        tasks = tasks.filter((t) => t.category === category);
      }
      if (isOverdue !== undefined) {
        tasks = tasks.filter((t) => t.isOverdue === isOverdue);
      }
      if (dueWithinDays !== undefined) {
        const now = new Date();
        tasks = tasks.filter((t) => {
          const days = t.getDaysRemaining(now);
          return days !== null && days <= dueWithinDays;
        });
      }

      // 3. Sorting
      tasks.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'dueDate': {
            const dateA = a.dueDate ? a.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
            const dateB = b.dueDate ? b.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
            comparison = dateA - dateB;
            break;
          }
          case 'priority': {
            // High priority (Critical) should come first
            const pScores = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
            comparison = pScores[b.priority] - pScores[a.priority];
            break;
          }
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
          case 'orderIndex':
          default:
            // Secondary sort by phase if sorting by order
            if (a.phase !== b.phase) comparison = a.phase - b.phase;
            else comparison = a.orderIndex - b.orderIndex;
            break;
        }
        return sortOrder === 'DESC' ? -comparison : comparison;
      });

      // 4. Pagination
      const total = tasks.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTasks = tasks.slice(startIndex, endIndex);

      // 5. Mapping
      const vms = paginatedTasks.map((t) => RoadmapTaskSummaryVm.fromEntity(t));

      return Result.ok(new PaginatedListVm(vms, total, page, limit));
    } catch (error) {
      this.logger.error(`[${traceId}] Failed to fetch task list`, error);
      return Result.fail(new Error('Failed to retrieve task list'));
    }
  }
  /**
   * Helper to map string Enum to numeric phase
   */
  private mapPhaseEnumToNumber(phase: RoadmapPhase): number | null {
    const map: Record<RoadmapPhase, number> = {
      [RoadmapPhase.PRE_FILING]: 1,
      [RoadmapPhase.FILING]: 2,
      [RoadmapPhase.CONFIRMATION]: 3,
      [RoadmapPhase.DISTRIBUTION]: 4,
      [RoadmapPhase.CLOSURE]: 5,
    };
    return map[phase] || null;
  }
}

// ==================== TASK DETAILS HANDLER ====================

@QueryHandler(GetTaskDetailsQuery)
export class GetTaskDetailsHandler implements IQueryHandler<GetTaskDetailsQuery> {
  private readonly logger = new Logger(GetTaskDetailsHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
  ) {}

  async execute(query: GetTaskDetailsQuery): Promise<Result<RoadmapTaskDetailVm>> {
    const { roadmapId, taskId } = query.dto;

    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) return Result.fail('Roadmap not found');

      // We need the specific task
      const task = roadmap.tasks.find((t) => t.id.equals(taskId));
      if (!task) return Result.fail('Task not found');

      // We pass 'roadmap.tasks' so the VM can resolve dependency names/status
      const vm = RoadmapTaskDetailVm.fromEntityDetailed(task, [...roadmap.tasks]);

      return Result.ok(vm);
    } catch (error) {
      this.logger.error(`Failed to get task details`, error);
      return Result.fail(new Error('Failed to retrieve task details'));
    }
  }
}

// ==================== TASK HISTORY HANDLER ====================

@QueryHandler(GetTaskHistoryQuery)
export class GetTaskHistoryHandler implements IQueryHandler<GetTaskHistoryQuery> {
  private readonly logger = new Logger(GetTaskHistoryHandler.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPOSITORY)
    private readonly roadmapRepository: IRoadmapRepository,
  ) {}

  async execute(query: GetTaskHistoryQuery): Promise<Result<any[]>> {
    // Using any[] for brevity, ideally a VM
    const { roadmapId, taskId } = query.dto;

    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) return Result.fail('Roadmap not found');

      const task = roadmap.tasks.find((t) => t.id.equals(taskId));
      if (!task) return Result.fail('Task not found');

      // Return the raw history log (View Model handled simply here)
      return Result.ok(task.history);
    } catch (error) {
      this.logger.error(`Failed to get task history`, error);
      return Result.fail(new Error('Failed to retrieve task history'));
    }
  }
}
