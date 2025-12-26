// src/estate-service/src/domain/events/disinheritance-record.events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Disinheritance Declared Event
 *
 * Emitted when a disinheritance record is created
 */
export class DisinheritanceDeclaredEvent extends DomainEvent<{
  recordId: string;
  willId: string;
  disinheritedPerson: Record<string, any>;
  reasonCategory: string;
  isCompleteDisinheritance: boolean;
}> {
  constructor(
    willId: string,
    recordId: string,
    disinheritedPerson: Record<string, any>,
    reasonCategory: string,
    isCompleteDisinheritance: boolean,
  ) {
    super(willId, 'Will', 1, {
      recordId,
      willId,
      disinheritedPerson,
      reasonCategory,
      isCompleteDisinheritance,
    });
  }
}

/**
 * Disinheritance Reason Updated Event
 *
 * Emitted when disinheritance reason is updated
 */
export class DisinheritanceReasonUpdatedEvent extends DomainEvent<{
  recordId: string;
  willId: string;
  disinheritedPerson: Record<string, any>;
  previousCategory: string;
  newCategory: string;
}> {
  constructor(
    willId: string,
    recordId: string,
    disinheritedPerson: Record<string, any>,
    previousCategory: string,
    newCategory: string,
  ) {
    super(willId, 'Will', 1, {
      recordId,
      willId,
      disinheritedPerson,
      previousCategory,
      newCategory,
    });
  }
}

/**
 * Disinheritance Evidence Added Event
 *
 * Emitted when evidence is added to disinheritance record
 */
export class DisinheritanceEvidenceAddedEvent extends DomainEvent<{
  recordId: string;
  willId: string;
  disinheritedPerson: Record<string, any>;
  evidenceType: string;
  description: string;
}> {
  constructor(
    willId: string,
    recordId: string,
    disinheritedPerson: Record<string, any>,
    evidenceType: string,
    description: string,
  ) {
    super(willId, 'Will', 1, {
      recordId,
      willId,
      disinheritedPerson,
      evidenceType,
      description,
    });
  }
}

/**
 * Disinheritance Acknowledged Event
 *
 * Emitted when disinherited person acknowledges disinheritance
 */
export class DisinheritanceAcknowledgedEvent extends DomainEvent<{
  recordId: string;
  willId: string;
  disinheritedPerson: Record<string, any>;
  acknowledgmentMethod: string;
  acknowledgmentDate: string;
}> {
  constructor(
    willId: string,
    recordId: string,
    disinheritedPerson: Record<string, any>,
    acknowledgmentMethod: string,
    acknowledgmentDate: Date,
  ) {
    super(willId, 'Will', 1, {
      recordId,
      willId,
      disinheritedPerson,
      acknowledgmentMethod,
      acknowledgmentDate: acknowledgmentDate.toISOString(),
    });
  }
}

/**
 * Disinheritance Deactivated Event
 *
 * Emitted when disinheritance record is deactivated
 */
export class DisinheritanceDeactivatedEvent extends DomainEvent<{
  recordId: string;
  willId: string;
  disinheritedPerson: Record<string, any>;
  reason: string;
}> {
  constructor(
    willId: string,
    recordId: string,
    disinheritedPerson: Record<string, any>,
    reason: string,
  ) {
    super(willId, 'Will', 1, {
      recordId,
      willId,
      disinheritedPerson,
      reason,
    });
  }
}

/**
 * Disinheritance Reactivated Event
 *
 * Emitted when disinheritance record is reactivated
 */
export class DisinheritanceReactivatedEvent extends DomainEvent<{
  recordId: string;
  willId: string;
  disinheritedPerson: Record<string, any>;
}> {
  constructor(willId: string, recordId: string, disinheritedPerson: Record<string, any>) {
    super(willId, 'Will', 1, {
      recordId,
      willId,
      disinheritedPerson,
    });
  }
}

/**
 * Disinheritance Risk Recalculated Event
 *
 * Emitted when legal risk is recalculated
 */
export class DisinheritanceRiskRecalculatedEvent extends DomainEvent<{
  recordId: string;
  willId: string;
  disinheritedPerson: Record<string, any>;
  previousRiskLevel: string;
  newRiskLevel: string;
}> {
  constructor(
    willId: string,
    recordId: string,
    disinheritedPerson: Record<string, any>,
    previousRiskLevel: string,
    newRiskLevel: string,
  ) {
    super(willId, 'Will', 1, {
      recordId,
      willId,
      disinheritedPerson,
      previousRiskLevel,
      newRiskLevel,
    });
  }
}
