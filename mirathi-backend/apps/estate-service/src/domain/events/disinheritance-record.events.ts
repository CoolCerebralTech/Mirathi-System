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
 * Emitted when the reason for disinheritance is changed
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
 * Emitted when new evidence is added to support the disinheritance
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
 * Emitted when the disinherited person acknowledges the decision
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
    acknowledgmentDate: string,
  ) {
    super(willId, 'Will', 1, {
      recordId,
      willId,
      disinheritedPerson,
      acknowledgmentMethod,
      acknowledgmentDate,
    });
  }
}

/**
 * Disinheritance Deactivated Event
 *
 * Emitted when a disinheritance record is deactivated (removed/revoked)
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
 * Emitted when a previously deactivated record is reinstated
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
