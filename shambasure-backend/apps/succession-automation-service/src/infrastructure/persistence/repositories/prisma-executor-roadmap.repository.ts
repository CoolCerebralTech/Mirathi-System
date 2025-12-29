// src/succession-automation/src/infrastructure/persistence/repositories/prisma-executor-roadmap.repository.ts
import { Injectable, Logger } from '@nestjs/common';

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
  IRoadmapRepositoryPaginated,
  QueryOptions,
  TaskSearchCriteria,
} from '../../../domain/repositories/i-roadmap.repository';
import { ExecutorRoadmapMapper } from '../mappers/executor-roadmap.mapper';
import { RoadmapTaskMapper } from '../mappers/roadmap-task.mapper';

@Injectable()
export class PrismaRoadmapRepository implements IRoadmapRepository, IRoadmapRepositoryPaginated {
  private readonly logger = new Logger(PrismaRoadmapRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== CORE CRUD OPERATIONS ====================

  async save(roadmap: ExecutorRoadmap): Promise<void> {
    try {
      const persistenceData = ExecutorRoadmapMapper.toPersistence(roadmap);
      const roadmapId = roadmap.id.toString();
      const version = roadmap.version;

      await this.prisma.$transaction(async (tx) => {
        if (roadmapId) {
          // Update existing roadmap with optimistic concurrency
          await tx.executorRoadmap.update({
            where: {
              id: roadmapId,
              version: version - 1,
            },
            data: persistenceData.roadmap,
          });

          // Delete existing tasks and recreate
          await tx.roadmapTask.deleteMany({
            where: { roadmapId },
          });
        } else {
          // Create new roadmap
          await tx.executorRoadmap.create({
            data: persistenceData.roadmap,
          });
        }

        // Create all tasks
        if (persistenceData.tasks.length > 0) {
          await tx.roadmapTask.createMany({
            data: persistenceData.tasks,
            skipDuplicates: true,
          });
        }
      });

      this.logger.debug(`Roadmap saved: ${roadmapId || 'new'}`);
    } catch (error) {
      this.logger.error(`Failed to save roadmap: ${error.message}`, error.stack);
      throw new Error(`Failed to save executor roadmap: ${error.message}`);
    }
  }

  async findById(id: string): Promise<ExecutorRoadmap | null> {
    try {
      const roadmap = await this.prisma.executorRoadmap.findUnique({
        where: { id },
      });

      if (!roadmap) {
        return null;
      }

      const tasks = await this.prisma.roadmapTask.findMany({
        where: { roadmapId: id },
      });

      return ExecutorRoadmapMapper.toDomain(roadmap, tasks);
    } catch (error) {
      this.logger.error(`Failed to find roadmap by id ${id}: ${error.message}`);
      throw new Error(`Failed to find executor roadmap: ${error.message}`);
    }
  }

  async findByEstateId(estateId: string): Promise<ExecutorRoadmap | null> {
    try {
      const roadmap = await this.prisma.executorRoadmap.findFirst({
        where: { estateId },
      });

      if (!roadmap) {
        return null;
      }

      const tasks = await this.prisma.roadmapTask.findMany({
        where: { roadmapId: roadmap.id },
      });

      return ExecutorRoadmapMapper.toDomain(roadmap, tasks);
    } catch (error) {
      this.logger.error(`Failed to find roadmap by estate ${estateId}: ${error.message}`);
      throw new Error(`Failed to find executor roadmap by estate: ${error.message}`);
    }
  }

  async existsByEstateId(estateId: string): Promise<boolean> {
    try {
      const count = await this.prisma.executorRoadmap.count({
        where: { estateId },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check existence for estate ${estateId}: ${error.message}`);
      throw new Error(`Failed to check roadmap existence: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.roadmapTask.deleteMany({
          where: { roadmapId: id },
        });

        await tx.executorRoadmap.delete({
          where: { id },
        });
      });

      this.logger.debug(`Roadmap deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete roadmap ${id}: ${error.message}`);
      throw new Error(`Failed to delete executor roadmap: ${error.message}`);
    }
  }

  // ==================== QUERY BY PHASE ====================

  async findByPhase(phase: RoadmapPhase): Promise<ExecutorRoadmap[]> {
    try {
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: { currentPhase: phase },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps by phase ${phase}: ${error.message}`);
      throw new Error(`Failed to find roadmaps by phase: ${error.message}`);
    }
  }

  async findReadyToFile(): Promise<ExecutorRoadmap[]> {
    try {
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          currentPhase: 'PRE_FILING',
          percentComplete: { gte: 80 },
          isComplete: false,
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find ready to file roadmaps: ${error.message}`);
      throw new Error(`Failed to find ready to file roadmaps: ${error.message}`);
    }
  }

  async findInDistribution(): Promise<ExecutorRoadmap[]> {
    try {
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          currentPhase: 'DISTRIBUTION',
          isComplete: false,
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find distribution phase roadmaps: ${error.message}`);
      throw new Error(`Failed to find distribution phase roadmaps: ${error.message}`);
    }
  }

  async findCompleted(): Promise<ExecutorRoadmap[]> {
    try {
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          status: 'COMPLETED',
          isComplete: true,
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find completed roadmaps: ${error.message}`);
      throw new Error(`Failed to find completed roadmaps: ${error.message}`);
    }
  }

  // ==================== QUERY BY PROGRESS ====================

  async findByProgressRange(minPercent: number, maxPercent: number): Promise<ExecutorRoadmap[]> {
    try {
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          percentComplete: {
            gte: minPercent,
            lte: maxPercent,
          },
          isComplete: false,
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(
        `Failed to find roadmaps by progress range ${minPercent}-${maxPercent}: ${error.message}`,
      );
      throw new Error(`Failed to find roadmaps by progress range: ${error.message}`);
    }
  }

  async findNearCompletion(): Promise<ExecutorRoadmap[]> {
    try {
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          percentComplete: { gte: 80 },
          isComplete: false,
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find near completion roadmaps: ${error.message}`);
      throw new Error(`Failed to find near completion roadmaps: ${error.message}`);
    }
  }

  async findStalled(staleDays: number): Promise<ExecutorRoadmap[]> {
    try {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - staleDays);

      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          lastActiveAt: { lt: staleDate },
          isComplete: false,
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find stalled roadmaps: ${error.message}`);
      throw new Error(`Failed to find stalled roadmaps: ${error.message}`);
    }
  }

  // ==================== TASK-BASED QUERIES ====================

  async findWithOverdueTasks(): Promise<ExecutorRoadmap[]> {
    try {
      const roadmapIds = await this.prisma.$queryRaw<{ roadmapId: string }[]>`
        SELECT DISTINCT rt."roadmapId"
        FROM "RoadmapTask" rt
        WHERE rt."isOverdue" = true
        AND rt."status" IN ('PENDING', 'IN_PROGRESS')
      `;

      if (roadmapIds.length === 0) {
        return [];
      }

      const ids = roadmapIds.map((r) => r.roadmapId);
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: { id: { in: ids } },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps with overdue tasks: ${error.message}`);
      throw new Error(`Failed to find roadmaps with overdue tasks: ${error.message}`);
    }
  }

  async findByTaskStatus(status: TaskStatus): Promise<ExecutorRoadmap[]> {
    try {
      const roadmapIds = await this.prisma.$queryRaw<{ roadmapId: string }[]>`
        SELECT DISTINCT rt."roadmapId"
        FROM "RoadmapTask" rt
        WHERE rt."status" = ${status}
      `;

      if (roadmapIds.length === 0) {
        return [];
      }

      const ids = roadmapIds.map((r) => r.roadmapId);
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: { id: { in: ids } },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps by task status ${status}: ${error.message}`);
      throw new Error(`Failed to find roadmaps by task status: ${error.message}`);
    }
  }

  async findByTaskCategory(category: TaskCategory): Promise<ExecutorRoadmap[]> {
    try {
      const roadmapIds = await this.prisma.$queryRaw<{ roadmapId: string }[]>`
        SELECT DISTINCT rt."roadmapId"
        FROM "RoadmapTask" rt
        WHERE rt."category" = ${category}
        AND rt."status" IN ('PENDING', 'IN_PROGRESS', 'BLOCKED')
      `;

      if (roadmapIds.length === 0) {
        return [];
      }

      const ids = roadmapIds.map((r) => r.roadmapId);
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: { id: { in: ids } },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps by task category ${category}: ${error.message}`);
      throw new Error(`Failed to find roadmaps by task category: ${error.message}`);
    }
  }

  async findWithCriticalTasks(): Promise<ExecutorRoadmap[]> {
    try {
      const roadmapIds = await this.prisma.$queryRaw<{ roadmapId: string }[]>`
        SELECT DISTINCT rt."roadmapId"
        FROM "RoadmapTask" rt
        WHERE rt."priority" = 'CRITICAL'
        AND rt."status" IN ('PENDING', 'IN_PROGRESS')
      `;

      if (roadmapIds.length === 0) {
        return [];
      }

      const ids = roadmapIds.map((r) => r.roadmapId);
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: { id: { in: ids } },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps with critical tasks: ${error.message}`);
      throw new Error(`Failed to find roadmaps with critical tasks: ${error.message}`);
    }
  }

  async findByTaskTitle(taskTitle: string): Promise<ExecutorRoadmap[]> {
    try {
      const roadmapIds = await this.prisma.$queryRaw<{ roadmapId: string }[]>`
        SELECT DISTINCT rt."roadmapId"
        FROM "RoadmapTask" rt
        WHERE LOWER(rt."title") LIKE LOWER(${'%' + taskTitle + '%'})
        AND rt."status" IN ('PENDING', 'IN_PROGRESS')
      `;

      if (roadmapIds.length === 0) {
        return [];
      }

      const ids = roadmapIds.map((r) => r.roadmapId);
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: { id: { in: ids } },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps by task title ${taskTitle}: ${error.message}`);
      throw new Error(`Failed to find roadmaps by task title: ${error.message}`);
    }
  }

  // ==================== MILESTONE QUERIES ====================

  async findByMilestone(milestoneName: string): Promise<ExecutorRoadmap[]> {
    try {
      // Milestones can be stored in task completion history or phase history
      // For now, we'll search by task title or phase completion
      let roadmaps: any[] = [];

      if (milestoneName.includes('Phase')) {
        // Parse phase from milestone name
        const phaseMap: Record<string, RoadmapPhase> = {
          'Pre-Filing': 'PRE_FILING',
          Filing: 'FILING',
          Confirmation: 'CONFIRMATION',
          Distribution: 'DISTRIBUTION',
          Closure: 'CLOSURE',
        };

        const phase = phaseMap[milestoneName.split(' ')[0]];
        if (phase) {
          roadmaps = await this.prisma.executorRoadmap.findMany({
            where: { currentPhase: phase },
          });
        }
      } else {
        // Search by task completion
        const completedRoadmapIds = await this.prisma.$queryRaw<{ roadmapId: string }[]>`
          SELECT DISTINCT rt."roadmapId"
          FROM "RoadmapTask" rt
          WHERE LOWER(rt."title") LIKE LOWER(${'%' + milestoneName + '%'})
          AND rt."status" = 'COMPLETED'
        `;

        if (completedRoadmapIds.length > 0) {
          const ids = completedRoadmapIds.map((r) => r.roadmapId);
          roadmaps = await this.prisma.executorRoadmap.findMany({
            where: { id: { in: ids } },
          });
        }
      }

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps by milestone ${milestoneName}: ${error.message}`);
      throw new Error(`Failed to find roadmaps by milestone: ${error.message}`);
    }
  }

  async findMilestoneAchievedBetween(
    milestoneName: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ExecutorRoadmap[]> {
    try {
      // This would require task completion history with timestamps
      // For now, simplified implementation
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
          isComplete: false,
        },
      });

      // Filter roadmaps that likely achieved the milestone (simplified)
      const filteredRoadmaps = roadmaps.filter((roadmap) => {
        // Check if roadmap progressed during this period
        return true; // Simplified
      });

      return await this.loadRoadmapsWithTasks(filteredRoadmaps);
    } catch (error) {
      this.logger.error(`Failed to find milestone achievements: ${error.message}`);
      throw new Error(`Failed to find milestone achievements: ${error.message}`);
    }
  }

  // ==================== STATISTICS ====================

  async count(): Promise<number> {
    try {
      return await this.prisma.executorRoadmap.count();
    } catch (error) {
      this.logger.error(`Failed to count roadmaps: ${error.message}`);
      throw new Error(`Failed to count roadmaps: ${error.message}`);
    }
  }

  async countByPhase(phase: RoadmapPhase): Promise<number> {
    try {
      return await this.prisma.executorRoadmap.count({
        where: { currentPhase: phase },
      });
    } catch (error) {
      this.logger.error(`Failed to count roadmaps by phase ${phase}: ${error.message}`);
      throw new Error(`Failed to count roadmaps by phase: ${error.message}`);
    }
  }

  async getAverageCompletionRate(): Promise<number> {
    try {
      const result = await this.prisma.executorRoadmap.aggregate({
        _avg: {
          percentComplete: true,
        },
        where: {
          isComplete: false,
        },
      });

      return result._avg.percentComplete || 0;
    } catch (error) {
      this.logger.error(`Failed to get average completion rate: ${error.message}`);
      throw new Error(`Failed to get average completion rate: ${error.message}`);
    }
  }

  async getAverageTimeToComplete(): Promise<number> {
    try {
      const completedRoadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          status: 'COMPLETED',
          actualCompletionDate: { not: null },
          startedAt: { not: null },
        },
      });

      if (completedRoadmaps.length === 0) {
        return 0;
      }

      let totalDays = 0;
      completedRoadmaps.forEach((roadmap) => {
        if (roadmap.actualCompletionDate && roadmap.startedAt) {
          const days = Math.ceil(
            (roadmap.actualCompletionDate.getTime() - roadmap.startedAt.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          totalDays += days;
        }
      });

      return totalDays / completedRoadmaps.length;
    } catch (error) {
      this.logger.error(`Failed to get average time to complete: ${error.message}`);
      throw new Error(`Failed to get average time to complete: ${error.message}`);
    }
  }

  async getMostCommonBottlenecks(limit: number): Promise<
    Array<{
      taskTitle: string;
      category: string;
      averageDurationDays: number;
      stuckCount: number;
    }>
  > {
    try {
      const results = await this.prisma.$queryRaw<
        Array<{
          taskTitle: string;
          category: string;
          averageDurationDays: number;
          stuckCount: number;
        }>
      >`
        SELECT 
          rt.title as "taskTitle",
          rt.category,
          AVG(EXTRACT(DAY FROM (rt."completedAt" - rt."startedAt"))) as "averageDurationDays",
          COUNT(*) as "stuckCount"
        FROM "RoadmapTask" rt
        WHERE rt."status" IN ('BLOCKED', 'FAILED')
        OR (rt."isOverdue" = true AND rt."status" IN ('PENDING', 'IN_PROGRESS'))
        GROUP BY rt.title, rt.category
        ORDER BY "stuckCount" DESC
        LIMIT ${limit}
      `;

      return results.map((row) => ({
        taskTitle: row.taskTitle,
        category: row.category,
        averageDurationDays: parseFloat(row.averageDurationDays?.toString() || '0'),
        stuckCount: parseInt(row.stuckCount?.toString() || '0'),
      }));
    } catch (error) {
      this.logger.error(`Failed to get most common bottlenecks: ${error.message}`);
      throw new Error(`Failed to get most common bottlenecks: ${error.message}`);
    }
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
    try {
      const results = await this.prisma.$queryRaw<
        Array<{
          category: string;
          totalTasks: bigint;
          completedTasks: bigint;
          skippedTasks: bigint;
          averageDurationDays: number;
        }>
      >`
        SELECT 
          rt.category,
          COUNT(*) as "totalTasks",
          COUNT(CASE WHEN rt."status" = 'COMPLETED' THEN 1 END) as "completedTasks",
          COUNT(CASE WHEN rt."status" = 'SKIPPED' THEN 1 END) as "skippedTasks",
          AVG(EXTRACT(DAY FROM (rt."completedAt" - rt."startedAt"))) as "averageDurationDays"
        FROM "RoadmapTask" rt
        WHERE rt."completedAt" IS NOT NULL
        GROUP BY rt.category
      `;

      return results.map((row) => ({
        category: row.category,
        totalTasks: Number(row.totalTasks),
        completedTasks: Number(row.completedTasks),
        skippedTasks: Number(row.skippedTasks),
        averageDurationDays: parseFloat(row.averageDurationDays?.toString() || '0'),
      }));
    } catch (error) {
      this.logger.error(`Failed to get task completion rates: ${error.message}`);
      throw new Error(`Failed to get task completion rates: ${error.message}`);
    }
  }

  async getPhaseStatistics(): Promise<
    Array<{
      phase: string;
      totalRoadmaps: number;
      averageTimeInPhase: number;
      completionRate: number;
    }>
  > {
    try {
      const results = await this.prisma.$queryRaw<
        Array<{
          phase: string;
          totalRoadmaps: bigint;
          averageTimeInPhase: number;
          completionRate: number;
        }>
      >`
        WITH phase_stats AS (
          SELECT 
            er."currentPhase" as phase,
            COUNT(*) as total_roadmaps,
            AVG(EXTRACT(DAY FROM (NOW() - er."lastActiveAt"))) as avg_time
          FROM "ExecutorRoadmap" er
          WHERE er."isComplete" = false
          GROUP BY er."currentPhase"
        ),
        phase_completion AS (
          SELECT 
            er."currentPhase" as phase,
            AVG(er."percentComplete") as completion_rate
          FROM "ExecutorRoadmap" er
          GROUP BY er."currentPhase"
        )
        SELECT 
          ps.phase,
          ps.total_roadmaps as "totalRoadmaps",
          COALESCE(ps.avg_time, 0) as "averageTimeInPhase",
          COALESCE(pc.completion_rate, 0) as "completionRate"
        FROM phase_stats ps
        LEFT JOIN phase_completion pc ON ps.phase = pc.phase
      `;

      return results.map((row) => ({
        phase: row.phase,
        totalRoadmaps: Number(row.totalRoadmaps),
        averageTimeInPhase: parseFloat(row.averageTimeInPhase?.toString() || '0'),
        completionRate: parseFloat(row.completionRate?.toString() || '0'),
      }));
    } catch (error) {
      this.logger.error(`Failed to get phase statistics: ${error.message}`);
      throw new Error(`Failed to get phase statistics: ${error.message}`);
    }
  }

  // ==================== BATCH OPERATIONS ====================

  async saveAll(roadmaps: ExecutorRoadmap[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const roadmap of roadmaps) {
          const persistenceData = ExecutorRoadmapMapper.toPersistence(roadmap);
          const roadmapId = roadmap.id.toString();
          const version = roadmap.version;

          if (roadmapId) {
            // Update existing
            await tx.executorRoadmap.update({
              where: {
                id: roadmapId,
                version: version - 1,
              },
              data: persistenceData.roadmap,
            });

            await tx.roadmapTask.deleteMany({
              where: { roadmapId },
            });
          } else {
            // Create new
            await tx.executorRoadmap.create({
              data: persistenceData.roadmap,
            });
          }

          // Create tasks
          if (persistenceData.tasks.length > 0) {
            await tx.roadmapTask.createMany({
              data: persistenceData.tasks,
              skipDuplicates: true,
            });
          }
        }
      });

      this.logger.debug(`Batch saved ${roadmaps.length} roadmaps`);
    } catch (error) {
      this.logger.error(`Failed to save batch of roadmaps: ${error.message}`);
      throw new Error(`Failed to save roadmaps batch: ${error.message}`);
    }
  }

  async findByEstateIds(estateIds: string[]): Promise<ExecutorRoadmap[]> {
    try {
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          estateId: { in: estateIds },
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps by estate IDs: ${error.message}`);
      throw new Error(`Failed to find roadmaps by estate IDs: ${error.message}`);
    }
  }

  async bulkUpdatePhase(roadmapIds: string[], newPhase: RoadmapPhase): Promise<void> {
    try {
      await this.prisma.executorRoadmap.updateMany({
        where: {
          id: { in: roadmapIds },
        },
        data: {
          currentPhase: newPhase,
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`Bulk updated ${roadmapIds.length} roadmaps to phase ${newPhase}`);
    } catch (error) {
      this.logger.error(`Failed to bulk update phase: ${error.message}`);
      throw new Error(`Failed to bulk update phase: ${error.message}`);
    }
  }

  async bulkMarkTasksOverdue(taskIds: string[]): Promise<void> {
    try {
      await this.prisma.roadmapTask.updateMany({
        where: {
          id: { in: taskIds },
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        data: {
          isOverdue: true,
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`Bulk marked ${taskIds.length} tasks as overdue`);
    } catch (error) {
      this.logger.error(`Failed to bulk mark tasks overdue: ${error.message}`);
      throw new Error(`Failed to bulk mark tasks overdue: ${error.message}`);
    }
  }

  // ==================== USER-SPECIFIC QUERIES ====================

  async findByUserId(userId: string): Promise<ExecutorRoadmap[]> {
    try {
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: { userId },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps by user ${userId}: ${error.message}`);
      throw new Error(`Failed to find roadmaps by user: ${error.message}`);
    }
  }

  async findRecentActivityByUser(userId: string, days: number): Promise<ExecutorRoadmap[]> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          userId,
          lastActiveAt: { gte: dateThreshold },
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find recent activity for user ${userId}: ${error.message}`);
      throw new Error(`Failed to find recent activity: ${error.message}`);
    }
  }

  // ==================== SUCCESSION CONTEXT QUERIES ====================

  async findBySuccessionRegime(regime: string): Promise<ExecutorRoadmap[]> {
    try {
      // Using JSON contains query
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          successionContext: {
            contains: `"regime":"${regime}"`,
          },
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps by regime ${regime}: ${error.message}`);
      throw new Error(`Failed to find roadmaps by regime: ${error.message}`);
    }
  }

  async findIslamicRoadmaps(): Promise<ExecutorRoadmap[]> {
    try {
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          successionContext: {
            contains: '"religion":"ISLAMIC"',
          },
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find Islamic roadmaps: ${error.message}`);
      throw new Error(`Failed to find Islamic roadmaps: ${error.message}`);
    }
  }

  async findPolygamousRoadmaps(): Promise<ExecutorRoadmap[]> {
    try {
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          successionContext: {
            contains: '"marriageType":"POLYGAMOUS"',
          },
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find polygamous roadmaps: ${error.message}`);
      throw new Error(`Failed to find polygamous roadmaps: ${error.message}`);
    }
  }

  async findRoadmapsWithMinors(): Promise<ExecutorRoadmap[]> {
    try {
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          successionContext: {
            contains: '"isMinorInvolved":true',
          },
        },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps with minors: ${error.message}`);
      throw new Error(`Failed to find roadmaps with minors: ${error.message}`);
    }
  }

  // ==================== AUDIT & COMPLIANCE ====================

  async getHistory(roadmapId: string): Promise<
    Array<{
      version: number;
      eventType: string;
      occurredAt: Date;
      payload: any;
    }>
  > {
    try {
      // This would typically query an event store
      // For now, return empty array
      return [];
    } catch (error) {
      this.logger.error(`Failed to get roadmap history: ${error.message}`);
      throw new Error(`Failed to get roadmap history: ${error.message}`);
    }
  }

  async getTaskCompletionHistory(roadmapId: string): Promise<
    Array<{
      taskId: string;
      taskTitle: string;
      completedAt: Date;
      completedBy: string;
      durationDays: number;
    }>
  > {
    try {
      const tasks = await this.prisma.roadmapTask.findMany({
        where: {
          roadmapId,
          status: 'COMPLETED',
          completedAt: { not: null },
        },
        select: {
          id: true,
          title: true,
          completedAt: true,
          completedBy: true,
          startedAt: true,
        },
      });

      return tasks
        .filter((task) => task.completedAt && task.startedAt)
        .map((task) => ({
          taskId: task.id,
          taskTitle: task.title,
          completedAt: task.completedAt!,
          completedBy: task.completedBy || 'system',
          durationDays: Math.ceil(
            (task.completedAt!.getTime() - task.startedAt!.getTime()) / (1000 * 60 * 60 * 24),
          ),
        }));
    } catch (error) {
      this.logger.error(`Failed to get task completion history: ${error.message}`);
      throw new Error(`Failed to get task completion history: ${error.message}`);
    }
  }

  async getSnapshotAt(roadmapId: string, timestamp: Date): Promise<ExecutorRoadmap | null> {
    try {
      // This would typically query an event store for snapshot at timestamp
      // For now, return current state
      return await this.findById(roadmapId);
    } catch (error) {
      this.logger.error(`Failed to get snapshot for roadmap ${roadmapId}: ${error.message}`);
      throw new Error(`Failed to get roadmap snapshot: ${error.message}`);
    }
  }

  // ==================== ADVANCED ANALYTICS ====================

  async getTaskDurationAnalytics(): Promise<
    Array<{
      taskCategory: string;
      taskTitle: string;
      averageDurationDays: number;
      minDurationDays: number;
      maxDurationDays: number;
      completionRate: number;
    }>
  > {
    try {
      const results = await this.prisma.$queryRaw<
        Array<{
          taskCategory: string;
          taskTitle: string;
          avgDuration: number;
          minDuration: number;
          maxDuration: number;
          completionRate: number;
        }>
      >`
        SELECT 
          rt.category as "taskCategory",
          rt.title as "taskTitle",
          AVG(EXTRACT(DAY FROM (rt."completedAt" - rt."startedAt"))) as "avgDuration",
          MIN(EXTRACT(DAY FROM (rt."completedAt" - rt."startedAt"))) as "minDuration",
          MAX(EXTRACT(DAY FROM (rt."completedAt" - rt."startedAt"))) as "maxDuration",
          (COUNT(CASE WHEN rt."status" = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(*)) as "completionRate"
        FROM "RoadmapTask" rt
        WHERE rt."completedAt" IS NOT NULL
        AND rt."startedAt" IS NOT NULL
        GROUP BY rt.category, rt.title
      `;

      return results.map((row) => ({
        taskCategory: row.taskCategory,
        taskTitle: row.taskTitle,
        averageDurationDays: parseFloat(row.avgDuration?.toString() || '0'),
        minDurationDays: parseFloat(row.minDuration?.toString() || '0'),
        maxDurationDays: parseFloat(row.maxDuration?.toString() || '0'),
        completionRate: parseFloat(row.completionRate?.toString() || '0'),
      }));
    } catch (error) {
      this.logger.error(`Failed to get task duration analytics: ${error.message}`);
      throw new Error(`Failed to get task duration analytics: ${error.message}`);
    }
  }

  async getPhaseTransitionTimeline(roadmapId: string): Promise<
    Array<{
      phase: string;
      enteredAt: Date;
      exitedAt?: Date;
      durationDays?: number;
    }>
  > {
    try {
      const roadmap = await this.prisma.executorRoadmap.findUnique({
        where: { id: roadmapId },
        select: { phaseHistory: true },
      });

      if (!roadmap || !roadmap.phaseHistory) {
        return [];
      }

      // Parse phase history JSON
      const phaseHistory = JSON.parse(roadmap.phaseHistory as string);
      return phaseHistory.map((entry: any) => ({
        phase: entry.phase,
        enteredAt: new Date(entry.enteredAt),
        exitedAt: entry.exitedAt ? new Date(entry.exitedAt) : undefined,
        durationDays: entry.durationDays,
      }));
    } catch (error) {
      this.logger.error(`Failed to get phase transition timeline: ${error.message}`);
      throw new Error(`Failed to get phase transition timeline: ${error.message}`);
    }
  }

  async findNeedingAttention(): Promise<ExecutorRoadmap[]> {
    try {
      // Find roadmaps with: overdue tasks + stalled progress + critical tasks
      const roadmapIds = await this.prisma.$queryRaw<{ roadmapId: string }[]>`
        SELECT DISTINCT er.id as "roadmapId"
        FROM "ExecutorRoadmap" er
        LEFT JOIN "RoadmapTask" rt ON er.id = rt."roadmapId"
        WHERE er."isComplete" = false
        AND (
          er."status" = 'BLOCKED'
          OR er."daysInactive" > 7
          OR er."percentComplete" < 10
          OR (
            rt."isOverdue" = true 
            AND rt."status" IN ('PENDING', 'IN_PROGRESS')
          )
          OR (
            rt."priority" = 'CRITICAL' 
            AND rt."status" IN ('PENDING', 'IN_PROGRESS')
          )
        )
      `;

      if (roadmapIds.length === 0) {
        return [];
      }

      const ids = roadmapIds.map((r) => r.roadmapId);
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: { id: { in: ids } },
      });

      return await this.loadRoadmapsWithTasks(roadmaps);
    } catch (error) {
      this.logger.error(`Failed to find roadmaps needing attention: ${error.message}`);
      throw new Error(`Failed to find roadmaps needing attention: ${error.message}`);
    }
  }

  async findSimilarRoadmaps(
    roadmapId: string,
    limit: number,
  ): Promise<
    Array<{
      roadmap: ExecutorRoadmap;
      similarityScore: number;
      completionTimeDays?: number;
    }>
  > {
    try {
      // Get current roadmap details
      const currentRoadmap = await this.findById(roadmapId);
      if (!currentRoadmap) {
        return [];
      }

      // Find roadmaps with similar context
      const similarRoadmaps = await this.prisma.executorRoadmap.findMany({
        where: {
          id: { not: roadmapId },
          currentPhase: currentRoadmap.currentPhase,
          successionContext: {
            contains: `"regime":"${currentRoadmap.successionContext.regime}"`,
          },
        },
        take: limit,
      });

      // Load tasks for each similar roadmap
      const result: Array<{
        roadmap: ExecutorRoadmap;
        similarityScore: number;
        completionTimeDays?: number;
      }> = [];

      for (const roadmap of similarRoadmaps) {
        const tasks = await this.prisma.roadmapTask.findMany({
          where: { roadmapId: roadmap.id },
        });

        const domainRoadmap = ExecutorRoadmapMapper.toDomain(roadmap, tasks);

        // Calculate similarity score (simplified)
        let similarityScore = 0;
        if (roadmap.currentPhase === currentRoadmap.currentPhase) similarityScore += 30;
        if (
          roadmap.percentComplete >= currentRoadmap.percentComplete - 10 &&
          roadmap.percentComplete <= currentRoadmap.percentComplete + 10
        ) {
          similarityScore += 30;
        }

        result.push({
          roadmap: domainRoadmap,
          similarityScore,
        });
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to find similar roadmaps: ${error.message}`);
      throw new Error(`Failed to find similar roadmaps: ${error.message}`);
    }
  }

  // ==================== TASK SEARCH ====================

  async searchTasks(criteria: TaskSearchCriteria): Promise<
    Array<{
      roadmap: ExecutorRoadmap;
      task: RoadmapTask;
    }>
  > {
    try {
      const whereClause: any = {};

      if (criteria.title) {
        whereClause.title = { contains: criteria.title, mode: 'insensitive' };
      }

      if (criteria.category) {
        whereClause.category = criteria.category;
      }

      if (criteria.status) {
        whereClause.status = criteria.status;
      }

      if (criteria.priority) {
        whereClause.priority = criteria.priority;
      }

      if (criteria.isOverdue !== undefined) {
        whereClause.isOverdue = criteria.isOverdue;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        whereClause.tags = { hasSome: criteria.tags };
      }

      if (criteria.estateId) {
        const roadmap = await this.prisma.executorRoadmap.findFirst({
          where: { estateId: criteria.estateId },
        });
        if (roadmap) {
          whereClause.roadmapId = roadmap.id;
        }
      }

      const tasks = await this.prisma.roadmapTask.findMany({
        where: whereClause,
      });

      // Group tasks by roadmap
      const roadmapIds = [...new Set(tasks.map((t) => t.roadmapId))];
      const roadmaps = await this.prisma.executorRoadmap.findMany({
        where: { id: { in: roadmapIds } },
      });

      // Load all tasks for these roadmaps
      const allTasks = await this.prisma.roadmapTask.findMany({
        where: { roadmapId: { in: roadmapIds } },
      });

      // Group tasks by roadmapId
      const tasksByRoadmapId = allTasks.reduce(
        (acc, task) => {
          if (!acc[task.roadmapId]) {
            acc[task.roadmapId] = [];
          }
          acc[task.roadmapId].push(task);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      const result: Array<{ roadmap: ExecutorRoadmap; task: RoadmapTask }> = [];

      for (const task of tasks) {
        const roadmap = roadmaps.find((r) => r.id === task.roadmapId);
        if (roadmap) {
          const allRoadmapTasks = tasksByRoadmapId[roadmap.id] || [];
          const domainRoadmap = ExecutorRoadmapMapper.toDomain(roadmap, allRoadmapTasks);
          const domainTask = RoadmapTaskMapper.toDomain(task);
          result.push({ roadmap: domainRoadmap, task: domainTask });
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to search tasks: ${error.message}`);
      throw new Error(`Failed to search tasks: ${error.message}`);
    }
  }

  // ==================== PAGINATION METHODS ====================

  async findAll(options: QueryOptions): Promise<{
    items: ExecutorRoadmap[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      const [roadmaps, total] = await Promise.all([
        this.prisma.executorRoadmap.findMany({
          skip,
          take: limit,
          orderBy: this.getSortOrder(options),
        }),
        this.prisma.executorRoadmap.count(),
      ]);

      const items = await this.loadRoadmapsWithTasks(roadmaps);
      const pages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        pages,
      };
    } catch (error) {
      this.logger.error(`Failed to find all roadmaps: ${error.message}`);
      throw new Error(`Failed to find all roadmaps: ${error.message}`);
    }
  }

  async findByPhasePaginated(
    phase: RoadmapPhase,
    options: QueryOptions,
  ): Promise<{
    items: ExecutorRoadmap[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      const [roadmaps, total] = await Promise.all([
        this.prisma.executorRoadmap.findMany({
          where: { currentPhase: phase },
          skip,
          take: limit,
          orderBy: this.getSortOrder(options),
        }),
        this.prisma.executorRoadmap.count({
          where: { currentPhase: phase },
        }),
      ]);

      const items = await this.loadRoadmapsWithTasks(roadmaps);
      const pages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        pages,
      };
    } catch (error) {
      this.logger.error(`Failed to find roadmaps by phase ${phase}: ${error.message}`);
      throw new Error(`Failed to find roadmaps by phase: ${error.message}`);
    }
  }

  async findByUserIdPaginated(
    userId: string,
    options: QueryOptions,
  ): Promise<{
    items: ExecutorRoadmap[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      const [roadmaps, total] = await Promise.all([
        this.prisma.executorRoadmap.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: this.getSortOrder(options),
        }),
        this.prisma.executorRoadmap.count({
          where: { userId },
        }),
      ]);

      const items = await this.loadRoadmapsWithTasks(roadmaps);
      const pages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        pages,
      };
    } catch (error) {
      this.logger.error(`Failed to find roadmaps by user ${userId}: ${error.message}`);
      throw new Error(`Failed to find roadmaps by user: ${error.message}`);
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async loadRoadmapsWithTasks(roadmaps: any[]): Promise<ExecutorRoadmap[]> {
    if (!roadmaps || roadmaps.length === 0) {
      return [];
    }

    const roadmapIds = roadmaps.map((r) => r.id);

    const allTasks = await this.prisma.roadmapTask.findMany({
      where: { roadmapId: { in: roadmapIds } },
    });

    // Group tasks by roadmap ID
    const tasksByRoadmapId = allTasks.reduce(
      (acc, task) => {
        if (!acc[task.roadmapId]) {
          acc[task.roadmapId] = [];
        }
        acc[task.roadmapId].push(task);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Map to domain aggregates
    const domainRoadmaps: ExecutorRoadmap[] = [];

    for (const roadmap of roadmaps) {
      try {
        const tasks = tasksByRoadmapId[roadmap.id] || [];
        const domainRoadmap = ExecutorRoadmapMapper.toDomain(roadmap, tasks);
        domainRoadmaps.push(domainRoadmap);
      } catch (error) {
        this.logger.warn(`Failed to convert roadmap ${roadmap.id}: ${error.message}`);
        // Skip invalid roadmaps
      }
    }

    return domainRoadmaps;
  }

  private getSortOrder(options: QueryOptions): any {
    const sortBy = options.sortBy || 'updatedAt';
    const sortOrder = options.sortOrder || 'desc';

    switch (sortBy) {
      case 'percentComplete':
        return { percentComplete: sortOrder };
      case 'createdAt':
        return { createdAt: sortOrder };
      case 'lastActiveAt':
        return { lastActiveAt: sortOrder };
      case 'estateId':
        return { estateId: sortOrder };
      case 'currentPhase':
        return { currentPhase: sortOrder };
      default:
        return { updatedAt: sortOrder };
    }
  }

  // ==================== TRANSACTION SUPPORT ====================

  /**
   * Execute operation within transaction
   */
  async withTransaction<T>(operation: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation);
  }

  /**
   * Get raw Prisma client for complex operations
   */
  getPrismaClient() {
    return this.prisma;
  }
}

// ==================== FACTORY FOR DEPENDENCY INJECTION ====================

export const PrismaRoadmapRepositoryProvider = {
  provide: 'EXECUTOR_ROADMAP_REPOSITORY',
  useClass: PrismaRoadmapRepository,
};

// ==================== HEALTH CHECK ====================

export interface RoadmapRepositoryHealth {
  isConnected: boolean;
  roadmapCount: number;
  taskCount: number;
  lastOperation: Date;
}

export async function checkRoadmapRepositoryHealth(
  prisma: PrismaService,
): Promise<RoadmapRepositoryHealth> {
  try {
    const [roadmapCount, taskCount] = await Promise.all([
      prisma.executorRoadmap.count(),
      prisma.roadmapTask.count(),
    ]);

    return {
      isConnected: true,
      roadmapCount,
      taskCount,
      lastOperation: new Date(),
    };
  } catch (error) {
    return {
      isConnected: false,
      roadmapCount: 0,
      taskCount: 0,
      lastOperation: new Date(),
    };
  }
}
