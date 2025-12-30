// src/estate-service/src/domain/events/executor-nomination.events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Executor Nominated Event
 *
 * Emitted when a new executor is nominated in a will
 */
export class ExecutorNominatedEvent extends DomainEvent<{
  executorId: string;
  willId: string;
  executorName: string;
  priority: Record<string, any>;
  appointmentType: string;
}> {
  constructor(
    willId: string,
    executorId: string,
    executorName: string,
    priority: Record<string, any>,
    appointmentType: string,
  ) {
    super(willId, 'Will', 1, {
      executorId,
      willId,
      executorName,
      priority,
      appointmentType,
    });
  }
}

/**
 * Executor Consent Updated Event
 *
 * Emitted when executor consent status changes
 */
export class ExecutorConsentUpdatedEvent extends DomainEvent<{
  executorId: string;
  willId: string;
  executorName: string;
  previousStatus?: string;
  newStatus: string;
  notes?: string;
}> {
  constructor(
    willId: string,
    executorId: string,
    executorName: string,
    previousStatus: string | undefined,
    newStatus: string,
    notes?: string,
  ) {
    super(willId, 'Will', 1, {
      executorId,
      willId,
      executorName,
      previousStatus,
      newStatus,
      notes,
    });
  }
}

/**
 * Executor Contact Updated Event
 *
 * Emitted when executor contact information is updated
 */
export class ExecutorContactUpdatedEvent extends DomainEvent<{
  executorId: string;
  willId: string;
  executorName: string;
  updatedFields: string[];
}> {
  constructor(willId: string, executorId: string, executorName: string, updatedFields: string[]) {
    super(willId, 'Will', 1, {
      executorId,
      willId,
      executorName,
      updatedFields,
    });
  }
}

/**
 * Executor Powers Granted Event
 *
 * Emitted when specific powers are granted to executor
 */
export class ExecutorPowersGrantedEvent extends DomainEvent<{
  executorId: string;
  willId: string;
  executorName: string;
  powers: string[];
}> {
  constructor(willId: string, executorId: string, executorName: string, powers: string[]) {
    super(willId, 'Will', 1, {
      executorId,
      willId,
      executorName,
      powers,
    });
  }
}

/**
 * Executor Compensation Set Event
 *
 * Emitted when executor compensation is defined
 */
export class ExecutorCompensationSetEvent extends DomainEvent<{
  executorId: string;
  willId: string;
  executorName: string;
  isEntitled: boolean;
  amount?: number;
  basis?: string;
}> {
  constructor(
    willId: string,
    executorId: string,
    executorName: string,
    isEntitled: boolean,
    amount?: number,
    basis?: string,
  ) {
    super(willId, 'Will', 1, {
      executorId,
      willId,
      executorName,
      isEntitled,
      amount,
      basis,
    });
  }
}

/**
 * Executor Qualification Checked Event
 *
 * Emitted when executor qualification is assessed
 */
export class ExecutorQualificationCheckedEvent extends DomainEvent<{
  executorId: string;
  willId: string;
  executorName: string;
  isQualified: boolean;
  reasons: string[];
  assessment: Record<string, any>;
}> {
  constructor(
    willId: string,
    executorId: string,
    executorName: string,
    isQualified: boolean,
    reasons: string[],
    assessment: Record<string, any>,
  ) {
    super(willId, 'Will', 1, {
      executorId,
      willId,
      executorName,
      isQualified,
      reasons,
      assessment,
    });
  }
}
