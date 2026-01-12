import { ExecutorRoadmap } from '../entities/executor-roadmap.entity';
import { RoadmapTask } from '../entities/roadmap-task.entity';

// Injection Token
export const EXECUTOR_ROADMAP_REPO = 'EXECUTOR_ROADMAP_REPO';

export interface IExecutorRoadmapRepository {
  findByEstateId(estateId: string): Promise<ExecutorRoadmap | null>;

  save(roadmap: ExecutorRoadmap): Promise<void>;

  /**
   * Bulk save for the initial generation of tasks.
   */
  saveTasks(tasks: RoadmapTask[]): Promise<void>;

  /**
   * Get all tasks for a roadmap, ordered by phase and index.
   */
  getTasks(roadmapId: string): Promise<RoadmapTask[]>;

  /**
   * Find tasks that depend on a specific task ID (for unlocking logic).
   */
  findDependentTasks(taskId: string): Promise<RoadmapTask[]>;
}
