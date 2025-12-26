// src/estate-service/src/domain/events/legal-dependant.event.ts
import { DomainEvent } from '../base/domain-event';
import { EvidenceType } from '../entities/dependant-evidence.entity';
import { DependantRelationship, DependantStatus } from '../entities/legal-dependant.entity';
import { KenyanLawSection } from '../enums/kenyan-law-section.enum';

export class LegalDependantCreatedEvent extends DomainEvent<{
  estateId: string;
  dependantId: string;
  relationship: DependantRelationship;
  lawSection: KenyanLawSection;
}> {
  constructor(
    dependantId: string,
    estateId: string,
    dependantIdRef: string,
    relationship: DependantRelationship,
    lawSection: KenyanLawSection,
    version: number,
  ) {
    super(dependantId, 'LegalDependant', version, {
      estateId,
      dependantId: dependantIdRef,
      relationship,
      lawSection,
    });
  }
}

export class DependantEvidenceAddedEvent extends DomainEvent<{
  estateId: string;
  evidenceType: EvidenceType;
  evidenceId: string;
  addedBy: string;
}> {
  constructor(
    dependantId: string,
    estateId: string,
    evidenceType: EvidenceType,
    evidenceId: string,
    addedBy: string,
    version: number,
  ) {
    super(dependantId, 'LegalDependant', version, {
      estateId,
      evidenceType,
      evidenceId,
      addedBy,
    });
  }
}

export class LegalDependantVerifiedEvent extends DomainEvent<{
  estateId: string;
  verifiedBy: string;
  verificationNotes?: string;
}> {
  constructor(
    dependantId: string,
    estateId: string,
    verifiedBy: string,
    verificationNotes: string | undefined,
    version: number,
  ) {
    super(dependantId, 'LegalDependant', version, {
      estateId,
      verifiedBy,
      verificationNotes,
    });
  }
}

export class LegalDependantRejectedEvent extends DomainEvent<{
  estateId: string;
  reason: string;
  rejectedBy: string;
  courtOrderRef?: string;
}> {
  constructor(
    dependantId: string,
    estateId: string,
    reason: string,
    rejectedBy: string,
    courtOrderRef: string | undefined,
    version: number,
  ) {
    super(dependantId, 'LegalDependant', version, {
      estateId,
      reason,
      rejectedBy,
      courtOrderRef,
    });
  }
}

export class LegalDependantStatusChangedEvent extends DomainEvent<{
  estateId: string;
  oldStatus: DependantStatus;
  newStatus: DependantStatus;
  reason: string;
  changedBy: string;
}> {
  constructor(
    dependantId: string,
    estateId: string,
    oldStatus: DependantStatus,
    newStatus: DependantStatus,
    reason: string,
    changedBy: string,
    version: number,
  ) {
    super(dependantId, 'LegalDependant', version, {
      estateId,
      oldStatus,
      newStatus,
      reason,
      changedBy,
    });
  }
}
