// src/succession-automation/src/application/roadmap/queries/view-models/task-detail.vm.ts
import {
  ProofType,
  RoadmapTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../../../../domain/entities/roadmap-task.entity';

/**
 * Lightweight VM for Lists/Tables
 */
export class RoadmapTaskSummaryVm {
  id: string;
  shortCode: string;
  title: string;
  category: TaskCategory;
  phase: number;

  status: TaskStatus;
  priority: TaskPriority;

  dueDate?: string;
  isOverdue: boolean;
  daysRemaining?: number;

  // UI Helpers
  statusIcon: string;
  urgencyScore: number;
  isLocked: boolean;

  static fromEntity(task: RoadmapTask): RoadmapTaskSummaryVm {
    const now = new Date();
    // FIX 1: Handle null return from getDaysRemaining by defaulting to undefined
    const daysRemaining = task.getDaysRemaining(now) ?? undefined;

    return {
      id: task.id.toString(),
      shortCode: task.shortCode,
      title: task.title,
      category: task.category,
      phase: task.phase,

      status: task.status,
      priority: task.priority,

      dueDate: task.dueDate?.toISOString(),
      isOverdue: task.isOverdue,
      daysRemaining,

      statusIcon: task.getStatusIcon(),
      urgencyScore: task.getUrgencyScore(),
      isLocked: task.status === TaskStatus.LOCKED || task.status === TaskStatus.BLOCKED,
    };
  }
}

/**
 * Rich VM for the Task Detail Modal/Page
 */
export class RoadmapTaskDetailVm extends RoadmapTaskSummaryVm {
  description: string;

  // Instructions
  detailedInstructions: string[];
  quickTips: string[];
  commonMistakes: string[];
  externalLinks: Array<{ title: string; url: string; type: string }>;

  // Legal Context
  legalReferences: Array<{ act: string; section: string; description: string }>;

  // Execution Data
  requiresProof: boolean;
  proofTypes: ProofType[];
  proofDocumentType?: string;

  // Dependencies
  dependencies: Array<{ id: string; isMet: boolean }>;

  // Completion Info
  completedAt?: string;
  completedBy?: string;
  completionNotes?: string;

  // History
  historyLog: Array<{ action: string; date: string; user: string; details?: string }>;

  static fromEntityDetailed(task: RoadmapTask, allTasks: RoadmapTask[]): RoadmapTaskDetailVm {
    const summary = RoadmapTaskSummaryVm.fromEntity(task);

    // Resolve dependency status for display
    const dependencies = task.dependsOnTaskIds.map((depId) => {
      const depTask = allTasks.find((t) => t.id.equals(depId));
      const isMet = depTask
        ? depTask.status === TaskStatus.COMPLETED || depTask.status === TaskStatus.SKIPPED
        : false;
      return { id: depId, isMet };
    });

    // FIX 2: Access missing getters via toJSON() to avoid TS errors
    // (The Entity has these in props but didn't expose public getters for them)
    const taskData = task.toJSON();

    return {
      ...summary,
      description: task.description,

      detailedInstructions: task.detailedInstructions,
      quickTips: task.quickTips,
      commonMistakes: task.commonMistakes,
      externalLinks: task.externalLinks,

      legalReferences: task.legalReferences,

      requiresProof: task.requiresProof,
      proofTypes: task.proofTypes,
      proofDocumentType: task.proofDocumentType,

      dependencies,

      completedAt: task.completedAt?.toISOString(),
      // Access safely from JSON view
      completedBy: taskData.completedBy,
      completionNotes: taskData.completionNotes,

      historyLog: task.history.map((h) => ({
        action: h.action,
        date: h.timestamp.toISOString(),
        user: h.performedBy,
        details: h.details,
      })),
    };
  }
}
