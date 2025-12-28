// src/succession-automation/src/domain/repositories/i-roadmap.repository.ts
import { ExecutorRoadmap, RoadmapPhase } from '../aggregates/executor-roadmap.aggregate';
import {
  RoadmapTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../entities/roadmap-task.entity';

/**
 * Executor Roadmap Repository Interface
 *
 * PURPOSE: Define the contract for persisting and retrieving ExecutorRoadmap aggregates
 *
 * IMPLEMENTATION NOTE:
 * Infrastructure layer (PrismaRoadmapRepository) will implement this.
 */

export interface IRoadmapRepository {
  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Save a new roadmap or update existing
   * IMPORTANT: Must persist all child entities (Tasks) atomically
   */
  save(roadmap: ExecutorRoadmap): Promise<void>;

  /**
   * Find roadmap by aggregate ID
   */
  findById(id: string): Promise<ExecutorRoadmap | null>;

  /**
   * Find roadmap by estate ID
   * BUSINESS RULE: One roadmap per estate
   */
  findByEstateId(estateId: string): Promise<ExecutorRoadmap | null>;

  /**
   * Check if roadmap exists for estate
   */
  existsByEstateId(estateId: string): Promise<boolean>;

  /**
   * Delete roadmap (soft delete)
   */
  delete(id: string): Promise<void>;

  // ==================== QUERY BY PHASE ====================

  /**
   * Find all roadmaps in a specific phase
   * Use case: Dashboard showing all cases in "FILING_AND_GAZETTE" phase
   */
  findByPhase(phase: RoadmapPhase): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps ready to file (PRE_FILING phase complete)
   */
  findReadyToFile(): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps in distribution phase
   */
  findInDistribution(): Promise<ExecutorRoadmap[]>;

  /**
   * Find completed roadmaps
   */
  findCompleted(): Promise<ExecutorRoadmap[]>;

  // ==================== QUERY BY PROGRESS ====================

  /**
   * Find roadmaps by progress percentage range
   * Use case: "Show me all cases 50-75% complete"
   */
  findByProgressRange(minPercent: number, maxPercent: number): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps with high completion rate (>= 80%)
   */
  findNearCompletion(): Promise<ExecutorRoadmap[]>;

  /**
   * Find stalled roadmaps (no progress in X days)
   */
  findStalled(staleDays: number): Promise<ExecutorRoadmap[]>;

  // ==================== TASK-BASED QUERIES ====================

  /**
   * Find roadmaps with overdue tasks
   * Use case: Send reminders to users
   */
  findWithOverdueTasks(): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps with tasks in specific status
   */
  findByTaskStatus(status: TaskStatus): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps with tasks in specific category
   * Use case: "Show all cases stuck on GUARDIAN_APPOINTMENT"
   */
  findByTaskCategory(category: TaskCategory): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps with critical priority tasks pending
   */
  findWithCriticalTasks(): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps with specific task
   * Use case: "Show all cases that need Chief's Letter"
   */
  findByTaskTitle(taskTitle: string): Promise<ExecutorRoadmap[]>;

  // ==================== MILESTONE QUERIES ====================

  /**
   * Find roadmaps that achieved a specific milestone
   */
  findByMilestone(milestoneName: string): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps that achieved milestone in date range
   */
  findMilestoneAchievedBetween(
    milestoneName: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ExecutorRoadmap[]>;

  // ==================== STATISTICS ====================

  /**
   * Count total roadmaps
   */
  count(): Promise<number>;

  /**
   * Count roadmaps by phase
   */
  countByPhase(phase: RoadmapPhase): Promise<number>;

  /**
   * Get average completion percentage
   */
  getAverageCompletionRate(): Promise<number>;

  /**
   * Get average time to complete (from creation to closed)
   */
  getAverageTimeToComplete(): Promise<number>; // Days

  /**
   * Get most common bottleneck tasks
   * Use case: Identify which tasks users get stuck on
   */
  getMostCommonBottlenecks(limit: number): Promise<
    Array<{
      taskTitle: string;
      category: string;
      averageDurationDays: number;
      stuckCount: number;
    }>
  >;

  /**
   * Get task completion rates by category
   */
  getTaskCompletionRates(): Promise<
    Array<{
      category: string;
      totalTasks: number;
      completedTasks: number;
      skippedTasks: number;
      averageDurationDays: number;
    }>
  >;

  /**
   * Get phase completion statistics
   */
  getPhaseStatistics(): Promise<
    Array<{
      phase: string;
      totalRoadmaps: number;
      averageTimeInPhase: number; // Days
      completionRate: number; // Percentage
    }>
  >;

  // ==================== BATCH OPERATIONS ====================

  /**
   * Save multiple roadmaps in a single transaction
   */
  saveAll(roadmaps: ExecutorRoadmap[]): Promise<void>;

  /**
   * Find roadmaps by multiple estate IDs
   */
  findByEstateIds(estateIds: string[]): Promise<ExecutorRoadmap[]>;

  /**
   * Update multiple roadmaps' phases
   */
  bulkUpdatePhase(roadmapIds: string[], newPhase: RoadmapPhase): Promise<void>;

  /**
   * Mark multiple tasks as overdue (cron job)
   */
  bulkMarkTasksOverdue(taskIds: string[]): Promise<void>;

  // ==================== USER-SPECIFIC QUERIES ====================

  /**
   * Find roadmaps with tasks assigned to user
   * (Tasks have completedBy field, but we want pending tasks for a user)
   */
  findByUserId(userId: string): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps where user completed tasks recently
   */
  findRecentActivityByUser(userId: string, days: number): Promise<ExecutorRoadmap[]>;

  // ==================== SUCCESSION CONTEXT QUERIES ====================

  /**
   * Find roadmaps by succession regime
   * Use case: "Show all Intestate cases"
   */
  findBySuccessionRegime(regime: string): Promise<ExecutorRoadmap[]>;

  /**
   * Find Islamic roadmaps (Kadhi's Court)
   */
  findIslamicRoadmaps(): Promise<ExecutorRoadmap[]>;

  /**
   * Find polygamous estate roadmaps (Section 40)
   */
  findPolygamousRoadmaps(): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps involving minors
   */
  findRoadmapsWithMinors(): Promise<ExecutorRoadmap[]>;

  // ==================== AUDIT & COMPLIANCE ====================

  /**
   * Get roadmap history (all versions via event sourcing)
   */
  getHistory(roadmapId: string): Promise<
    Array<{
      version: number;
      eventType: string;
      occurredAt: Date;
      payload: any;
    }>
  >;

  /**
   * Get task completion history for roadmap
   */
  getTaskCompletionHistory(roadmapId: string): Promise<
    Array<{
      taskId: string;
      taskTitle: string;
      completedAt: Date;
      completedBy: string;
      durationDays: number;
    }>
  >;

  /**
   * Get roadmap snapshot at specific point in time
   */
  getSnapshotAt(roadmapId: string, timestamp: Date): Promise<ExecutorRoadmap | null>;

  // ==================== ADVANCED ANALYTICS ====================

  /**
   * Get task duration analytics
   * Use case: Understand how long each task type takes
   */
  getTaskDurationAnalytics(): Promise<
    Array<{
      taskCategory: string;
      taskTitle: string;
      averageDurationDays: number;
      minDurationDays: number;
      maxDurationDays: number;
      completionRate: number;
    }>
  >;

  /**
   * Get phase transition timeline
   * Use case: Track when roadmaps move through phases
   */
  getPhaseTransitionTimeline(roadmapId: string): Promise<
    Array<{
      phase: string;
      enteredAt: Date;
      exitedAt?: Date;
      durationDays?: number;
    }>
  >;

  /**
   * Get roadmaps that need attention
   * (Overdue tasks + stalled progress + critical tasks pending)
   */
  findNeedingAttention(): Promise<ExecutorRoadmap[]>;

  /**
   * Find roadmaps with similar patterns
   * Use case: Predict completion time based on similar cases
   */
  findSimilarRoadmaps(
    roadmapId: string,
    limit: number,
  ): Promise<
    Array<{
      roadmap: ExecutorRoadmap;
      similarityScore: number; // 0-100
      completionTimeDays?: number;
    }>
  >;

  // ==================== TASK SEARCH ====================

  /**
   * Search tasks across all roadmaps
   * Use case: "Find all 'Obtain Chief's Letter' tasks that are overdue"
   */
  searchTasks(criteria: TaskSearchCriteria): Promise<
    Array<{
      roadmap: ExecutorRoadmap;
      task: RoadmapTask;
    }>
  >;
}

/**
 * Task Search Criteria
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

/**
 * Query Options for Pagination & Sorting
 */
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Extended Repository Interface with Pagination Support
 */
export interface IRoadmapRepositoryPaginated extends IRoadmapRepository {
  /**
   * Find with pagination
   */
  findAll(options: QueryOptions): Promise<{
    items: ExecutorRoadmap[];
    total: number;
    page: number;
    pages: number;
  }>;

  /**
   * Find by phase with pagination
   */
  findByPhasePaginated(
    phase: RoadmapPhase,
    options: QueryOptions,
  ): Promise<{
    items: ExecutorRoadmap[];
    total: number;
    page: number;
    pages: number;
  }>;

  /**
   * Find by user with pagination
   */
  findByUserIdPaginated(
    userId: string,
    options: QueryOptions,
  ): Promise<{
    items: ExecutorRoadmap[];
    total: number;
    page: number;
    pages: number;
  }>;
}

/**
 * Repository Factory (for testing/mocking)
 */
export interface IRoadmapRepositoryFactory {
  create(): IRoadmapRepository;
}
