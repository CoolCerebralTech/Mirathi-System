// src/succession-automation/src/domain/repositories/i-roadmap.repository.ts
import { ExecutorRoadmap, RoadmapPhase } from '../aggregates/executor-roadmap.aggregate';
import {
  RoadmapTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../entities/roadmap-task.entity';

export const EXECUTOR_ROADMAP_REPOSITORY = 'EXECUTOR_ROADMAP_REPOSITORY';

/**
 * Standard Pagination Options
 */
export interface RepositoryQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Result Wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

/**
 * Criteria for searching specific tasks across roadmaps
 */
export interface TaskSearchCriteria {
  title?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  priority?: TaskPriority;
  isOverdue?: boolean;
  tags?: string[];
  estateId?: string;
}

export interface IRoadmapRepository {
  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Save roadmap and all child tasks atomically
   */
  save(roadmap: ExecutorRoadmap): Promise<void>;

  findById(id: string): Promise<ExecutorRoadmap | null>;
  findByEstateId(estateId: string): Promise<ExecutorRoadmap | null>;
  existsByEstateId(estateId: string): Promise<boolean>;
  delete(id: string): Promise<void>;

  // ==================== QUERY BY PHASE ====================

  findByPhase(phase: RoadmapPhase): Promise<ExecutorRoadmap[]>;
  findReadyToFile(): Promise<ExecutorRoadmap[]>;
  findInDistribution(): Promise<ExecutorRoadmap[]>;
  findCompleted(): Promise<ExecutorRoadmap[]>;

  // ==================== QUERY BY PROGRESS ====================

  findByProgressRange(minPercent: number, maxPercent: number): Promise<ExecutorRoadmap[]>;
  findStalled(staleDays: number): Promise<ExecutorRoadmap[]>;

  // ==================== TASK-BASED QUERIES (Aggregate Level) ====================

  /**
   * Find roadmaps that have at least one overdue task
   */
  findWithOverdueTasks(): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps containing tasks with specific status
   */
  findByTaskStatus(status: TaskStatus): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps containing tasks of specific category
   */
  findByTaskCategory(category: TaskCategory): Promise<ExecutorRoadmap[]>;

  // ==================== PAGINATION ====================

  findAllPaginated(options: RepositoryQueryOptions): Promise<PaginatedResult<ExecutorRoadmap>>;

  findByPhasePaginated(
    phase: RoadmapPhase,
    options: RepositoryQueryOptions,
  ): Promise<PaginatedResult<ExecutorRoadmap>>;

  findByUserIdPaginated(
    userId: string,
    options: RepositoryQueryOptions,
  ): Promise<PaginatedResult<ExecutorRoadmap>>;

  // ==================== USER SPECIFIC ====================

  findByUserId(userId: string): Promise<ExecutorRoadmap[]>;

  // ==================== ANALYTICS & STATS ====================

  count(): Promise<number>;
  countByPhase(phase: RoadmapPhase): Promise<number>;

  getAverageCompletionRate(): Promise<number>;
  getAverageTimeToComplete(): Promise<number>;

  /**
   * Analytics: Identify tasks that frequently stall roadmaps
   */
  getMostCommonBottlenecks(limit: number): Promise<
    Array<{
      taskTitle: string;
      category: string;
      averageDurationDays: number;
      stuckCount: number;
    }>
  >;

  // ==================== ADVANCED TASK SEARCH ====================

  /**
   * Search specific tasks across multiple roadmaps.
   * Useful for admin dashboards (e.g. "Find all pending Court Filing tasks")
   */
  searchTasks(criteria: TaskSearchCriteria): Promise<
    Array<{
      roadmap: ExecutorRoadmap;
      task: RoadmapTask;
    }>
  >;
}
