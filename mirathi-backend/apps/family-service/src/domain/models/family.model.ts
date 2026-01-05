// apps/family-service/src/domain/models/family.model.ts
import {
  Gender,
  GuardianshipStatus,
  KenyanCounty,
  MarriageStatus,
  MarriageType,
  RelationshipType,
  VerificationStatus,
} from '@prisma/client';

/**
 * Aggregate Root: Family
 * Represents the entire tree for a user.
 */
export interface Family {
  id: string;
  creatorId: string;
  name: string;
  description?: string;

  // Cultural Context
  homeCounty?: KenyanCounty;
  tribe?: string;
  clanName?: string;

  // Computed Status
  isPolygamous: boolean;
  totalMembers: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entity: FamilyMember
 * Core node in the family tree.
 */
export interface FamilyMember {
  id: string;
  familyId: string;
  userId?: string; // If the member is also a registered user

  // Identity
  firstName: string;
  middleName?: string;
  lastName: string;
  maidenName?: string;

  relationship: RelationshipType; // Relation to Creator

  // Demographics
  gender?: Gender;
  dateOfBirth?: Date;
  nationalId?: string;

  // Status
  isAlive: boolean;
  dateOfDeath?: Date;
  isMinor: boolean;

  // Contact
  phoneNumber?: string;
  email?: string;

  // Verification
  verificationStatus: VerificationStatus;
}

/**
 * Entity: Guardianship
 * Represents the logic for assigning a guardian to a minor.
 */
export interface Guardianship {
  id: string;
  familyId: string;
  wardId: string; // The Child
  status: GuardianshipStatus;

  // Scoring logic result
  eligibilityScore: number;
  overallScore: number;

  // Assignments (Array of Guardians)
  assignments?: GuardianAssignment[];
}

export interface GuardianAssignment {
  guardianId: string; // The Adult
  guardianName: string;
  isPrimary: boolean;
  priorityOrder: number; // 1 = First Choice
  isActive: boolean;
}

/**
 * Entity: Marriage
 * Crucial for detecting Section 40 vs Section 29 succession paths.
 */
export interface Marriage {
  id: string;
  familyId: string;
  spouse1Id: string;
  spouse2Id: string;
  type: MarriageType;
  status: MarriageStatus;
  isPolygamous: boolean;
  dateOfMarriage?: Date;
}
