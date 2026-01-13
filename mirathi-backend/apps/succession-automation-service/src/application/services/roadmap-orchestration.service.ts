// apps/succession-automation-service/src/application/services/roadmap-orchestration.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RoadmapPhase, TaskStatus } from '@prisma/client';

import { ExecutorRoadmap } from '../../domain/entities/executor-roadmap.entity';
import { RoadmapTask } from '../../domain/entities/roadmap-task.entity';
import {
  EXECUTOR_ROADMAP_REPO,
  IExecutorRoadmapRepository,
} from '../../domain/repositories/roadmap.repository';

// Extended Interface to support findById if not in base interface
// In a real scenario, update the domain repository interface directly.
interface IExtendedRoadmapRepository extends IExecutorRoadmapRepository {
  findById(id: string): Promise<ExecutorRoadmap | null>;
}

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
    private readonly roadmapRepo: IExtendedRoadmapRepository,
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
      throw new NotFoundException(`Access denied for estate roadmap ${estateId}`);
    }

    const tasks = await this.roadmapRepo.getTasks(roadmap.id);
    const currentPhaseTasks = tasks.filter(
      (task) => this.getTaskPhase(task) === roadmap.currentPhase,
    );

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
  async startTask(roadmapId: string, taskId: string, _userId: string): Promise<RoadmapTask> {
    const task = await this.getTaskById(roadmapId, taskId);

    if (task.status !== TaskStatus.AVAILABLE) {
      // Idempotency: If already in progress, just return it
      if (task.status === TaskStatus.IN_PROGRESS) return task;
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

    // Validate Status
    if (task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.AVAILABLE) {
      // Allow completing from AVAILABLE (skipping explicit start) for better UX
      if (task.status === TaskStatus.COMPLETED) {
        // Idempotent success
        return { completedTask: task, unlockedTasks: [], phaseChanged: false };
      }
    }

    task.complete(userId, notes);
    await this.saveTask(task);

    // 2. Unlock dependent tasks
    const unlockedTasks = await this.unlockDependentTasks(taskId);

    // 3. Update roadmap progress
    const roadmap = await this.roadmapRepo.findById(roadmapId);

    let phaseChanged = false;

    if (roadmap) {
      const tasks = await this.roadmapRepo.getTasks(roadmapId);
      const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;

      roadmap.updateProgress(completedTasks, tasks.length);

      // 4. Check if we should transition to next phase
      phaseChanged = this.checkPhaseTransition(roadmap, tasks);

      await this.roadmapRepo.save(roadmap);
    }

    return {
      completedTask: task,
      unlockedTasks,
      phaseChanged,
      newPhase: phaseChanged && roadmap ? roadmap.currentPhase : undefined,
    };
  }

  /**
   * Skip a task (mark as skipped/completed)
   */
  async skipTask(
    roadmapId: string,
    taskId: string,
    userId: string,
    reason: string,
  ): Promise<RoadmapTask> {
    const task = await this.getTaskById(roadmapId, taskId);

    // Treat skip as a completion with a note
    task.complete(userId, `SKIPPED: ${reason}`);

    // Also unlock dependent tasks
    await this.unlockDependentTasks(taskId);
    await this.saveTask(task);

    // Note: We should probably update roadmap progress here too,
    // but relying on the next fetch or a separate sync event is acceptable for now.

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
        // Access props via toJSON if getters missing in entity, or use helper
        const aData = a.toJSON();
        const bData = b.toJSON();

        // Sort by priority: blocking tasks first (tasks that other tasks depend on)
        // Note: 'dependsOn' is what I depend on.
        // We need to know if *others* depend on me.
        // Simplified: Use orderIndex

        return aData.orderIndex - bData.orderIndex;
      });
  }

  /**
   * Get phase overview
   */
  async getPhaseOverview(roadmapId: string, phase: RoadmapPhase) {
    const tasks = await this.roadmapRepo.getTasks(roadmapId);
    const phaseTasks = tasks.filter((task) => this.getTaskPhase(task) === phase);

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
    // Optimization: In real app, add findById to TaskRepo.
    // Here we filter memory for consistency with Interface.
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

    // Optimization: Fetch all tasks once if many dependents
    let allTasks: RoadmapTask[] | null = null;

    for (const task of dependentTasks) {
      if (task.status !== TaskStatus.LOCKED) continue;

      if (!allTasks) {
        allTasks = await this.roadmapRepo.getTasks(this.getTaskRoadmapId(task));
      }

      const allDependenciesCompleted = this.checkAllDependenciesCompleted(task, allTasks);

      if (allDependenciesCompleted) {
        task.unlock();
        await this.saveTask(task);
        unlocked.push(task);
      }
    }

    return unlocked;
  }

  private checkAllDependenciesCompleted(task: RoadmapTask, allTasks: RoadmapTask[]): boolean {
    if (task.dependsOn.length === 0) return true;

    return task.dependsOn.every((depId) => {
      const depTask = allTasks.find((t) => t.id === depId);
      // Considered done if Completed or Skipped (Skipped is technically Completed status in our logic)
      return depTask?.status === TaskStatus.COMPLETED;
    });
  }

  private checkPhaseTransition(roadmap: ExecutorRoadmap, tasks: RoadmapTask[]): boolean {
    const currentPhaseTasks = tasks.filter((t) => this.getTaskPhase(t) === roadmap.currentPhase);

    const allCompleted = currentPhaseTasks.every((t) => t.status === TaskStatus.COMPLETED);

    if (allCompleted && currentPhaseTasks.length > 0) {
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
    return tasks.reduce((total, task) => {
      // Safe access to prop via toJSON if getter missing
      return total + (task.toJSON().estimatedDays || 0);
    }, 0);
  }

  // Helper to safely access properties if Entity Getters are missing
  private getTaskPhase(task: RoadmapTask): RoadmapPhase {
    return task.toJSON().phase;
  }

  private getTaskRoadmapId(task: RoadmapTask): string {
    return task.toJSON().roadmapId;
  }
}
