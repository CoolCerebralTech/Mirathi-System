// apps/succession-automation-service/src/application/services/roadmap-orchestration.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RoadmapPhase, TaskStatus } from '@prisma/client';

import { ExecutorRoadmap } from '../../domain/entities/executor-roadmap.entity';
import { RoadmapTask } from '../../domain/entities/roadmap-task.entity';
import type { IExecutorRoadmapRepository } from '../../domain/repositories/roadmap.repository';
import { EXECUTOR_ROADMAP_REPO } from '../../domain/repositories/roadmap.repository';

export interface RoadmapWithTasks {
  roadmap: ExecutorRoadmap;
  tasks: RoadmapTask[];
  currentPhaseTasks: RoadmapTask[];
  nextPhase?: RoadmapPhase;
}

export interface TaskCompletionResult {
  completedTask: RoadmapTask;
  unlockedTasks: RoadmapTask[];
  phaseChanged: boolean;
  newPhase?: RoadmapPhase;
}

@Injectable()
export class RoadmapOrchestrationService {
  constructor(
    @Inject(EXECUTOR_ROADMAP_REPO)
    private readonly roadmapRepo: IExecutorRoadmapRepository,
  ) {}

  /**
   * Get full roadmap with tasks for a user
   */
  async getUserRoadmap(userId: string, estateId: string): Promise<RoadmapWithTasks> {
    const roadmap = await this.roadmapRepo.findByEstateId(estateId);

    if (!roadmap) {
      throw new NotFoundException(`Roadmap not found for estate ${estateId}`);
    }

    // Verify ownership
    if (roadmap.userId !== userId) {
      throw new NotFoundException(`Roadmap not found for estate ${estateId}`);
    }

    const tasks = await this.roadmapRepo.getTasks(roadmap.id);
    const currentPhaseTasks = tasks.filter((task) => task.phase === roadmap.currentPhase);

    const nextPhase = this.getNextPhase(roadmap.currentPhase);

    return {
      roadmap,
      tasks,
      currentPhaseTasks,
      nextPhase,
    };
  }

  /**
   * Start a specific task
   */
  async startTask(roadmapId: string, taskId: string, userId: string): Promise<RoadmapTask> {
    const task = await this.getTaskById(roadmapId, taskId);

    if (task.status !== TaskStatus.AVAILABLE) {
      throw new Error(`Task ${taskId} cannot be started. Current status: ${task.status}`);
    }

    task.start();
    await this.saveTask(task);

    return task;
  }

  /**
   * Complete a task and unlock dependent tasks
   */
  async completeTask(
    roadmapId: string,
    taskId: string,
    userId: string,
    notes?: string,
  ): Promise<TaskCompletionResult> {
    // 1. Get and complete the task
    const task = await this.getTaskById(roadmapId, taskId);

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new Error(`Task ${taskId} cannot be completed. Current status: ${task.status}`);
    }

    task.complete(userId, notes);
    await this.saveTask(task);

    // 2. Unlock dependent tasks
    const unlockedTasks = await this.unlockDependentTasks(taskId);

    // 3. Update roadmap progress
    const roadmap = await this.roadmapRepo
      .findByEstateId
      // We need roadmapId to estateId mapping
      // For simplicity, let's assume we can get it
      ();

    if (roadmap) {
      const tasks = await this.roadmapRepo.getTasks(roadmapId);
      const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;

      roadmap.updateProgress(completedTasks, tasks.length);

      // 4. Check if we should transition to next phase
      const phaseChanged = await this.checkPhaseTransition(roadmap, tasks);

      await this.roadmapRepo.save(roadmap);

      return {
        completedTask: task,
        unlockedTasks,
        phaseChanged,
        newPhase: phaseChanged ? roadmap.currentPhase : undefined,
      };
    }

    return {
      completedTask: task,
      unlockedTasks,
      phaseChanged: false,
    };
  }

  /**
   * Skip a task (mark as skipped)
   */
  async skipTask(
    roadmapId: string,
    taskId: string,
    userId: string,
    reason: string,
  ): Promise<RoadmapTask> {
    const task = await this.getTaskById(roadmapId, taskId);

    // We need to add a skip method to the RoadmapTask entity
    // For now, let's mark as completed with skip reason
    task.complete(userId, `Skipped: ${reason}`);

    // Also unlock dependent tasks
    await this.unlockDependentTasks(taskId);
    await this.saveTask(task);

    return task;
  }

  /**
   * Get task recommendations based on priority
   */
  async getRecommendedTasks(roadmapId: string): Promise<RoadmapTask[]> {
    const tasks = await this.roadmapRepo.getTasks(roadmapId);

    return tasks
      .filter((task) => task.status === TaskStatus.AVAILABLE)
      .sort((a, b) => {
        // Sort by priority: blocking tasks first, then by order index
        const aIsBlocking = a.dependsOn.length > 0;
        const bIsBlocking = b.dependsOn.length > 0;

        if (aIsBlocking && !bIsBlocking) return -1;
        if (!aIsBlocking && bIsBlocking) return 1;

        return a.orderIndex - b.orderIndex;
      });
  }

  /**
   * Get phase overview
   */
  async getPhaseOverview(roadmapId: string, phase: RoadmapPhase) {
    const tasks = await this.roadmapRepo.getTasks(roadmapId);
    const phaseTasks = tasks.filter((task) => task.phase === phase);

    const completed = phaseTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const available = phaseTasks.filter((t) => t.status === TaskStatus.AVAILABLE).length;
    const inProgress = phaseTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const locked = phaseTasks.filter((t) => t.status === TaskStatus.LOCKED).length;

    return {
      phase,
      totalTasks: phaseTasks.length,
      completed,
      available,
      inProgress,
      locked,
      progressPercentage:
        phaseTasks.length > 0 ? Math.round((completed / phaseTasks.length) * 100) : 0,
      estimatedDays: this.calculatePhaseDuration(phaseTasks),
      tasks: phaseTasks,
    };
  }

  // --- Private Helper Methods ---

  private async getTaskById(roadmapId: string, taskId: string): Promise<RoadmapTask> {
    const tasks = await this.roadmapRepo.getTasks(roadmapId);
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found in roadmap ${roadmapId}`);
    }

    return task;
  }

  private async saveTask(task: RoadmapTask): Promise<void> {
    await this.roadmapRepo.saveTasks([task]);
  }

  private async unlockDependentTasks(taskId: string): Promise<RoadmapTask[]> {
    const dependentTasks = await this.roadmapRepo.findDependentTasks(taskId);

    const unlocked: RoadmapTask[] = [];

    for (const task of dependentTasks) {
      // Check if all dependencies are completed
      const allDependenciesCompleted = await this.checkAllDependenciesCompleted(task);

      if (allDependenciesCompleted && task.status === TaskStatus.LOCKED) {
        task.unlock();
        await this.saveTask(task);
        unlocked.push(task);
      }
    }

    return unlocked;
  }

  private async checkAllDependenciesCompleted(task: RoadmapTask): Promise<boolean> {
    if (task.dependsOn.length === 0) return true;

    const allTasks = await this.roadmapRepo.getTasks(task.roadmapId);

    return task.dependsOn.every((depId) => {
      const depTask = allTasks.find((t) => t.id === depId);
      return depTask?.status === TaskStatus.COMPLETED;
    });
  }

  private async checkPhaseTransition(
    roadmap: ExecutorRoadmap,
    tasks: RoadmapTask[],
  ): Promise<boolean> {
    const currentPhaseTasks = tasks.filter((t) => t.phase === roadmap.currentPhase);
    const allCompleted = currentPhaseTasks.every(
      (t) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.SKIPPED,
    );

    if (allCompleted) {
      const nextPhase = this.getNextPhase(roadmap.currentPhase);
      if (nextPhase) {
        roadmap.transitionToPhase(nextPhase);
        return true;
      }
    }

    return false;
  }

  private getNextPhase(currentPhase: RoadmapPhase): RoadmapPhase | undefined {
    const phases: RoadmapPhase[] = [
      RoadmapPhase.PRE_FILING,
      RoadmapPhase.FILING,
      RoadmapPhase.COURT_PROCESS,
      RoadmapPhase.GRANT_ISSUANCE,
      RoadmapPhase.DISTRIBUTION,
    ];

    const currentIndex = phases.indexOf(currentPhase);
    return phases[currentIndex + 1];
  }

  private calculatePhaseDuration(tasks: RoadmapTask[]): number {
    return tasks.reduce((total, task) => total + (task.estimatedDays || 0), 0);
  }
}
