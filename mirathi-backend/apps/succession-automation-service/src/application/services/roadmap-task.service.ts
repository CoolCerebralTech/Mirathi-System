// =============================================================================
// ROADMAP SERVICE
// =============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';

import { ExecutorRoadmap } from '../../domian/entities/executor-roadmap.entity';
import { RoadmapTask } from '../../domian/entities/roadmap-task.entity';
import { ContextDetectorService } from '../../domian/services/context-detector.service';
import { RoadmapGeneratorService } from '../../domian/services/roadmap-generator.service';
import { EstateServiceAdapter } from '../../infrastructure/adapters/estate-service.adapter';
import { FamilyServiceAdapter } from '../../infrastructure/adapters/family-service.adapter';
import { RoadmapRepository } from '../../infrastructure/repositories/executor-roadmap.repository';
import { RoadmapTaskRepository } from '../../infrastructure/repositories/roadmap-task.repository';

@Injectable()
export class RoadmapService {
  constructor(
    private readonly roadmapRepo: RoadmapRepository,
    private readonly taskRepo: RoadmapTaskRepository,
    private readonly contextDetector: ContextDetectorService,
    private readonly roadmapGenerator: RoadmapGeneratorService,
    private readonly estateAdapter: EstateServiceAdapter,
    private readonly familyAdapter: FamilyServiceAdapter,
  ) {}

  /**
   * Generate roadmap for an estate
   */
  async generateRoadmap(userId: string, estateId: string) {
    // 1. Get context
    const estateData = await this.estateAdapter.getEstateData(estateId);
    const familyData = await this.familyAdapter.getFamilyData(userId);

    const context = this.contextDetector.detectContext({
      hasWill: estateData.hasWill,
      religion: familyData.religion,
      marriageType: familyData.isPolygamous ? 'POLYGAMOUS' : 'MONOGAMOUS',
      estateValue: estateData.totalAssets,
      hasMinors: familyData.numberOfMinors > 0,
      numberOfWives: familyData.numberOfSpouses,
      numberOfChildren: familyData.numberOfChildren,
    });

    // 2. Create or update roadmap
    let roadmap = await this.roadmapRepo.findByEstateId(estateId);

    if (!roadmap) {
      roadmap = ExecutorRoadmap.create(userId, estateId, context);
      await this.roadmapRepo.save(roadmap);
    }

    // 3. Generate tasks
    const taskTemplates = this.roadmapGenerator.generateTasks(context);

    const tasks: RoadmapTask[] = [];

    taskTemplates.forEach((template) => {
      const task = RoadmapTask.create(
        roadmap.id,
        template.phase,
        template.category,
        template.orderIndex,
        template.title,
        template.description,
      );

      // Add educational content
      (task as any).props.whatIsIt = template.whatIsIt;
      (task as any).props.whyNeeded = template.whyNeeded;
      (task as any).props.howToGet = template.howToGet;
      (task as any).props.estimatedDays = template.estimatedDays;
      (task as any).props.legalBasis = template.legalBasis;

      // First task is unlocked
      if (template.orderIndex === 0) {
        task.unlock();
      }

      tasks.push(task);
    });

    // 4. Save tasks
    await this.taskRepo.saveMany(tasks);

    // 5. Update roadmap progress
    roadmap.updateProgress(0, tasks.length);
    await this.roadmapRepo.save(roadmap);

    return {
      roadmap: roadmap.toJSON(),
      tasks: tasks.map((t) => t.toJSON()),
    };
  }

  /**
   * Mark task as complete
   */
  async completeTask(taskId: string, userId: string, notes?: string) {
    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.complete(userId, notes);
    await this.taskRepo.save(task);

    // Unlock next tasks
    const allTasks = await this.taskRepo.findByRoadmapId((task as any).props.roadmapId);

    allTasks.forEach((t) => {
      const deps = (t as any).props.dependsOnTaskIds;
      if (deps.includes(taskId) && t.status === 'LOCKED') {
        t.unlock();
      }
    });

    // Update roadmap progress
    const roadmap = await this.roadmapRepo.findById((task as any).props.roadmapId);
    if (roadmap) {
      const completed = allTasks.filter((t) => t.isCompleted).length;
      roadmap.updateProgress(completed, allTasks.length);
      await this.roadmapRepo.save(roadmap);
    }

    return {
      task: task.toJSON(),
      message: 'Task completed successfully',
    };
  }

  /**
   * Get roadmap with tasks
   */
  async getRoadmap(estateId: string) {
    const roadmap = await this.roadmapRepo.findByEstateId(estateId);

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    const tasks = await this.taskRepo.findByRoadmapId(roadmap.id);

    // Group tasks by phase
    const tasksByPhase = tasks.reduce(
      (acc, task) => {
        const phase = (task as any).props.phase;
        if (!acc[phase]) acc[phase] = [];
        acc[phase].push(task.toJSON());
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return {
      roadmap: roadmap.toJSON(),
      tasksByPhase,
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.isCompleted).length,
        availableTasks: tasks.filter((t) => t.status === 'AVAILABLE').length,
        lockedTasks: tasks.filter((t) => t.status === 'LOCKED').length,
      },
    };
  }
}
