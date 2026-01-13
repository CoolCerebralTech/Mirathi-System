import { Injectable } from '@nestjs/common';
import { ExecutorRoadmap as PrismaRoadmap, RoadmapTask as PrismaTask } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { ExecutorRoadmap } from '../../domain/entities/executor-roadmap.entity';
import { RoadmapTask } from '../../domain/entities/roadmap-task.entity';
import { IExecutorRoadmapRepository } from '../../domain/repositories/roadmap.repository';

@Injectable()
export class PrismaExecutorRoadmapRepository implements IExecutorRoadmapRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEstateId(estateId: string): Promise<ExecutorRoadmap | null> {
    const raw = await this.prisma.executorRoadmap.findUnique({
      where: { estateId },
    });
    if (!raw) return null;
    return this.mapToDomain(raw);
  }

  async save(roadmap: ExecutorRoadmap): Promise<void> {
    const data = roadmap.toJSON();

    await this.prisma.executorRoadmap.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId: data.userId,
        estateId: data.estateId,
        assessmentId: data.assessmentId,
        regime: data.regime,
        religion: data.religion,
        targetCourt: data.targetCourt,
        currentPhase: data.currentPhase,
        overallProgress: data.overallProgress,
        totalTasks: data.totalTasks,
        completedTasks: data.completedTasks,
        availableTasks: data.availableTasks,
        lockedTasks: data.lockedTasks,
        estimatedDays: data.estimatedDays,
        startedAt: data.startedAt,
        estimatedCompletion: data.estimatedCompletion,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        currentPhase: data.currentPhase,
        overallProgress: data.overallProgress,
        totalTasks: data.totalTasks,
        completedTasks: data.completedTasks,
        availableTasks: data.availableTasks,
        lockedTasks: data.lockedTasks,
        updatedAt: data.updatedAt,
      },
    });
  }

  async saveTasks(tasks: RoadmapTask[]): Promise<void> {
    if (tasks.length === 0) return;

    await this.prisma.$transaction(
      tasks.map((task) => {
        const data = task.toJSON();
        return this.prisma.roadmapTask.upsert({
          where: { id: data.id },
          create: {
            id: data.id,
            roadmapId: data.roadmapId,
            phase: data.phase,
            category: data.category,
            orderIndex: data.orderIndex,
            title: data.title,
            description: data.description,
            status: data.status,
            dependsOnTaskIds: data.dependsOnTaskIds,
            unlocksTaskIds: data.unlocksTaskIds,
            whatIsIt: data.whatIsIt,
            whyNeeded: data.whyNeeded,
            howToGet: data.howToGet,
            estimatedDays: data.estimatedDays,
            legalBasis: data.legalBasis,
            completedAt: data.completedAt,
            completedBy: data.completedBy,
            notes: data.notes,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          },
          update: {
            status: data.status,
            completedAt: data.completedAt,
            completedBy: data.completedBy,
            notes: data.notes,
            updatedAt: data.updatedAt,
          },
        });
      }),
    );
  }

  async getTasks(roadmapId: string): Promise<RoadmapTask[]> {
    const rawTasks = await this.prisma.roadmapTask.findMany({
      where: { roadmapId },
      orderBy: [{ phase: 'asc' }, { orderIndex: 'asc' }],
    });

    // FIXED: Use arrow function to preserve 'this' context
    return rawTasks.map((task) => this.mapTaskToDomain(task));
  }

  async findDependentTasks(taskId: string): Promise<RoadmapTask[]> {
    const rawTasks = await this.prisma.roadmapTask.findMany({
      where: {
        dependsOnTaskIds: {
          has: taskId,
        },
      },
    });

    // FIXED: Use arrow function to preserve 'this' context
    return rawTasks.map((task) => this.mapTaskToDomain(task));
  }

  // --- Mappers ---

  private mapToDomain(raw: PrismaRoadmap): ExecutorRoadmap {
    return ExecutorRoadmap.fromPersistence({
      id: raw.id,
      userId: raw.userId,
      estateId: raw.estateId,
      assessmentId: raw.assessmentId ?? undefined,
      regime: raw.regime,
      religion: raw.religion,
      targetCourt: raw.targetCourt,
      currentPhase: raw.currentPhase,
      overallProgress: raw.overallProgress,
      totalTasks: raw.totalTasks,
      completedTasks: raw.completedTasks,
      availableTasks: raw.availableTasks,
      lockedTasks: raw.lockedTasks,
      estimatedDays: raw.estimatedDays ?? undefined,
      startedAt: raw.startedAt,
      estimatedCompletion: raw.estimatedCompletion ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  private mapTaskToDomain(raw: PrismaTask): RoadmapTask {
    return RoadmapTask.fromPersistence({
      id: raw.id,
      roadmapId: raw.roadmapId,
      phase: raw.phase,
      category: raw.category,
      orderIndex: raw.orderIndex,
      title: raw.title,
      description: raw.description,
      status: raw.status,
      dependsOnTaskIds: raw.dependsOnTaskIds,
      unlocksTaskIds: raw.unlocksTaskIds,
      whatIsIt: raw.whatIsIt ?? undefined,
      whyNeeded: raw.whyNeeded ?? undefined,
      howToGet: raw.howToGet ?? undefined,
      estimatedDays: raw.estimatedDays ?? undefined,
      legalBasis: raw.legalBasis ?? undefined,
      completedAt: raw.completedAt ?? undefined,
      completedBy: raw.completedBy ?? undefined,
      notes: raw.notes ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
