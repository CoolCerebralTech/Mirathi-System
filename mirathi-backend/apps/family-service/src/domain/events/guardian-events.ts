// src/family-service/src/domain/events/guardian-events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Guardian Assignment Activated Event
 */
export class GuardianAssignmentActivatedEvent extends DomainEvent<{
  assignmentId: string;
  guardianId: string;
  activationDate: Date;
}> {
  constructor(params: { assignmentId: string; guardianId: string; activationDate: Date }) {
    super(
      params.assignmentId,
      'GuardianAssignment',
      1,
      {
        assignmentId: params.assignmentId,
        guardianId: params.guardianId,
        activationDate: params.activationDate,
      },
      new Date(),
    );
  }
}

/**
 * Guardian Assignment Deactivated Event
 */
export class GuardianAssignmentDeactivatedEvent extends DomainEvent<{
  assignmentId: string;
  guardianId: string;
  reason: string;
  effectiveDate: Date;
  wasPrimary: boolean;
}> {
  constructor(params: {
    assignmentId: string;
    guardianId: string;
    reason: string;
    effectiveDate: Date;
    wasPrimary: boolean;
  }) {
    super(
      params.assignmentId,
      'GuardianAssignment',
      1,
      {
        assignmentId: params.assignmentId,
        guardianId: params.guardianId,
        reason: params.reason,
        effectiveDate: params.effectiveDate,
        wasPrimary: params.wasPrimary,
      },
      new Date(),
    );
  }
}

/**
 * Conflict of Interest Detected Event
 */
export class ConflictOfInterestDetectedEvent extends DomainEvent<{
  assignmentId: string;
  conflictType: string;
  severity: string;
  description: string;
}> {
  constructor(params: {
    assignmentId: string;
    conflictType: string;
    severity: string;
    description: string;
  }) {
    super(
      params.assignmentId,
      'GuardianAssignment',
      1,
      {
        assignmentId: params.assignmentId,
        conflictType: params.conflictType,
        severity: params.severity,
        description: params.description,
      },
      new Date(),
    );
  }
}

/**
 * Conflict of Interest Resolved Event
 */
export class ConflictOfInterestResolvedEvent extends DomainEvent<{
  assignmentId: string;
  conflictType: string;
  resolution: string;
}> {
  constructor(params: { assignmentId: string; conflictType: string; resolution: string }) {
    super(
      params.assignmentId,
      'GuardianAssignment',
      1,
      {
        assignmentId: params.assignmentId,
        conflictType: params.conflictType,
        resolution: params.resolution,
      },
      new Date(),
    );
  }
}

/**
 * Guardian Assignment Suspended Event
 */
export class GuardianAssignmentSuspendedEvent extends DomainEvent<{
  assignmentId: string;
  reason: string;
  suspensionDate: Date;
}> {
  constructor(params: { assignmentId: string; reason: string; suspensionDate: Date }) {
    super(
      params.assignmentId,
      'GuardianAssignment',
      1,
      {
        assignmentId: params.assignmentId,
        reason: params.reason,
        suspensionDate: params.suspensionDate,
      },
      new Date(),
    );
  }
}

/**
 * Guardian Assignment Reactivated Event
 */
export class GuardianAssignmentReactivatedEvent extends DomainEvent<{
  assignmentId: string;
  reactivationDate: Date;
}> {
  constructor(params: { assignmentId: string; reactivationDate: Date }) {
    super(
      params.assignmentId,
      'GuardianAssignment',
      1,
      {
        assignmentId: params.assignmentId,
        reactivationDate: params.reactivationDate,
      },
      new Date(),
    );
  }
}

/**
 * Guardian Task Completed Event
 */
export class GuardianTaskCompletedEvent extends DomainEvent<{
  assignmentId: string;
  taskType: string;
  complexity: string;
  newScore: number;
}> {
  constructor(params: {
    assignmentId: string;
    taskType: string;
    complexity: string;
    newScore: number;
  }) {
    super(
      params.assignmentId,
      'GuardianAssignment',
      1,
      {
        assignmentId: params.assignmentId,
        taskType: params.taskType,
        complexity: params.complexity,
        newScore: params.newScore,
      },
      new Date(),
    );
  }
}

/**
 * Guardian Powers Updated Event
 */
export class GuardianPowersUpdatedEvent extends DomainEvent<{
  assignmentId: string;
  oldPowers: Record<string, any>;
  newPowers: Record<string, any>;
}> {
  constructor(params: {
    assignmentId: string;
    oldPowers: Record<string, any>;
    newPowers: Record<string, any>;
  }) {
    super(
      params.assignmentId,
      'GuardianAssignment',
      1,
      {
        assignmentId: params.assignmentId,
        oldPowers: params.oldPowers,
        newPowers: params.newPowers,
      },
      new Date(),
    );
  }
}

/**
 * Guardian Bond Updated Event
 */
export class GuardianBondUpdatedEvent extends DomainEvent<{
  assignmentId: string;
  bondStatus: string;
  amount: number;
}> {
  constructor(params: { assignmentId: string; bondStatus: string; amount: number }) {
    super(
      params.assignmentId,
      'GuardianAssignment',
      1,
      {
        assignmentId: params.assignmentId,
        bondStatus: params.bondStatus,
        amount: params.amount,
      },
      new Date(),
    );
  }
}

/**
 * Guardian Contact Updated Event
 */
export class GuardianContactUpdatedEvent extends DomainEvent<{
  assignmentId: string;
  verifiedBy?: string;
  newPhone: string;
}> {
  constructor(params: { assignmentId: string; verifiedBy?: string; newPhone: string }) {
    super(
      params.assignmentId,
      'GuardianAssignment',
      1,
      {
        assignmentId: params.assignmentId,
        verifiedBy: params.verifiedBy,
        newPhone: params.newPhone,
      },
      new Date(),
    );
  }
}
