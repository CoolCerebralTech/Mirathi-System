import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RoadmapPhase, SuccessionRegime, TaskStatus } from '@prisma/client';

import { ExecutorRoadmap } from '../../domian/entities/executor-roadmap.entity';
import { RoadmapTask } from '../../domian/entities/roadmap-task.entity';
import {
  EXECUTOR_ROADMAP_REPO,
  IExecutorRoadmapRepository,
} from '../../domian/repositories/roadmap.repository';
import { RoadmapFactoryService } from '../../domian/services/roadmap-factory.service';
import { SuccessionContext } from '../../domian/value-objects/succession-context.vo';
// Infrastructure Adapters
import { EstateServiceAdapter } from '../../infrastructure/adapters/estate-service.adapter';
import { FamilyServiceAdapter } from '../../infrastructure/adapters/family-service.adapter';

@Injectable()
export class RoadmapService {
  private readonly logger = new Logger(RoadmapService.name);

  constructor(
    @Inject(EXECUTOR_ROADMAP_REPO)
    private readonly roadmapRepo: IExecutorRoadmapRepository,
    private readonly roadmapFactory: RoadmapFactoryService,
    // Adapters
    private readonly estateAdapter: EstateServiceAdapter,
    private readonly familyAdapter: FamilyServiceAdapter,
  ) {}

  /**
   * Generates (or retrieves) the Executor Roadmap based on the estate's legal context.
   */
  async generateRoadmap(userId: string, estateId: string) {
    this.logger.log(`Generating roadmap for Estate: ${estateId}`);

    // 1. Check if roadmap already exists
    const existingRoadmap = await this.roadmapRepo.findByEstateId(estateId);
    if (existingRoadmap) {
      // If it exists, just return the current state
      const tasks = await this.roadmapRepo.getTasks(existingRoadmap.id);
      return this.formatOutput(existingRoadmap, tasks);
    }

    // 2. Fetch Data to build Context
    const [estateData, familyData] = await Promise.all([
      this.estateAdapter.getEstateData(estateId),
      this.familyAdapter.getFamilyData(userId),
    ]);

    // 3. Build Succession Context (The "Legal Brain")
    const context = new SuccessionContext(
      estateData.hasWill ? SuccessionRegime.TESTATE : SuccessionRegime.INTESTATE,
      familyData.religion,
      familyData.marriageType,
      estateData.totalAssets,
      familyData.numberOfMinors > 0,
      familyData.isPolygamous,
      familyData.numberOfSpouses,
      familyData.numberOfChildren,
    );

    // 4. Create Roadmap Entity
    const roadmap = ExecutorRoadmap.create(userId, estateId, context);

    // 5. Generate Tasks via Domain Service
    const tasks = this.roadmapFactory.generateTasks(roadmap.id, context);

    // 6. Unlock the first available tasks (Dependencies = 0)
    tasks.forEach((task) => {
      if (task.dependsOn.length === 0) {
        task.unlock();
      }
    });

    // 7. Persist everything
    await this.roadmapRepo.save(roadmap);
    await this.roadmapRepo.saveTasks(tasks);

    // 8. Update initial progress (0%)
    roadmap.updateProgress(0, tasks.length);
    await this.roadmapRepo.save(roadmap);

    return this.formatOutput(roadmap, tasks);
  }

  /**
   * Marks a task as complete and handles the "Unlocking" of subsequent tasks.
   */
  async completeTask(estateId: string, taskId: string, userId: string, notes?: string) {
    // 1. Get Roadmap
    const roadmap = await this.roadmapRepo.findByEstateId(estateId);
    if (!roadmap) throw new NotFoundException('Roadmap not found');

    // 2. Get All Tasks (Needed for dependency checking and progress calc)
    const allTasks = await this.roadmapRepo.getTasks(roadmap.id);
    const task = allTasks.find((t) => t.id === taskId);

    if (!task) throw new NotFoundException('Task not found');
    if (task.status === TaskStatus.LOCKED) {
      throw new BadRequestException('Cannot complete a locked task');
    }

    // 3. Complete the Task
    task.complete(userId, notes);

    // 4. Smart Unlock Logic
    // Find all tasks that depend on this one
    const dependentTasks = await this.roadmapRepo.findDependentTasks(task.id);

    // For each dependent task, check if ALL its dependencies are now met
    for (const dependentTask of dependentTasks) {
      const dependencies = dependentTask.dependsOn;
      const allMet = dependencies.every((depId) => {
        const depTask = allTasks.find((t) => t.id === depId);
        return depTask && depTask.status === TaskStatus.COMPLETED;
      });

      if (allMet) {
        dependentTask.unlock();
        // Update the copy in our local array so the saveTasks call works
        const index = allTasks.findIndex((t) => t.id === dependentTask.id);
        if (index !== -1) allTasks[index] = dependentTask;
      }
    }

    // 5. Update Roadmap Progress
    const completedCount = allTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    roadmap.updateProgress(completedCount, allTasks.length);

    // 6. Save Changes
    // Save the specific task, any unlocked tasks, and the roadmap
    await this.roadmapRepo.saveTasks(allTasks); // Bulk save handles updates efficiently
    await this.roadmapRepo.save(roadmap);

    return {
      message: 'Task completed',
      task: task.toJSON(),
      overallProgress: roadmap.overallProgress,
    };
  }

  /**
   * View Model Helper
   */
  private formatOutput(roadmap: ExecutorRoadmap, tasks: RoadmapTask[]) {
    // Group by Phase for the Frontend
    const tasksByPhase = tasks.reduce(
      (acc, task) => {
        const data = task.toJSON();
        if (!acc[data.phase]) acc[data.phase] = [];
        acc[data.phase].push(data);
        return acc;
      },
      {} as Record<RoadmapPhase, any[]>,
    );

    return {
      roadmap: roadmap.toJSON(),
      tasksByPhase,
      meta: {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
      },
    };
  }
}
