// src/family-service/src/domain/events/cohabitation-events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * CohabitationStartedEvent
 * Emitted when cohabitation record is created
 */
export class CohabitationStartedEvent extends DomainEvent<{
  recordId: string;
  partner1Id: string;
  partner2Id: string;
  startDate: Date;
  createdBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    recordId: string;
    partner1Id: string;
    partner2Id: string;
    startDate: Date;
    createdBy: string;
    timestamp: Date;
  }) {
    super(
      params.recordId,
      'CohabitationRecord',
      1,
      {
        recordId: params.recordId,
        partner1Id: params.partner1Id,
        partner2Id: params.partner2Id,
        startDate: params.startDate,
        createdBy: params.createdBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * CohabitationEndedEvent
 * Emitted when cohabitation ends
 */
export class CohabitationEndedEvent extends DomainEvent<{
  recordId: string;
  partner1Id: string;
  partner2Id: string;
  endDate: Date;
  reason: 'SEPARATION' | 'MARRIAGE' | 'DEATH' | 'RELOCATION' | 'CONFLICT' | 'OTHER';
  durationDays: number;
  endedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    recordId: string;
    partner1Id: string;
    partner2Id: string;
    endDate: Date;
    reason: 'SEPARATION' | 'MARRIAGE' | 'DEATH' | 'RELOCATION' | 'CONFLICT' | 'OTHER';
    durationDays: number;
    endedBy: string;
    timestamp: Date;
  }) {
    super(
      params.recordId,
      'CohabitationRecord',
      1,
      {
        recordId: params.recordId,
        partner1Id: params.partner1Id,
        partner2Id: params.partner2Id,
        endDate: params.endDate,
        reason: params.reason,
        durationDays: params.durationDays,
        endedBy: params.endedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * CohabitationChildrenAddedEvent
 * Emitted when a child is added to cohabitation
 */
export class CohabitationChildrenAddedEvent extends DomainEvent<{
  recordId: string;
  childId: string;
  partner1Id: string;
  partner2Id: string;
  birthDate: Date;
  isBiological: boolean;
  addedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    recordId: string;
    childId: string;
    partner1Id: string;
    partner2Id: string;
    birthDate: Date;
    isBiological: boolean;
    addedBy: string;
    timestamp: Date;
  }) {
    super(
      params.recordId,
      'CohabitationRecord',
      1,
      {
        recordId: params.recordId,
        childId: params.childId,
        partner1Id: params.partner1Id,
        partner2Id: params.partner2Id,
        birthDate: params.birthDate,
        isBiological: params.isBiological,
        addedBy: params.addedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * CohabitationVerifiedEvent
 * Emitted when cohabitation is verified
 */
export class CohabitationVerifiedEvent extends DomainEvent<{
  recordId: string;
  partner1Id: string;
  partner2Id: string;
  oldStatus: string;
  newStatus: string;
  evidenceCount: number;
  verifiedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    recordId: string;
    partner1Id: string;
    partner2Id: string;
    oldStatus: string;
    newStatus: string;
    evidenceCount: number;
    verifiedBy: string;
    timestamp: Date;
  }) {
    super(
      params.recordId,
      'CohabitationRecord',
      1,
      {
        recordId: params.recordId,
        partner1Id: params.partner1Id,
        partner2Id: params.partner2Id,
        oldStatus: params.oldStatus,
        newStatus: params.newStatus,
        evidenceCount: params.evidenceCount,
        verifiedBy: params.verifiedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}
