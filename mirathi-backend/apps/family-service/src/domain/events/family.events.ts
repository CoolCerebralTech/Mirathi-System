// apps/family-service/src/domain/events/family.events.ts
import { v4 as uuidv4 } from 'uuid';

import { BaseEvent, ShambaEvents } from '@shamba/messaging';

/**
 * Abstract implementation to satisfy BaseEvent interface requirements
 */
export abstract class DomainEvent<T> implements BaseEvent<T> {
  constructor(
    public readonly eventType: ShambaEvents,
    public readonly payload: T,
    public readonly correlationId: string = uuidv4(),
    public readonly timestamp: string = new Date().toISOString(),
    public readonly userId?: string,
  ) {}
}

// ============================================================================
// FAMILY EVENTS
// ============================================================================

// --- Family Created ---
export interface FamilyCreatedPayload {
  familyId: string;
  creatorId: string;
  familyName: string;
  createdAt: Date;
}

export class FamilyCreatedEvent extends DomainEvent<FamilyCreatedPayload> {
  constructor(
    public readonly familyId: string,
    public readonly creatorId: string,
    public readonly familyName: string,
    public readonly createdAt: Date,
    correlationId?: string,
    timestamp?: string,
  ) {
    super(
      ShambaEvents.FAMILY_FAMILY_CREATED,
      { familyId, creatorId, familyName, createdAt },
      correlationId,
      timestamp,
      creatorId,
    );
  }
}

// --- Family Member Added ---
export interface FamilyMemberAddedPayload {
  familyId: string;
  memberId: string;
  memberName: string;
  relationship: string;
  isMinor: boolean;
  addedAt: Date;
}

export class FamilyMemberAddedEvent extends DomainEvent<FamilyMemberAddedPayload> {
  constructor(
    public readonly familyId: string,
    public readonly memberId: string,
    public readonly memberName: string,
    public readonly relationship: string,
    public readonly isMinor: boolean,
    public readonly addedAt: Date,
    correlationId?: string,
    timestamp?: string,
  ) {
    super(
      ShambaEvents.FAMILY_MEMBER_ADDED,
      { familyId, memberId, memberName, relationship, isMinor, addedAt },
      correlationId,
      timestamp,
    );
  }
}

// --- Family Member Deceased (CRITICAL - Triggers Estate Creation) ---
export interface FamilyMemberDeceasedPayload {
  familyId: string;
  memberId: string;
  memberName: string;
  nationalId?: string;
  dateOfDeath: Date;
  deathCertNo?: string;
  causeOfDeath?: string;
}

export class FamilyMemberDeceasedEvent extends DomainEvent<FamilyMemberDeceasedPayload> {
  constructor(
    public readonly familyId: string,
    public readonly memberId: string,
    public readonly memberName: string,
    public readonly nationalId: string | undefined,
    public readonly dateOfDeath: Date,
    public readonly deathCertNo: string | undefined,
    public readonly causeOfDeath: string | undefined,
    correlationId?: string,
    timestamp?: string,
  ) {
    super(
      ShambaEvents.FAMILY_MEMBER_DECEASED,
      { familyId, memberId, memberName, nationalId, dateOfDeath, deathCertNo, causeOfDeath },
      correlationId,
      timestamp,
      'system',
    );
  }
}

// ============================================================================
// GUARDIANSHIP EVENTS
// ============================================================================

// --- Guardian Assigned ---
export interface GuardianAssignedPayload {
  familyId: string;
  guardianshipId: string;
  wardId: string;
  wardName: string;
  guardianId: string;
  guardianName: string;
  isPrimary: boolean;
  eligibilityScore: number;
  status: string;
  assignedAt: Date;
}

export class GuardianAssignedEvent extends DomainEvent<GuardianAssignedPayload> {
  constructor(
    public readonly familyId: string,
    public readonly guardianshipId: string,
    public readonly wardId: string,
    public readonly wardName: string,
    public readonly guardianId: string,
    public readonly guardianName: string,
    public readonly isPrimary: boolean,
    public readonly eligibilityScore: number,
    public readonly status: string,
    public readonly assignedAt: Date,
    correlationId?: string,
    timestamp?: string,
  ) {
    super(
      ShambaEvents.FAMILY_GUARDIAN_ASSIGNED,
      {
        familyId,
        guardianshipId,
        wardId,
        wardName,
        guardianId,
        guardianName,
        isPrimary,
        eligibilityScore,
        status,
        assignedAt,
      },
      correlationId,
      timestamp,
    );
  }
}

// --- Guardianship Status Changed ---
export interface GuardianshipStatusChangedPayload {
  guardianshipId: string;
  wardId: string;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  changedAt: Date;
}

export class GuardianshipStatusChangedEvent extends DomainEvent<GuardianshipStatusChangedPayload> {
  constructor(
    public readonly guardianshipId: string,
    public readonly wardId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly reason: string | undefined,
    public readonly changedAt: Date,
    correlationId?: string,
    timestamp?: string,
  ) {
    super(
      ShambaEvents.FAMILY_GUARDIANSHIP_STATUS_CHANGED,
      { guardianshipId, wardId, previousStatus, newStatus, reason, changedAt },
      correlationId,
      timestamp,
      'system',
    );
  }
}

// ============================================================================
// MARRIAGE EVENTS (For Polygamy Detection)
// ============================================================================

// --- Polygamy Detected ---
export interface PolygamyDetectedPayload {
  familyId: string;
  totalSpouses: number;
  totalHouses: number;
  detectedAt: Date;
}

export class PolygamyDetectedEvent extends DomainEvent<PolygamyDetectedPayload> {
  constructor(
    public readonly familyId: string,
    public readonly totalSpouses: number,
    public readonly totalHouses: number,
    public readonly detectedAt: Date,
    correlationId?: string,
    timestamp?: string,
  ) {
    super(
      ShambaEvents.FAMILY_POLYGAMY_DETECTED,
      { familyId, totalSpouses, totalHouses, detectedAt },
      correlationId,
      timestamp,
      'system',
    );
  }
}
