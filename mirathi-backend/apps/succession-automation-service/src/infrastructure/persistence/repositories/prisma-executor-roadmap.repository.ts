// src/succession-automation/src/infrastructure/persistence/repositories/prisma-executor-roadmap.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  ExecutorRoadmap as PrismaExecutorRoadmapModelType,
  RoadmapPhase as PrismaRoadmapPhase,
  RoadmapStatus as PrismaRoadmapStatus,
  RoadmapTask as PrismaRoadmapTaskModelType,
  TaskCategory as PrismaTaskCategory,
  TaskPriority as PrismaTaskPriority,
  TaskStatus as PrismaTaskStatus,
} from '@prisma/client';

import { PrismaService } from '@shamba/database';

import {
  ExecutorRoadmap,
  RoadmapPhase,
} from '../../../domain/aggregates/executor-roadmap.aggregate';
import {
  RoadmapTask,
  TaskCategory,
  TaskStatus,
} from '../../../domain/entities/roadmap-task.entity';
import {
  IRoadmapRepository,
  PaginatedResult,
  RepositoryQueryOptions,
  TaskSearchCriteria,
} from '../../../domain/repositories/i-roadmap.repository';
import {
  ExecutorRoadmapMapper,
  PrismaExecutorRoadmapModel,
} from '../mappers/executor-roadmap.mapper';
import { PrismaRoadmapTaskModel, RoadmapTaskMapper } from '../mappers/roadmap-task.mapper';

@Injectable()
export class PrismaExecutorRoadmapRepository implements IRoadmapRepository {
  private readonly logger = new Logger(PrismaExecutorRoadmapRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== CORE CRUD OPERATIONS ====================

  async save(roadmap: ExecutorRoadmap): Promise<void> {
    try {
      const { roadmap: roadmapData, tasks: tasksData } =
        ExecutorRoadmapMapper.toPersistence(roadmap);

      const roadmapId = roadmap.id.toString();
      const version = roadmap.version;

      await this.prisma.$transaction(async (tx) => {
        // 1. Check existence and Concurrency
        const existing = await tx.executorRoadmap.findUnique({
          where: { id: roadmapId },
          select: { version: true },
        });

        if (existing) {
          if (existing.version !== version - 1 && version > 1) {
            throw new Error(
              `Concurrency conflict: Roadmap ${roadmapId} modified. Expected v${version - 1}, found v${existing.version}`,
            );
          }

          // Update Roadmap Root
          await tx.executorRoadmap.update({
            where: { id: roadmapId },
            data: roadmapData as Prisma.ExecutorRoadmapUpdateInput,
          });

          // Update Tasks (Strategy: Upsert individual tasks, delete orphans)
          // We get all current task IDs from the persistence data
          const currentTaskIds = tasksData.map((t) => t.id);

          // Delete tasks that are no longer in the aggregate
          await tx.roadmapTask.deleteMany({
            where: {
              roadmapId: roadmapId,
              id: { notIn: currentTaskIds },
            },
          });

          // Upsert tasks
          for (const task of tasksData) {
            await tx.roadmapTask.upsert({
              where: { id: task.id },
              update: task as Prisma.RoadmapTaskUpdateInput,
              create: task as Prisma.RoadmapTaskCreateInput,
            });
          }
        } else {
          // Create New Roadmap
          await tx.executorRoadmap.create({
            data: roadmapData as Prisma.ExecutorRoadmapCreateInput,
          });

          // Create Tasks
          if (tasksData.length > 0) {
            await tx.roadmapTask.createMany({
              data: tasksData as Prisma.RoadmapTaskCreateManyInput[],
            });
          }
        }
      });

      this.logger.debug(`[RoadmapRepo] Saved roadmap ${roadmapId} v${version}`);
    } catch (error) {
      this.logger.error(`Failed to save roadmap: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<ExecutorRoadmap | null> {
    try {
      const roadmapModel = await this.prisma.executorRoadmap.findUnique({
        where: { id },
      });

      if (!roadmapModel) return null;

      const taskModels = await this.prisma.roadmapTask.findMany({
        where: { roadmapId: id },
        orderBy: { orderIndex: 'asc' },
      });

      return ExecutorRoadmapMapper.toDomain(
        roadmapModel as unknown as PrismaExecutorRoadmapModel,
        taskModels as unknown as PrismaRoadmapTaskModel[],
      );
    } catch (error) {
      this.logger.error(`Error finding roadmap ${id}: ${error.message}`);
      throw error;
    }
  }

  async findByEstateId(estateId: string): Promise<ExecutorRoadmap | null> {
    try {
      const roadmapModel = await this.prisma.executorRoadmap.findFirst({
        where: { estateId },
      });

      if (!roadmapModel) return null;

      const taskModels = await this.prisma.roadmapTask.findMany({
        where: { roadmapId: roadmapModel.id },
        orderBy: { orderIndex: 'asc' },
      });

      return ExecutorRoadmapMapper.toDomain(
        roadmapModel as unknown as PrismaExecutorRoadmapModel,
        taskModels as unknown as PrismaRoadmapTaskModel[],
      );
    } catch (error) {
      this.logger.error(`Error finding roadmap for estate ${estateId}: ${error.message}`);
      throw error;
    }
  }

  async existsByEstateId(estateId: string): Promise<boolean> {
    const count = await this.prisma.executorRoadmap.count({
      where: { estateId },
    });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.roadmapTask.deleteMany({ where: { roadmapId: id } });
      await tx.executorRoadmap.delete({ where: { id } });
    });
  }

  // ==================== QUERY BY PHASE ====================

  async findByPhase(phase: RoadmapPhase): Promise<ExecutorRoadmap[]> {
    const prismaPhase = phase as unknown as PrismaRoadmapPhase;
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: { currentPhase: prismaPhase },
    });
    return this.loadAggregates(roadmaps);
  }

  async findReadyToFile(): Promise<ExecutorRoadmap[]> {
    // Logic: Phase is PRE_FILING but phase progress indicates completion, OR explicitly managed status
    // Assuming status logic in domain mirrors this
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        currentPhase: PrismaRoadmapPhase.PRE_FILING,
        percentComplete: { gte: 80 }, // Heuristic
        status: { not: PrismaRoadmapStatus.BLOCKED },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  async findInDistribution(): Promise<ExecutorRoadmap[]> {
    return this.findByPhase(RoadmapPhase.DISTRIBUTION);
  }

  async findCompleted(): Promise<ExecutorRoadmap[]> {
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: { status: PrismaRoadmapStatus.COMPLETED },
    });
    return this.loadAggregates(roadmaps);
  }

  // ==================== QUERY BY PROGRESS ====================

  async findByProgressRange(minPercent: number, maxPercent: number): Promise<ExecutorRoadmap[]> {
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        percentComplete: {
          gte: minPercent,
          lte: maxPercent,
        },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  async findStalled(staleDays: number): Promise<ExecutorRoadmap[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - staleDays);

    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        lastActiveAt: { lt: cutoff },
        status: { not: PrismaRoadmapStatus.COMPLETED },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  // ==================== TASK-BASED QUERIES ====================

  async findWithOverdueTasks(): Promise<ExecutorRoadmap[]> {
    // Find roadmaps where at least one task is overdue
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        tasks: {
          some: { isOverdue: true },
        },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  async findByTaskStatus(status: TaskStatus): Promise<ExecutorRoadmap[]> {
    const prismaStatus = status as unknown as PrismaTaskStatus;
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        tasks: {
          some: { status: prismaStatus },
        },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  async findByTaskCategory(category: TaskCategory): Promise<ExecutorRoadmap[]> {
    const prismaCategory = category as unknown as PrismaTaskCategory;
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        tasks: {
          some: { category: prismaCategory },
        },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  async findWithCriticalTasks(): Promise<ExecutorRoadmap[]> {
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        tasks: {
          some: {
            priority: PrismaTaskPriority.CRITICAL,
            status: { in: [PrismaTaskStatus.PENDING, PrismaTaskStatus.IN_PROGRESS] },
          },
        },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  async findByTaskTitle(taskTitle: string): Promise<ExecutorRoadmap[]> {
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        tasks: {
          some: {
            title: { contains: taskTitle, mode: 'insensitive' },
          },
        },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  // ==================== PAGINATION ====================

  async findAllPaginated(
    options: RepositoryQueryOptions,
  ): Promise<PaginatedResult<ExecutorRoadmap>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.ExecutorRoadmapOrderByWithRelationInput = options.sortBy
      ? { [options.sortBy]: options.sortOrder || 'desc' }
      : { lastActiveAt: 'desc' };

    const [total, items] = await Promise.all([
      this.prisma.executorRoadmap.count(),
      this.prisma.executorRoadmap.findMany({
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const domainItems = await this.loadAggregates(items);

    return {
      items: domainItems,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  async findByPhasePaginated(
    phase: RoadmapPhase,
    options: RepositoryQueryOptions,
  ): Promise<PaginatedResult<ExecutorRoadmap>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const prismaPhase = phase as unknown as PrismaRoadmapPhase;

    const where = { currentPhase: prismaPhase };
    const orderBy: Prisma.ExecutorRoadmapOrderByWithRelationInput = options.sortBy
      ? { [options.sortBy]: options.sortOrder || 'desc' }
      : { lastActiveAt: 'desc' };

    const [total, items] = await Promise.all([
      this.prisma.executorRoadmap.count({ where }),
      this.prisma.executorRoadmap.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const domainItems = await this.loadAggregates(items);

    return {
      items: domainItems,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  async findByUserIdPaginated(
    userId: string,
    options: RepositoryQueryOptions,
  ): Promise<PaginatedResult<ExecutorRoadmap>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where = { userId };
    const orderBy: Prisma.ExecutorRoadmapOrderByWithRelationInput = options.sortBy
      ? { [options.sortBy]: options.sortOrder || 'desc' }
      : { lastActiveAt: 'desc' };

    const [total, items] = await Promise.all([
      this.prisma.executorRoadmap.count({ where }),
      this.prisma.executorRoadmap.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const domainItems = await this.loadAggregates(items);

    return {
      items: domainItems,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  // ==================== USER SPECIFIC ====================

  async findByUserId(userId: string): Promise<ExecutorRoadmap[]> {
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: { userId },
    });
    return this.loadAggregates(roadmaps);
  }

  async findRecentActivityByUser(userId: string, days: number): Promise<ExecutorRoadmap[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        userId,
        lastActiveAt: { gte: cutoff },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  // ==================== ANALYTICS & STATS ====================

  async count(): Promise<number> {
    return await this.prisma.executorRoadmap.count();
  }

  async countByPhase(phase: RoadmapPhase): Promise<number> {
    const prismaPhase = phase as unknown as PrismaRoadmapPhase;
    return await this.prisma.executorRoadmap.count({
      where: { currentPhase: prismaPhase },
    });
  }

  async getAverageCompletionRate(): Promise<number> {
    const agg = await this.prisma.executorRoadmap.aggregate({
      _avg: { percentComplete: true },
    });
    return agg._avg.percentComplete || 0;
  }

  async getAverageTimeToComplete(): Promise<number> {
    // Only considers completed roadmaps
    // Requires raw query to calc date diff if not storing duration
    const result = await this.prisma.$queryRaw<{ avg_days: number }[]>`
      SELECT AVG(EXTRACT(DAY FROM ("actualCompletionDate" - "startedAt"))) as avg_days
      FROM "executor_roadmaps"
      WHERE status = 'COMPLETED'
      AND "actualCompletionDate" IS NOT NULL
    `;
    return result[0]?.avg_days || 0;
  }

  async getMostCommonBottlenecks(limit: number): Promise<
    Array<{
      taskTitle: string;
      category: string;
      averageDurationDays: number;
      stuckCount: number;
    }>
  > {
    // Bottleneck definition: Tasks that are overdue or blocked often
    const result = await this.prisma.roadmapTask.groupBy({
      by: ['title', 'category'],
      where: {
        OR: [{ isOverdue: true }, { status: PrismaTaskStatus.BLOCKED }],
      },
      _count: {
        id: true, // Frequency of being a bottleneck
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    return result.map((r) => ({
      taskTitle: r.title,
      category: r.category,
      averageDurationDays: 0, // Placeholder, would require complex aggregation
      stuckCount: r._count.id,
    }));
  }

  async getTaskCompletionRates(): Promise<
    Array<{
      category: string;
      totalTasks: number;
      completedTasks: number;
      skippedTasks: number;
      averageDurationDays: number;
    }>
  > {
    const groups = await this.prisma.roadmapTask.groupBy({
      by: ['category'],
      _count: {
        id: true, // total
      },
    });

    // We can't do conditional counts in simple groupBy easily without raw query or multiple queries
    // Simplified implementation: Fetch all and aggregate in memory or use raw query for performance
    // For production with large data, use raw SQL. Here using multiple groupBy for safety/clarity.

    const completedGroups = await this.prisma.roadmapTask.groupBy({
      by: ['category'],
      where: { status: PrismaTaskStatus.COMPLETED },
      _count: { id: true },
    });

    const skippedGroups = await this.prisma.roadmapTask.groupBy({
      by: ['category'],
      where: { status: PrismaTaskStatus.SKIPPED },
      _count: { id: true },
    });

    const map = new Map<string, any>();

    groups.forEach((g) => {
      map.set(g.category, { category: g.category, total: g._count.id, completed: 0, skipped: 0 });
    });

    completedGroups.forEach((g) => {
      const entry = map.get(g.category);
      if (entry) entry.completed = g._count.id;
    });

    skippedGroups.forEach((g) => {
      const entry = map.get(g.category);
      if (entry) entry.skipped = g._count.id;
    });

    return Array.from(map.values()).map((v) => ({
      category: v.category,
      totalTasks: v.total,
      completedTasks: v.completed,
      skippedTasks: v.skipped,
      averageDurationDays: 0, // Requires timestamp diffing
    }));
  }

  async getPhaseStatistics(): Promise<
    Array<{
      phase: string;
      totalRoadmaps: number;
      averageTimeInPhase: number;
      completionRate: number;
    }>
  > {
    const groups = await this.prisma.executorRoadmap.groupBy({
      by: ['currentPhase'],
      _count: { id: true },
      _avg: { percentComplete: true },
    });

    return groups.map((g) => ({
      phase: g.currentPhase,
      totalRoadmaps: g._count.id,
      completionRate: g._avg.percentComplete || 0,
      averageTimeInPhase: 0, // Would require parsing phaseHistory JSON which is hard in DB
    }));
  }

  // ==================== BATCH OPERATIONS ====================

  async saveAll(roadmaps: ExecutorRoadmap[]): Promise<void> {
    // Loop through save logic inside one transaction
    await this.prisma.$transaction(async (tx) => {
      for (const roadmap of roadmaps) {
        // Reuse logic from save() but adapting to 'tx' context would require refactoring save()
        // to accept a TX client. For brevity in this implementation, we implement the core save logic here.
        // In a real app, refactor `save` to be `saveInternal(roadmap, tx)`
        const { roadmap: data, tasks } = ExecutorRoadmapMapper.toPersistence(roadmap);

        await tx.executorRoadmap.upsert({
          where: { id: roadmap.id.toString() },
          update: data as Prisma.ExecutorRoadmapUpdateInput,
          create: data as Prisma.ExecutorRoadmapCreateInput,
        });

        // Note: Full task sync in batch is expensive. Assuming batch updates mostly touch root.
        // Only updating tasks if present
        if (tasks.length > 0) {
          for (const task of tasks) {
            await tx.roadmapTask.upsert({
              where: { id: task.id },
              update: task as Prisma.RoadmapTaskUpdateInput,
              create: task as Prisma.RoadmapTaskCreateInput,
            });
          }
        }
      }
    });
  }

  async findByEstateIds(estateIds: string[]): Promise<ExecutorRoadmap[]> {
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: { estateId: { in: estateIds } },
    });
    return this.loadAggregates(roadmaps);
  }

  async bulkUpdatePhase(roadmapIds: string[], newPhase: RoadmapPhase): Promise<void> {
    const prismaPhase = newPhase as unknown as PrismaRoadmapPhase;
    await this.prisma.executorRoadmap.updateMany({
      where: { id: { in: roadmapIds } },
      data: { currentPhase: prismaPhase, lastActiveAt: new Date() },
    });
  }

  async bulkMarkTasksOverdue(taskIds: string[]): Promise<void> {
    await this.prisma.roadmapTask.updateMany({
      where: { id: { in: taskIds } },
      data: { isOverdue: true },
    });
  }

  // ==================== SUCCESSION CONTEXT QUERIES ====================

  async findBySuccessionRegime(regime: string): Promise<ExecutorRoadmap[]> {
    // Querying JSON field
    // Note: Prisma JSON filtering syntax depends on DB provider (Postgres supported)
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        successionContext: {
          path: ['regime'],
          equals: regime,
        },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  async findIslamicRoadmaps(): Promise<ExecutorRoadmap[]> {
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        successionContext: {
          path: ['religion'],
          equals: 'ISLAMIC',
        },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  async findPolygamousRoadmaps(): Promise<ExecutorRoadmap[]> {
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        successionContext: {
          path: ['marriageType'],
          equals: 'POLYGAMOUS',
        },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  async findRoadmapsWithMinors(): Promise<ExecutorRoadmap[]> {
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        successionContext: {
          path: ['isMinorInvolved'],
          equals: true,
        },
      },
    });
    return this.loadAggregates(roadmaps);
  }

  // ==================== AUDIT & PLACEHOLDERS ====================

  async getHistory(_roadmapId: string): Promise<any[]> {
    await Promise.resolve();
    return []; // Placeholder
  }

  async getTaskCompletionHistory(roadmapId: string): Promise<any[]> {
    // Requires querying Audit Logs or filtering RoadmapTasks history JSON
    // Implementation depends on how `history` JSON is structured in RoadmapTask
    const tasks = await this.prisma.roadmapTask.findMany({
      where: { roadmapId },
      select: { id: true, title: true, history: true },
    });

    // Process JSON in memory (expensive but functional)
    const history: any[] = [];
    tasks.forEach((task) => {
      if (Array.isArray(task.history)) {
        task.history.forEach((entry: any) => {
          if (entry.action === 'COMPLETED') {
            history.push({
              taskId: task.id,
              taskTitle: task.title,
              completedAt: new Date(entry.timestamp),
              completedBy: entry.performedBy,
              durationDays: 0, // Calculate if start time available
            });
          }
        });
      }
    });
    return history;
  }

  async getSnapshotAt(_roadmapId: string, _timestamp: Date): Promise<ExecutorRoadmap | null> {
    await Promise.resolve();
    return null; // Placeholder
  }

  async getTaskDurationAnalytics(): Promise<any[]> {
    await Promise.resolve();
    return []; // Placeholder
  }

  async getPhaseTransitionTimeline(roadmapId: string): Promise<any[]> {
    const roadmap = await this.prisma.executorRoadmap.findUnique({
      where: { id: roadmapId },
      select: { phaseHistory: true },
    });

    if (roadmap && Array.isArray(roadmap.phaseHistory)) {
      return roadmap.phaseHistory;
    }
    return [];
  }

  async findNeedingAttention(): Promise<ExecutorRoadmap[]> {
    // Stalled OR Overdue OR Blocked
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);

    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: {
        OR: [
          { status: PrismaRoadmapStatus.BLOCKED },
          { daysInactive: { gt: 14 } },
          { tasks: { some: { isOverdue: true } } },
        ],
      },
    });
    return this.loadAggregates(roadmaps);
  }

  async findSimilarRoadmaps(_roadmapId: string, _limit: number): Promise<any[]> {
    // Similarity search placeholder
    await Promise.resolve();
    return [];
  }

  async searchTasks(
    criteria: TaskSearchCriteria,
  ): Promise<Array<{ roadmap: ExecutorRoadmap; task: RoadmapTask }>> {
    const where: Prisma.RoadmapTaskWhereInput = {};

    if (criteria.title) where.title = { contains: criteria.title, mode: 'insensitive' };
    if (criteria.category) where.category = criteria.category as unknown as PrismaTaskCategory;
    if (criteria.status) where.status = criteria.status as unknown as PrismaTaskStatus;
    if (criteria.priority) where.priority = criteria.priority as unknown as PrismaTaskPriority;
    if (criteria.isOverdue !== undefined) where.isOverdue = criteria.isOverdue;

    if (criteria.estateId) {
      where.roadmap = { estateId: criteria.estateId };
    }

    const tasks = await this.prisma.roadmapTask.findMany({
      where,
      include: { roadmap: true },
      take: 50,
    });

    // Map results
    // Note: We need to load full aggregates for the roadmap property, which might be N+1 efficient
    // Optimized approach: Group by roadmapId

    const roadmapIds = [...new Set(tasks.map((t) => t.roadmapId))];
    const roadmaps = await this.prisma.executorRoadmap.findMany({
      where: { id: { in: roadmapIds } },
    });

    // We need full aggregates (with all tasks) to create valid Domain objects?
    // Or simpler mapped objects. The interface expects `roadmap: ExecutorRoadmap`.
    // So we must load aggregates.

    const domainRoadmaps = await this.loadAggregates(roadmaps);
    const resultMap: Record<string, ExecutorRoadmap> = {};
    domainRoadmaps.forEach((r) => (resultMap[r.id.toString()] = r));

    return tasks
      .map((t) => ({
        task: PrismaExecutorRoadmapRepository.mapPrismaTaskToDomain(t), // Helper needed or use mapper directly if public
        roadmap: resultMap[t.roadmapId],
      }))
      .filter((r) => !!r.roadmap);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Helper to load full Aggregates with Tasks
   */
  private async loadAggregates(
    roadmapModels: PrismaExecutorRoadmapModelType[],
  ): Promise<ExecutorRoadmap[]> {
    if (roadmapModels.length === 0) return [];

    const roadmapIds = roadmapModels.map((r) => r.id);

    const allTasks = await this.prisma.roadmapTask.findMany({
      where: { roadmapId: { in: roadmapIds } },
      orderBy: { orderIndex: 'asc' },
    });

    const tasksMap = new Map<string, PrismaRoadmapTaskModelType[]>();
    allTasks.forEach((task) => {
      const existing = tasksMap.get(task.roadmapId) || [];
      existing.push(task);
      tasksMap.set(task.roadmapId, existing);
    });

    return roadmapModels.map((model) => {
      const tasks = tasksMap.get(model.id) || [];
      return ExecutorRoadmapMapper.toDomain(
        model as unknown as PrismaExecutorRoadmapModel,
        tasks as unknown as PrismaRoadmapTaskModel[],
      );
    });
  }

  /**
   * Helper to map a single prisma task to domain (for search results)
   * Reuses the logic inside RoadmapTaskMapper but accessible here
   */
  private static mapPrismaTaskToDomain(prismaTask: PrismaRoadmapTaskModelType): RoadmapTask {
    // Correctly using the imported class instead of require()
    return RoadmapTaskMapper.toDomain(prismaTask as unknown as PrismaRoadmapTaskModel);
  }
}
