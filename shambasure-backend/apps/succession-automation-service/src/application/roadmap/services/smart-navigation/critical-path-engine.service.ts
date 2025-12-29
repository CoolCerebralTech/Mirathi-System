// src/succession-automation/src/application/roadmap/services/smart-navigation/critical-path-engine.service.ts
import { Injectable } from '@nestjs/common';

import { RoadmapTask, TaskStatus } from '../../../../domain/entities/roadmap-task.entity';
import { Result } from '../../../common/result';

interface TaskNode {
  id: string;
  durationDays: number;
  earlyStart: number;
  earlyFinish: number;
  latestStart: number;
  latestFinish: number;
  dependencies: string[]; // Incoming edges
  dependents: string[]; // Outgoing edges
  taskRef: RoadmapTask;
}

@Injectable()
export class CriticalPathEngineService {
  /**
   * Identifies the sequence of tasks that determine the minimum project duration.
   * Any delay in these tasks directly delays the estate closure.
   */
  public identifyCriticalPath(tasks: RoadmapTask[]): Result<RoadmapTask[]> {
    try {
      if (!tasks || tasks.length === 0) {
        return Result.ok([]);
      }

      // 1. Build the Graph
      const graph = this.buildGraph(tasks);

      // 2. Forward Pass (Calculate Early Start & Early Finish)
      this.performForwardPass(graph);

      // 3. Backward Pass (Calculate Late Start & Late Finish)
      this.performBackwardPass(graph);

      // 4. Identify Critical Nodes (Float = 0)
      const criticalTasks = Object.values(graph)
        .filter((node) => this.calculateFloat(node) === 0)
        // Sort by phase and order for logical flow
        .sort((a, b) => {
          if (a.taskRef.phase !== b.taskRef.phase) {
            return a.taskRef.phase - b.taskRef.phase;
          }
          return a.taskRef.orderIndex - b.taskRef.orderIndex;
        })
        .map((node) => node.taskRef);

      return Result.ok(criticalTasks);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Failed to calculate critical path'),
      );
    }
  }

  /**
   * Suggests tasks that can be executed in parallel to speed up the process.
   * Returns tasks that have dependencies met but are NOT on the critical path.
   */
  public findParallelOpportunities(tasks: RoadmapTask[]): Result<RoadmapTask[]> {
    try {
      const graph = this.buildGraph(tasks);
      this.performForwardPass(graph);
      this.performBackwardPass(graph);

      // Tasks with Float > 0 are candidates for flexibility/parallel execution
      const parallelTasks = Object.values(graph)
        .filter((node) => {
          const float = this.calculateFloat(node);
          const isPending = node.taskRef.status === TaskStatus.PENDING;
          return float > 0 && isPending;
        })
        .map((node) => node.taskRef);

      return Result.ok(parallelTasks);
    } catch {
      return Result.fail(new Error('Failed to identify parallel opportunities'));
    }
  }

  // ==================== PRIVATE GRAPH LOGIC ====================

  private buildGraph(tasks: RoadmapTask[]): Record<string, TaskNode> {
    const graph: Record<string, TaskNode> = {};

    // Initialize nodes
    tasks.forEach((task) => {
      // Convert minutes to days (ceil) for CPM, min 1 day
      const durationDays = Math.ceil((task.estimatedTimeMinutes || 60) / (60 * 8));

      graph[task.id.toString()] = {
        id: task.id.toString(),
        durationDays: Math.max(1, durationDays), // Minimum 1 day for calculation
        earlyStart: 0,
        earlyFinish: 0,
        latestStart: Infinity,
        latestFinish: Infinity,
        dependencies: task.dependsOnTaskIds,
        dependents: [], // Populated next
        taskRef: task,
      };
    });

    // Populate dependents (outgoing edges)
    Object.values(graph).forEach((node) => {
      node.dependencies.forEach((depId) => {
        if (graph[depId]) {
          graph[depId].dependents.push(node.id);
        }
      });
    });

    return graph;
  }

  private performForwardPass(graph: Record<string, TaskNode>): void {
    const nodes = Object.values(graph);

    // Topological sort simulation (simple iteration for DAG)
    // We iterate until no changes occur to handle deep dependency chains
    let changed = true;
    while (changed) {
      changed = false;
      nodes.forEach((node) => {
        // Early Start = Max(Early Finish of all dependencies)
        let maxDepEarlyFinish = 0;

        node.dependencies.forEach((depId) => {
          if (graph[depId]) {
            maxDepEarlyFinish = Math.max(maxDepEarlyFinish, graph[depId].earlyFinish);
          }
        });

        const newEarlyStart = maxDepEarlyFinish;
        const newEarlyFinish = newEarlyStart + node.durationDays;

        if (node.earlyStart !== newEarlyStart || node.earlyFinish !== newEarlyFinish) {
          node.earlyStart = newEarlyStart;
          node.earlyFinish = newEarlyFinish;
          changed = true;
        }
      });
    }
  }

  private performBackwardPass(graph: Record<string, TaskNode>): void {
    const nodes = Object.values(graph);

    // Find project duration (max Early Finish)
    const projectDuration = Math.max(...nodes.map((n) => n.earlyFinish));

    // Initialize end nodes
    nodes.forEach((node) => {
      if (node.dependents.length === 0) {
        node.latestFinish = projectDuration;
        node.latestStart = node.latestFinish - node.durationDays;
      }
    });

    // Iterate backwards until stable
    let changed = true;
    while (changed) {
      changed = false;
      nodes.forEach((node) => {
        if (node.dependents.length > 0) {
          // Latest Finish = Min(Latest Start of all dependents)
          let minDependentLateStart = Infinity;

          node.dependents.forEach((depId) => {
            if (graph[depId]) {
              minDependentLateStart = Math.min(minDependentLateStart, graph[depId].latestStart);
            }
          });

          const newLateFinish = minDependentLateStart;
          const newLateStart = newLateFinish - node.durationDays;

          if (node.latestFinish !== newLateFinish || node.latestStart !== newLateStart) {
            node.latestFinish = newLateFinish;
            node.latestStart = newLateStart;
            changed = true;
          }
        }
      });
    }
  }

  private calculateFloat(node: TaskNode): number {
    return node.latestStart - node.earlyStart;
  }
}
