// src/succession-automation/src/application/roadmap/services/task-automation/dependency-resolver.service.ts
import { Injectable } from '@nestjs/common';

import { ExecutorRoadmap } from '../../../../domain/aggregates/executor-roadmap.aggregate';
import { TaskStatus } from '../../../../domain/entities/roadmap-task.entity';
import { Result } from '../../../common/result';

export interface UnlockResult {
  unlockedTaskIds: string[];
  roadmapCompleted: boolean;
}

@Injectable()
export class DependencyResolverService {
  /**
   * Evaluates the roadmap state and unlocks any tasks whose dependencies are now met.
   * Call this after ANY task completion or status change.
   */
  public resolveDependencies(roadmap: ExecutorRoadmap): Result<UnlockResult> {
    try {
      const unlockedIds: string[] = [];
      const lockedTasks = roadmap.tasks.filter((t) => t.status === TaskStatus.LOCKED);

      // Get Set of completed/skippable IDs for O(1) lookup
      const completedIds = new Set(
        roadmap.tasks
          .filter(
            (t) =>
              t.status === TaskStatus.COMPLETED ||
              t.status === TaskStatus.SKIPPED ||
              t.status === TaskStatus.WAIVED,
          )
          .map((t) => t.id.toString()),
      );

      // Check each locked task
      for (const task of lockedTasks) {
        // If it has no dependencies, it shouldn't be locked (unless manually blocked), but we check anyway
        if (task.dependsOnTaskIds.length === 0) {
          // Edge case: Initial tasks might be created as locked? Usually PENDING.
          // Assuming we only check tasks that are waiting.
          continue;
        }

        const allDepsMet = task.dependsOnTaskIds.every((depId) => completedIds.has(depId));

        if (allDepsMet) {
          // Check for external blockers (Risk Flags)
          // The aggregate handles 'BLOCKED' status, so if it's 'LOCKED', it's purely dependency-based.
          // However, we double check if the Aggregate says it's blocked by risks.
          if (
            !roadmap.blockedByRiskIds.some((riskId) => task.relatedRiskFlagIds.includes(riskId))
          ) {
            task.unlock('DependencyResolver');
            unlockedIds.push(task.id.toString());
          }
        }
      }

      return Result.ok({
        unlockedTaskIds: unlockedIds,
        roadmapCompleted: roadmap.percentComplete === 100,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Dependency resolution failed'),
      );
    }
  }

  /**
   * Checks if a specific task can be started.
   * Useful for UI "Can I click this?" checks.
   */
  public canStartTask(roadmap: ExecutorRoadmap, taskId: string): boolean {
    const task = roadmap.tasks.find((t) => t.id.equals(taskId));
    if (!task) return false;

    if (task.status !== TaskStatus.PENDING) return false;

    // Double check dependencies just in case state is stale
    const completedIds = new Set(
      roadmap.tasks
        .filter((t) =>
          [TaskStatus.COMPLETED, TaskStatus.SKIPPED, TaskStatus.WAIVED].includes(t.status),
        )
        .map((t) => t.id.toString()),
    );

    return task.dependsOnTaskIds.every((depId) => completedIds.has(depId));
  }
}
