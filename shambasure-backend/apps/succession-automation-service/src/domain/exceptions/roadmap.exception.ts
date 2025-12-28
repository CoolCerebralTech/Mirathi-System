// src/succession-automation/src/domain/exceptions/roadmap.exception.ts

/**
 * Domain Exceptions for Executor Roadmap
 */

export abstract class DomainException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// ============================================================================
// Roadmap Not Found
// ============================================================================

export class RoadmapNotFoundException extends DomainException {
  constructor(roadmapId: string) {
    super(`Executor Roadmap with ID ${roadmapId} not found`, 'ROADMAP_NOT_FOUND', 404, {
      roadmapId,
    });
  }
}

// ============================================================================
// Roadmap Already Complete
// ============================================================================

export class RoadmapAlreadyCompleteException extends DomainException {
  constructor(roadmapId: string, completedAt: Date) {
    super(
      `Roadmap ${roadmapId} was already completed on ${completedAt.toISOString()}. Cannot modify completed roadmaps.`,
      'ROADMAP_ALREADY_COMPLETE',
      409,
      { roadmapId, completedAt },
    );
  }
}

// ============================================================================
// Task Not Found
// ============================================================================

export class TaskNotFoundException extends DomainException {
  constructor(taskId: string, roadmapId: string) {
    super(`Task ${taskId} not found in roadmap ${roadmapId}`, 'TASK_NOT_FOUND', 404, {
      taskId,
      roadmapId,
    });
  }
}

// ============================================================================
// Task Dependencies Not Met
// ============================================================================

export class TaskDependenciesNotMetException extends DomainException {
  constructor(
    taskId: string,
    taskTitle: string,
    unmetDependencies: Array<{ id: string; title: string }>,
  ) {
    const depTitles = unmetDependencies.map((d) => d.title).join(', ');

    super(
      `Cannot start task "${taskTitle}" - dependencies not met: ${depTitles}`,
      'TASK_DEPENDENCIES_NOT_MET',
      400,
      {
        taskId,
        taskTitle,
        unmetDependencies,
      },
    );
  }
}

// ============================================================================
// Invalid Task Status Transition
// ============================================================================

export class InvalidTaskStatusTransitionException extends DomainException {
  constructor(
    taskId: string,
    taskTitle: string,
    currentStatus: string,
    attemptedTransition: string,
  ) {
    super(
      `Cannot transition task "${taskTitle}" from ${currentStatus} to ${attemptedTransition}`,
      'INVALID_TASK_STATUS_TRANSITION',
      400,
      {
        taskId,
        taskTitle,
        currentStatus,
        attemptedTransition,
      },
    );
  }
}

// ============================================================================
// Task Cannot Be Skipped
// ============================================================================

export class TaskCannotBeSkippedException extends DomainException {
  constructor(taskId: string, taskTitle: string, reason: string) {
    super(`Cannot skip task "${taskTitle}": ${reason}`, 'TASK_CANNOT_BE_SKIPPED', 400, {
      taskId,
      taskTitle,
      reason,
    });
  }
}

// ============================================================================
// Task Proof Required
// ============================================================================

export class TaskProofRequiredException extends DomainException {
  constructor(taskId: string, taskTitle: string, proofType: string) {
    super(
      `Task "${taskTitle}" requires proof of completion (${proofType})`,
      'TASK_PROOF_REQUIRED',
      400,
      {
        taskId,
        taskTitle,
        proofType,
      },
    );
  }
}

// ============================================================================
// Phase Not Complete
// ============================================================================

export class PhaseNotCompleteException extends DomainException {
  constructor(
    roadmapId: string,
    currentPhase: string,
    phaseProgress: number,
    incompleteTasks: Array<{ id: string; title: string }>,
  ) {
    const taskTitles = incompleteTasks.map((t) => t.title).join(', ');

    super(
      `Cannot advance from ${currentPhase} phase - only ${phaseProgress}% complete. ` +
        `Incomplete tasks: ${taskTitles}`,
      'PHASE_NOT_COMPLETE',
      400,
      {
        roadmapId,
        currentPhase,
        phaseProgress,
        incompleteTasks,
      },
    );
  }
}

// ============================================================================
// Cannot Advance Past Final Phase
// ============================================================================

export class CannotAdvancePastFinalPhaseException extends DomainException {
  constructor(roadmapId: string, currentPhase: string) {
    super(
      `Roadmap ${roadmapId} is already in final phase (${currentPhase})`,
      'CANNOT_ADVANCE_PAST_FINAL_PHASE',
      400,
      {
        roadmapId,
        currentPhase,
      },
    );
  }
}

// ============================================================================
// Duplicate Task Order Index
// ============================================================================

export class DuplicateTaskOrderIndexException extends DomainException {
  constructor(orderIndex: number, existingTaskId: string) {
    super(
      `Task order index ${orderIndex} is already used by task ${existingTaskId}`,
      'DUPLICATE_TASK_ORDER_INDEX',
      409,
      {
        orderIndex,
        existingTaskId,
      },
    );
  }
}

// ============================================================================
// Task Dependency Cycle
// ============================================================================

export class TaskDependencyCycleException extends DomainException {
  constructor(taskId: string, dependencyChain: string[]) {
    super(
      `Task ${taskId} creates a circular dependency: ${dependencyChain.join(' → ')}`,
      'TASK_DEPENDENCY_CYCLE',
      400,
      {
        taskId,
        dependencyChain,
      },
    );
  }
}

// ============================================================================
// Invalid Task Priority
// ============================================================================

export class InvalidTaskPriorityException extends DomainException {
  constructor(taskId: string, invalidPriority: string) {
    super(`Invalid task priority: ${invalidPriority}`, 'INVALID_TASK_PRIORITY', 400, {
      taskId,
      invalidPriority,
      validPriorities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    });
  }
}

// ============================================================================
// Task Already Completed
// ============================================================================

export class TaskAlreadyCompletedException extends DomainException {
  constructor(taskId: string, taskTitle: string, completedAt: Date) {
    super(
      `Task "${taskTitle}" was already completed on ${completedAt.toISOString()}`,
      'TASK_ALREADY_COMPLETED',
      409,
      {
        taskId,
        taskTitle,
        completedAt,
      },
    );
  }
}

// ============================================================================
// Task Not Started
// ============================================================================

export class TaskNotStartedException extends DomainException {
  constructor(taskId: string, taskTitle: string) {
    super(
      `Cannot complete task "${taskTitle}" - task has not been started`,
      'TASK_NOT_STARTED',
      400,
      {
        taskId,
        taskTitle,
      },
    );
  }
}

// ============================================================================
// Task Locked
// ============================================================================

export class TaskLockedException extends DomainException {
  constructor(
    taskId: string,
    taskTitle: string,
    lockedDependencies: Array<{ id: string; title: string }>,
  ) {
    const depTitles = lockedDependencies.map((d) => d.title).join(', ');

    super(
      `Task "${taskTitle}" is locked. Complete these tasks first: ${depTitles}`,
      'TASK_LOCKED',
      400,
      {
        taskId,
        taskTitle,
        lockedDependencies,
      },
    );
  }
}

// ============================================================================
// Missing Task Instructions
// ============================================================================

export class MissingTaskInstructionsException extends DomainException {
  constructor(taskId: string, taskTitle: string) {
    super(`Task "${taskTitle}" has no instructions defined`, 'MISSING_TASK_INSTRUCTIONS', 400, {
      taskId,
      taskTitle,
    });
  }
}

// ============================================================================
// Invalid Task Due Date
// ============================================================================

export class InvalidTaskDueDateException extends DomainException {
  constructor(taskId: string, taskTitle: string, dueDate: Date, reason: string) {
    super(`Invalid due date for task "${taskTitle}": ${reason}`, 'INVALID_TASK_DUE_DATE', 400, {
      taskId,
      taskTitle,
      dueDate,
      reason,
    });
  }
}

// ============================================================================
// Task Category Invalid for Phase
// ============================================================================

export class TaskCategoryInvalidForPhaseException extends DomainException {
  constructor(taskId: string, taskTitle: string, taskCategory: string, currentPhase: string) {
    super(
      `Task "${taskTitle}" (category: ${taskCategory}) cannot be added to phase ${currentPhase}`,
      'TASK_CATEGORY_INVALID_FOR_PHASE',
      400,
      {
        taskId,
        taskTitle,
        taskCategory,
        currentPhase,
      },
    );
  }
}

// ============================================================================
// Cannot Reopen Task
// ============================================================================

export class CannotReopenTaskException extends DomainException {
  constructor(taskId: string, taskTitle: string, currentStatus: string, reason: string) {
    super(
      `Cannot reopen task "${taskTitle}" (status: ${currentStatus}): ${reason}`,
      'CANNOT_REOPEN_TASK',
      400,
      {
        taskId,
        taskTitle,
        currentStatus,
        reason,
      },
    );
  }
}

// ============================================================================
// No Tasks In Roadmap
// ============================================================================

export class NoTasksInRoadmapException extends DomainException {
  constructor(roadmapId: string) {
    super(`Roadmap ${roadmapId} has no tasks`, 'NO_TASKS_IN_ROADMAP', 400, { roadmapId });
  }
}

// ============================================================================
// Roadmap Context Mismatch
// ============================================================================

export class RoadmapContextMismatchException extends DomainException {
  constructor(roadmapId: string, expectedContext: string, actualContext: string) {
    super(
      `Roadmap ${roadmapId} context mismatch. Expected: ${expectedContext}, Actual: ${actualContext}`,
      'ROADMAP_CONTEXT_MISMATCH',
      400,
      {
        roadmapId,
        expectedContext,
        actualContext,
      },
    );
  }
}

// ============================================================================
// Invalid Task Proof Document
// ============================================================================

export class InvalidTaskProofDocumentException extends DomainException {
  constructor(taskId: string, documentId: string, reason: string) {
    super(
      `Invalid proof document ${documentId} for task ${taskId}: ${reason}`,
      'INVALID_TASK_PROOF_DOCUMENT',
      400,
      {
        taskId,
        documentId,
        reason,
      },
    );
  }
}
