// FILE: src/types/family.types.ts

import { z } from 'zod';

// ============================================================================
// 1. ENUMS
// ============================================================================

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHERS: 'OTHERS',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const RelationshipType = {
  SELF: 'SELF',
  FATHER: 'FATHER',
  MOTHER: 'MOTHER',
  SPOUSE: 'SPOUSE',
  CHILD: 'CHILD',
  ADOPTED_CHILD: 'ADOPTED_CHILD',
  SIBLING: 'SIBLING',
  HALF_SIBLING: 'HALF_SIBLING',
} as const;
export type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType];

export const GuardianshipStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  ELIGIBLE: 'ELIGIBLE',
  CONDITIONAL: 'CONDITIONAL',
  INELIGIBLE: 'INELIGIBLE',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
} as const;
export type GuardianshipStatus = (typeof GuardianshipStatus)[keyof typeof GuardianshipStatus];

export const VerificationStatus = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  DISPUTED: 'DISPUTED',
  REJECTED: 'REJECTED',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

// ============================================================================
// 2. ZOD SCHEMAS
// ============================================================================

export const CreateFamilySchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(500).optional(),
});

export const AddFamilyMemberSchema = z.object({
  firstName: z.string().min(2).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(2).max(100),
  maidenName: z.string().max(100).optional(),
  relationship: z.nativeEnum(RelationshipType),
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.string().optional(),
  nationalId: z.string().max(20).optional(),
  phoneNumber: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  isAdopted: z.boolean().optional(),
  adoptionDate: z.string().optional(),
  polygamousHouseId: z.string().uuid().optional(),
});

export const UpdateFamilyMemberSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  maidenName: z.string().max(100).optional(),
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.string().datetime().optional(),
  nationalId: z.string().max(20).optional(),
  phoneNumber: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
  isAlive: z.boolean().optional(),
  dateOfDeath: z.string().datetime().optional(),
  deathCertNo: z.string().max(50).optional(),
  causeOfDeath: z.string().max(500).optional(),
});

export const GuardianEligibilityChecklistSchema = z.object({
  isOver18: z.boolean(),
  hasNoCriminalRecord: z.boolean(),
  isMentallyCapable: z.boolean(),
  hasFinancialStability: z.boolean(),
  hasStableResidence: z.boolean(),
  hasGoodMoralCharacter: z.boolean(),
  isNotBeneficiary: z.boolean(),
  hasNoSubstanceAbuse: z.boolean(),
  isPhysicallyCapable: z.boolean(),
  hasTimeAvailability: z.boolean(),
  hasCloseRelationship: z.boolean(),
  hasWardConsent: z.boolean(),
  understandsLegalDuties: z.boolean(),
  willingToPostBond: z.boolean(),
});

export const AssignGuardianSchema = z.object({
  wardId: z.string().uuid(),
  guardianId: z.string().uuid(),
  isPrimary: z.boolean(),
  checklist: GuardianEligibilityChecklistSchema,
});

export const CheckGuardianEligibilitySchema = z.object({
  guardianId: z.string().uuid(),
  wardId: z.string().uuid(),
  checklist: GuardianEligibilityChecklistSchema,
});

// ============================================================================
// 3. INPUT TYPES
// ============================================================================

export type CreateFamilyInput = z.infer<typeof CreateFamilySchema>;
export type AddFamilyMemberInput = z.infer<typeof AddFamilyMemberSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof UpdateFamilyMemberSchema>;
export type GuardianEligibilityChecklist = z.infer<typeof GuardianEligibilityChecklistSchema>;
export type AssignGuardianInput = z.infer<typeof AssignGuardianSchema>;
export type CheckGuardianEligibilityInput = z.infer<typeof CheckGuardianEligibilitySchema>;

// ============================================================================
// 4. RESPONSE TYPES
// ============================================================================

export interface SmartSuggestion {
  code: string;
  message: string;
  action: string;
  contextId?: string;
}

export interface FamilyResponse {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  isPolygamous: boolean;
  totalMembers: number;
  totalMinors: number;
  totalSpouses: number;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMemberResponse {
  id: string;
  familyId: string;
  userId?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  maidenName?: string | null;
  relationship: RelationshipType;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  age?: number | null;
  isAlive: boolean;
  dateOfDeath?: string | null;
  isMinor: boolean;
  isAdopted: boolean;
  verificationStatus: VerificationStatus;
  nationalId?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddMemberResponse {
  member: FamilyMemberResponse;
  suggestions: SmartSuggestion[];
}

// Tree Visualization
export interface FamilyTreeNode {
  id: string;
  name: string;
  role: string;
  gender?: Gender | null;
  isAlive: boolean;
  spouses?: { id: string; name: string; houseName?: string | null }[];
  children?: { id: string; name: string; isMinor: boolean; houseId?: string | null }[];
  parents?: { id: string; name: string; role: string }[];
  stats: {
    totalMembers: number;
    isPolygamous: boolean;
  };
}

// Heirs
export interface PotentialHeir {
  id: string;
  name: string;
  category: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'WARNING';
  priority: number;
  legalBasis: string;
  description: string;
  house?: string | null;
  isMinor?: boolean;
}

export interface HeirsResponse {
  heirs: PotentialHeir[];
  disclaimer: string;
  legalNote: string;
}

// Guardianship Records
export interface GuardianAssignmentSummary {
  id: string;
  guardianId: string;
  guardianName: string;
  wardId: string;
  isPrimary: boolean;
  isActive: boolean;
  eligibilityScore: number;
}

export interface GuardianshipRecord {
  id: string;
  familyId: string;
  wardId: string;
  wardName: string;
  wardAge: number;
  status: GuardianshipStatus;
  overallScore: number;
  eligibilityScore: number;
  eligibilityChecklist: GuardianEligibilityChecklist;
  warnings: string[];
  blockingIssues: string[];
  createdAt: string;
  updatedAt: string;
  assignments: unknown[];
}

export interface GuardianshipAssignmentResponse {
  id: string;
  guardianId: string;
  guardianName: string;
  wardId: string;
  isPrimary: boolean;
  isActive: boolean;
  eligibilityScore: number;
}

// --- MISSING TYPES ADDED BELOW ---

export interface EligibilityCheckResponse {
  guardianId: string;
  guardianName: string;
  wardId: string;
  wardName: string;
  eligibilityScore: number;
  proximityScore: number;
  relationshipScore: number;
  overallScore: number;
  status: GuardianshipStatus;
  isEligible: boolean;
  passedChecks: string[];
  failedChecks: string[];
  warnings: string[];
  blockingIssues: string[];
  legalReference: string;
  nextSteps: string[];
}

export interface GuardianshipStatusResponse {
  hasGuardian: boolean;
  message?: string;
  guardianship?: GuardianshipRecord;
  primaryGuardian?: GuardianAssignmentSummary;
  alternateGuardians?: GuardianAssignmentSummary[];
  compliance?: {
    isCompliant: boolean;
    issues: string[];
  };
}

export interface ChecklistTemplateResponse {
  title: string;
  subtitle: string;
  sections: {
    category: string;
    checks: {
      key: keyof GuardianEligibilityChecklist;
      label: string;
      required: boolean;
      legalRef?: string;
    }[];
  }[];
  scoringInfo: {
    eligibilityWeight: number;
    proximityWeight: number;
    relationshipWeight: number;
    passingScore: number;
    excellentScore: number;
  };
}