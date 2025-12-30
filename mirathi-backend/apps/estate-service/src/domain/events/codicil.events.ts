// src/estate-service/src/domain/events/codicil.events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Codicil Created Event
 *
 * Emitted when a new codicil is created for a will
 */
export class CodicilCreatedEvent extends DomainEvent<{
  codicilId: string;
  willId: string;
  title: string;
  amendmentType: string;
  versionNumber: number;
}> {
  constructor(
    willId: string,
    codicilId: string,
    title: string,
    amendmentType: string,
    versionNumber: number,
  ) {
    super(willId, 'Will', 1, {
      codicilId,
      willId,
      title,
      amendmentType,
      versionNumber,
    });
  }
}

/**
 * Codicil Content Updated Event
 *
 * Emitted when codicil content is modified
 */
export class CodicilContentUpdatedEvent extends DomainEvent<{
  codicilId: string;
  willId: string;
  previousVersion: number;
  newVersion: number;
  changeSummary?: string;
}> {
  constructor(
    willId: string,
    codicilId: string,
    previousVersion: number,
    newVersion: number,
    changeSummary?: string,
  ) {
    super(willId, 'Will', 1, {
      codicilId,
      willId,
      previousVersion,
      newVersion,
      changeSummary,
    });
  }
}

/**
 * Codicil Witness Added Event
 *
 * Emitted when a witness is added to a codicil
 */
export class CodicilWitnessAddedEvent extends DomainEvent<{
  codicilId: string;
  willId: string;
  witnessId: string;
  totalWitnesses: number;
}> {
  constructor(willId: string, codicilId: string, witnessId: string, totalWitnesses: number) {
    super(willId, 'Will', 1, {
      codicilId,
      willId,
      witnessId,
      totalWitnesses,
    });
  }
}

/**
 * Codicil Executed Event
 *
 * Emitted when codicil is properly witnessed and dated
 */
export class CodicilExecutedEvent extends DomainEvent<{
  codicilId: string;
  willId: string;
  executionDate: string;
  witnessCount: number;
  amendmentType: string;
}> {
  constructor(
    willId: string,
    codicilId: string,
    executionDate: Date,
    witnessCount: number,
    amendmentType: string,
  ) {
    super(willId, 'Will', 1, {
      codicilId,
      willId,
      executionDate: executionDate.toISOString(),
      witnessCount,
      amendmentType,
    });
  }
}

/**
 * Codicil Validation Failed Event
 *
 * Emitted when codicil validation fails
 */
export class CodicilValidationFailedEvent extends DomainEvent<{
  codicilId: string;
  willId: string;
  validationErrors: string[];
  severity: 'ERROR' | 'WARNING';
}> {
  constructor(
    willId: string,
    codicilId: string,
    validationErrors: string[],
    severity: 'ERROR' | 'WARNING' = 'ERROR',
  ) {
    super(willId, 'Will', 1, {
      codicilId,
      willId,
      validationErrors,
      severity,
    });
  }
}
