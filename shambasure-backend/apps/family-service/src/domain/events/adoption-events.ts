// src/family-service/src/domain/events/adoption-events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * AdoptionUpdatedEvent
 * Emitted when adoption record information is updated
 */
export class AdoptionUpdatedEvent extends DomainEvent<{
  recordId: string;
  changes: Record<string, any>;
  updatedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    recordId: string;
    changes: Record<string, any>;
    updatedBy: string;
    timestamp: Date;
  }) {
    super(
      params.recordId,
      'AdoptionRecord',
      1, // Default version, would come from aggregate
      {
        recordId: params.recordId,
        changes: params.changes,
        updatedBy: params.updatedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * AdoptionFinalizedEvent
 * Emitted when adoption is finalized by court
 */
export class AdoptionFinalizedEvent extends DomainEvent<{
  recordId: string;
  adopteeId: string;
  adoptiveParentId: string;
  finalizationDate: Date;
  courtOrderNumber: string;
  previousStatus: string;
  finalizedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    recordId: string;
    adopteeId: string;
    adoptiveParentId: string;
    finalizationDate: Date;
    courtOrderNumber: string;
    previousStatus: string;
    finalizedBy: string;
    timestamp: Date;
  }) {
    super(
      params.recordId,
      'AdoptionRecord',
      1,
      {
        recordId: params.recordId,
        adopteeId: params.adopteeId,
        adoptiveParentId: params.adoptiveParentId,
        finalizationDate: params.finalizationDate,
        courtOrderNumber: params.courtOrderNumber,
        previousStatus: params.previousStatus,
        finalizedBy: params.finalizedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * AdoptionBiologicalParentConsentEvent
 * Emitted when biological parent gives/withholds consent
 */
export class AdoptionBiologicalParentConsentEvent extends DomainEvent<{
  recordId: string;
  adopteeId: string;
  parentType: 'MOTHER' | 'FATHER';
  consentStatus: 'CONSENTED' | 'WITHHELD' | 'TERMINATED';
  consentDocumentId: string;
  recordedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    recordId: string;
    adopteeId: string;
    parentType: 'MOTHER' | 'FATHER';
    consentStatus: 'CONSENTED' | 'WITHHELD' | 'TERMINATED';
    consentDocumentId: string;
    recordedBy: string;
    timestamp: Date;
  }) {
    super(
      params.recordId,
      'AdoptionRecord',
      1,
      {
        recordId: params.recordId,
        adopteeId: params.adopteeId,
        parentType: params.parentType,
        consentStatus: params.consentStatus,
        consentDocumentId: params.consentDocumentId,
        recordedBy: params.recordedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}

/**
 * AdoptionRevokedEvent
 * Emitted when adoption is revoked
 */
export class AdoptionRevokedEvent extends DomainEvent<{
  recordId: string;
  adopteeId: string;
  adoptiveParentId: string;
  revocationDate: Date;
  reason: 'FRAUD' | 'COERCION' | 'BEST_INTERESTS' | 'PARENTAL_RECLAMATION' | 'OTHER';
  courtOrderId: string;
  previousStatus: string;
  revokedBy: string;
  timestamp: Date;
}> {
  constructor(params: {
    recordId: string;
    adopteeId: string;
    adoptiveParentId: string;
    revocationDate: Date;
    reason: 'FRAUD' | 'COERCION' | 'BEST_INTERESTS' | 'PARENTAL_RECLAMATION' | 'OTHER';
    courtOrderId: string;
    previousStatus: string;
    revokedBy: string;
    timestamp: Date;
  }) {
    super(
      params.recordId,
      'AdoptionRecord',
      1,
      {
        recordId: params.recordId,
        adopteeId: params.adopteeId,
        adoptiveParentId: params.adoptiveParentId,
        revocationDate: params.revocationDate,
        reason: params.reason,
        courtOrderId: params.courtOrderId,
        previousStatus: params.previousStatus,
        revokedBy: params.revokedBy,
        timestamp: params.timestamp,
      },
      params.timestamp,
    );
  }
}
