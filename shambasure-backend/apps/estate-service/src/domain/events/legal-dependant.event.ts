// src/estate-service/src/domain/events/legal-dependant.event.ts
import { DomainEvent } from '../base/domain-event';
import { DependantRelationship } from '../entities/legal-dependant.entity';

export abstract class LegalDependantEvent<T = any> extends DomainEvent<T> {
  constructor(
    aggregateId: string,
    eventType: string,
    version: number,
    payload: T,
    occurredAt?: Date,
  ) {
    super(aggregateId, eventType, version, payload, occurredAt);
  }
}

export class LegalDependantCreatedEvent extends LegalDependantEvent<{
  dependantId: string;
  estateId: string;
  fullName: string;
  relationship: DependantRelationship;
}> {
  constructor(
    dependantId: string,
    estateId: string,
    fullName: string,
    relationship: DependantRelationship,
    version: number,
  ) {
    super(dependantId, 'LegalDependantCreatedEvent', version, {
      dependantId,
      estateId,
      fullName,
      relationship,
    });
  }
}

export class LegalDependantVerifiedEvent extends LegalDependantEvent<{
  dependantId: string;
  estateId: string;
  verifiedBy: string;
}> {
  constructor(dependantId: string, estateId: string, verifiedBy: string, version: number) {
    super(dependantId, 'LegalDependantVerifiedEvent', version, {
      dependantId,
      estateId,
      verifiedBy,
    });
  }
}

export class LegalDependantRejectedEvent extends LegalDependantEvent<{
  dependantId: string;
  estateId: string;
  reason: string;
  rejectedBy: string;
}> {
  constructor(
    dependantId: string,
    estateId: string,
    reason: string,
    rejectedBy: string,
    version: number,
  ) {
    super(dependantId, 'LegalDependantRejectedEvent', version, {
      dependantId,
      estateId,
      reason,
      rejectedBy,
    });
  }
}

export class DependantEvidenceAddedEvent extends LegalDependantEvent<{
  dependantId: string;
  estateId: string;
  evidenceType: string;
}> {
  constructor(dependantId: string, estateId: string, evidenceType: string, version: number) {
    super(dependantId, 'DependantEvidenceAddedEvent', version, {
      dependantId,
      estateId,
      evidenceType,
    });
  }
}
