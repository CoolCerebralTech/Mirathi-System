// src/estate-service/src/domain/events/will.events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Will Drafted Event
 *
 * Emitted when a new will is created in draft state
 */
export class WillDraftedEvent extends DomainEvent<{
  testatorId: string;
  willId: string;
  type: string;
  status: string;
}> {
  constructor(testatorId: string, willId: string, type: string, status: string) {
    super(willId, 'Will', 1, {
      testatorId,
      willId,
      type,
      status,
    });
  }
}

/**
 * Will Executed Event
 *
 * Emitted when a will is executed (signed with witnesses)
 */
export class WillExecutedEvent extends DomainEvent<{
  testatorId: string;
  willId: string;
  executionDate: Record<string, any>;
  witnessCount: number;
}> {
  constructor(
    testatorId: string,
    willId: string,
    executionDate: Record<string, any>,
    witnessCount: number,
  ) {
    super(willId, 'Will', 1, {
      testatorId,
      willId,
      executionDate,
      witnessCount,
    });
  }
}

/**
 * Will Revoked Event
 *
 * Emitted when a will is revoked
 */
export class WillRevokedEvent extends DomainEvent<{
  testatorId: string;
  willId: string;
  revocationMethod: string;
  reason?: string;
}> {
  constructor(testatorId: string, willId: string, revocationMethod: string, reason?: string) {
    super(willId, 'Will', 1, {
      testatorId,
      willId,
      revocationMethod,
      reason,
    });
  }
}

/**
 * Bequest Added Event
 *
 * Emitted when a bequest is added to a will
 */
export class BequestAddedEvent extends DomainEvent<{
  bequestId: string;
  willId: string;
  beneficiary: Record<string, any>;
  bequestType: string;
}> {
  constructor(
    bequestId: string,
    willId: string,
    beneficiary: Record<string, any>,
    bequestType: string,
  ) {
    super(willId, 'Will', 1, {
      bequestId,
      willId,
      beneficiary,
      bequestType,
    });
  }
}

/**
 * Executor Added Event
 *
 * Emitted when an executor is added to a will
 */
export class ExecutorAddedEvent extends DomainEvent<{
  executorId: string;
  willId: string;
  executorName: string;
  priority: Record<string, any>;
}> {
  constructor(
    executorId: string,
    willId: string,
    executorName: string,
    priority: Record<string, any>,
  ) {
    super(willId, 'Will', 1, {
      executorId,
      willId,
      executorName,
      priority,
    });
  }
}

/**
 * Witness Added Event
 *
 * Emitted when a witness is added to a will
 */
export class WitnessAddedEvent extends DomainEvent<{
  witnessId: string;
  willId: string;
  witnessName: string;
  witnessType: string;
}> {
  constructor(witnessId: string, willId: string, witnessName: string, witnessType: string) {
    super(willId, 'Will', 1, {
      witnessId,
      willId,
      witnessName,
      witnessType,
    });
  }
}

/**
 * Codicil Added Event
 *
 * Emitted when a codicil is added to a will
 */
export class CodicilAddedEvent extends DomainEvent<{
  codicilId: string;
  willId: string;
  title: string;
  amendmentType: string;
}> {
  constructor(codicilId: string, willId: string, title: string, amendmentType: string) {
    super(willId, 'Will', 1, {
      codicilId,
      willId,
      title,
      amendmentType,
    });
  }
}

/**
 * Disinheritance Added Event
 *
 * Emitted when a disinheritance record is added to a will
 */
export class DisinheritanceAddedEvent extends DomainEvent<{
  recordId: string;
  willId: string;
  disinheritedPerson: Record<string, any>;
  reasonCategory: string;
}> {
  constructor(
    recordId: string,
    willId: string,
    disinheritedPerson: Record<string, any>,
    reasonCategory: string,
  ) {
    super(willId, 'Will', 1, {
      recordId,
      willId,
      disinheritedPerson,
      reasonCategory,
    });
  }
}

/**
 * Capacity Declaration Updated Event
 *
 * Emitted when testator capacity declaration is updated
 */
export class CapacityDeclarationUpdatedEvent extends DomainEvent<{
  willId: string;
  status: string;
  isCompetent: boolean;
}> {
  constructor(willId: string, status: string, isCompetent: boolean) {
    super(willId, 'Will', 1, {
      willId,
      status,
      isCompetent,
    });
  }
}

/**
 * Will Validation Failed Event
 *
 * Emitted when will validation fails
 */
export class WillValidationFailedEvent extends DomainEvent<{
  willId: string;
  testatorId: string;
  validationErrors: string[];
  severity: 'ERROR' | 'WARNING';
}> {
  constructor(
    willId: string,
    testatorId: string,
    validationErrors: string[],
    severity: 'ERROR' | 'WARNING' = 'ERROR',
  ) {
    super(willId, 'Will', 1, {
      willId,
      testatorId,
      validationErrors,
      severity,
    });
  }
}
