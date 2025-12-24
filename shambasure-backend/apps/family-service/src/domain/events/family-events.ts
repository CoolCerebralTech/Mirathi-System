import { DomainEvent } from '../base/domain-event';

// =============================================================================
// AGGREGATE LIFECYCLE EVENTS
// =============================================================================

export class FamilyCreatedEvent extends DomainEvent<{
  familyId: string;
  name: string;
  creatorId: string;
  timestamp: Date;
}> {
  constructor(payload: { familyId: string; name: string; creatorId: string; timestamp: Date }) {
    super(payload.familyId, 'FamilyAggregate', 1, payload);
  }
}

export class FamilyPolygamyDetectedEvent extends DomainEvent<{
  familyId: string;
  reason: string;
  timestamp: Date;
}> {
  constructor(payload: { familyId: string; reason: string; timestamp: Date }) {
    super(payload.familyId, 'FamilyAggregate', 1, payload);
  }
}

export class FamilyHouseEstablishedEvent extends DomainEvent<{
  familyId: string;
  houseId: string;
  houseName: string;
  timestamp: Date;
}> {
  constructor(payload: { familyId: string; houseId: string; houseName: string; timestamp: Date }) {
    super(payload.familyId, 'FamilyAggregate', 1, payload);
  }
}

export class FamilyMemberAddedEvent extends DomainEvent<{
  familyId: string;
  memberId: string;
  name: string;
  timestamp: Date;
}> {
  constructor(payload: { familyId: string; memberId: string; name: string; timestamp: Date }) {
    super(payload.familyId, 'FamilyAggregate', 1, payload);
  }
}

// =============================================================================
// FAMILY MEMBER ENTITY EVENTS
// =============================================================================

export class FamilyMemberCreatedEvent extends DomainEvent<{
  memberId: string;
  fullName: string;
  nationalId?: string;
  createdBy: string;
  timestamp: Date;
}> {
  constructor(payload: {
    memberId: string;
    fullName: string;
    nationalId?: string;
    createdBy: string;
    timestamp: Date;
  }) {
    super(payload.memberId, 'FamilyMember', 1, payload);
  }
}

export class FamilyMemberUpdatedEvent extends DomainEvent<{
  memberId: string;
  changes: Record<string, { old: any; new: any }>;
  updatedBy: string;
  timestamp: Date;
}> {
  constructor(payload: {
    memberId: string;
    changes: Record<string, { old: any; new: any }>;
    updatedBy: string;
    timestamp: Date;
  }) {
    super(payload.memberId, 'FamilyMember', 1, payload);
  }
}

/**
 * Critical Event for Estate Service
 * Triggers: Asset Freezing, Will Activation, Probate Readiness Check
 */
export class FamilyMemberDeathRecordedEvent extends DomainEvent<{
  memberId: string;
  fullName: string;
  dateOfBirth?: Date;
  dateOfDeath: Date;
  ageAtDeath?: number | null;
  causeOfDeath?: string;
  burialLocation?: string;
  deathCertificateNumber: string;
  recordedBy: string;
  timestamp: Date;
}> {
  constructor(payload: {
    memberId: string;
    fullName: string;
    dateOfBirth?: Date;
    dateOfDeath: Date;
    ageAtDeath?: number | null;
    causeOfDeath?: string;
    burialLocation?: string;
    deathCertificateNumber: string;
    recordedBy: string;
    timestamp: Date;
  }) {
    super(payload.memberId, 'FamilyMember', 1, payload);
  }
}

export class FamilyMemberNationalIdVerifiedEvent extends DomainEvent<{
  memberId: string;
  nationalId?: string;
  verified: boolean;
  notes?: string;
  verifiedBy: string;
  action: string;
}> {
  constructor(payload: {
    memberId: string;
    nationalId?: string;
    verified: boolean;
    notes?: string;
    verifiedBy: string;
    action: string;
  }) {
    super(payload.memberId, 'FamilyMember', 1, payload);
  }
}
