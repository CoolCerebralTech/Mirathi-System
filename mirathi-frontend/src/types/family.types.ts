import { z } from 'zod';

// ============================================================================
// 1. SHARED CONSTANTS & ENUMS
// ============================================================================
export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const RelationshipType = {
  SELF: 'SELF', // Added as it's the root of the tree
  SPOUSE: 'SPOUSE',
  CHILD: 'CHILD',
  ADOPTED_CHILD: 'ADOPTED_CHILD', // Added
  FATHER: 'FATHER', // Backend specific
  MOTHER: 'MOTHER', // Backend specific
  SIBLING: 'SIBLING',
  GRANDCHILD: 'GRANDCHILD',
  GRANDPARENT: 'GRANDPARENT',
  OTHER: 'OTHER',
} as const;
export type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType];

export const GuardianshipStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING', // Backend uses PENDING/ELIGIBLE logic
  ELIGIBLE: 'ELIGIBLE',
  CONDITIONAL: 'CONDITIONAL',
  INELIGIBLE: 'INELIGIBLE',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
} as const;
export type GuardianshipStatus = (typeof GuardianshipStatus)[keyof typeof GuardianshipStatus];

// ============================================================================
// 2. FORM SCHEMAS (Zod) - Aligned with Backend DTOs
// ============================================================================

// --- Family Creation ---
export const CreateFamilySchema = z.object({
  name: z.string().min(3, 'Family name must be at least 3 characters').max(200),
  description: z.string().max(500).optional(),
});

// --- Add Member ---
export const AddFamilyMemberSchema = z.object({
  firstName: z.string().min(2, 'First name is required').max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(2, 'Last name is required').max(100),
  maidenName: z.string().max(100).optional(),
  relationship: z.nativeEnum(RelationshipType),
  gender: z.nativeEnum(Gender).optional(),
  
  // Dates
  dateOfBirth: z.string().optional(), // ISO Date String
  
  // Identity
  nationalId: z.string().max(20).optional(),
  phoneNumber: z.string().max(20).optional(),
  email: z.string().email().optional(),
  
  // Context
  isAdopted: z.boolean().optional(),
  adoptionDate: z.string().optional(),
  polygamousHouseId: z.string().uuid().optional(),
});

// --- Update Member ---
export const UpdateFamilyMemberSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  maidenName: z.string().max(100).optional(),
  gender: z.nativeEnum(Gender).optional(),
  
  dateOfBirth: z.string().optional(),
  nationalId: z.string().max(20).optional(),
  phoneNumber: z.string().max(20).optional(),
  email: z.string().email().optional(),
  
  // Vital Status
  isAlive: z.boolean().optional(),
  dateOfDeath: z.string().optional(),
  deathCertNo: z.string().max(50).optional(),
  causeOfDeath: z.string().max(500).optional(),
});

// --- Guardianship Eligibility Checklist ---
export const GuardianEligibilityChecklistSchema = z.object({
  // Basic Requirements
  isOver18: z.boolean(),
  hasNoCriminalRecord: z.boolean(),
  isMentallyCapable: z.boolean(),

  // Financial & Stability
  hasFinancialStability: z.boolean(),
  hasStableResidence: z.boolean(),

  // Character
  hasGoodMoralCharacter: z.boolean(),
  isNotBeneficiary: z.boolean(),
  hasNoSubstanceAbuse: z.boolean(),

  // Practical
  isPhysicallyCapable: z.boolean(),
  hasTimeAvailability: z.boolean(),

  // Relationship & Legal
  hasCloseRelationship: z.boolean(),
  hasWardConsent: z.boolean(),
  understandsLegalDuties: z.boolean(),
  willingToPostBond: z.boolean(),
});

// --- Assign Guardian ---
export const AssignGuardianSchema = z.object({
  wardId: z.string().uuid(),
  guardianId: z.string().uuid(),
  isPrimary: z.boolean(),
  checklist: GuardianEligibilityChecklistSchema,
});

// ============================================================================
// 3. API RESPONSE TYPES
// ============================================================================
export interface SmartSuggestion {
  code: string;
  message: string;
  action: string;
  contextId?: string;
}
export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  relationship: RelationshipType;
  gender?: Gender;
  isMinor: boolean;
  age?: number | null;
  isAlive: boolean;
}
export interface AddMemberResponse {
  member: FamilyMember;
  suggestions: SmartSuggestion[];
}
export interface ChecklistTemplateResponse {
  title: string;
  subtitle: string;
  sections: {
    category: string;
    checks: {
      key: string;
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
export interface CreateFamilyResponse {
  id: string;
  name: string;
  description?: string;
}
export interface TreeSpouse {
  id: string;
  name: string;
  houseName?: string | null;
  role?: string;
  isAlive?: boolean;
}
export interface TreeChild {
  id: string;
  name: string;
  isMinor: boolean;
  houseId?: string | null;
  role?: string;
  isAlive?: boolean;
}

export interface TreeParent {
  id: string;
  name: string;
  role: string;
  isAlive?: boolean;
}

export interface FamilyTreeNode {
  id: string;
  name: string;
  role: string; // 'Me'
  gender?: Gender;
  isAlive: boolean;
  
  spouses?: TreeSpouse[];
  children?: TreeChild[];
  parents?: TreeParent[];
  
  stats?: {
    totalMembers: number;
    isPolygamous: boolean;
  };
}
// --- Heir Analysis ---
export interface PotentialHeir {
  id: string;
  name: string;
  category: 'SPOUSE' | 'CHILD' | 'PARENT' | 'WARNING';
  priority?: number;
  legalBasis: string;
  description: string;
  house?: string | null; // For polygamous context
}

export interface HeirsResponse {
  heirs: PotentialHeir[];
  disclaimer: string;
  legalNote: string;
}

// --- Guardianship Status ---
export interface GuardianAssignmentSummary {
  id: string;
  guardianId: string;
  guardianName: string; // Flattened for display
  isPrimary: boolean;
  priorityOrder: number;
  isActive: boolean;
  eligibilityScore: number;
}

export interface GuardianshipStatusResponse {
  hasGuardian: boolean;
  message?: string;
  guardianship?: {
    id: string;
    wardId: string;
    wardName: string;
    status: GuardianshipStatus;
    overallScore: number;
    blockingIssues: string[];
    warnings: string[];
  };
  primaryGuardian?: GuardianAssignmentSummary;
  alternateGuardians?: GuardianAssignmentSummary[];
  compliance?: {
    isCompliant: boolean;
    issues: string[];
  };
}

export interface EligibilityCheckResponse {
  guardianId: string;
  guardianName: string;
  wardId: string;
  wardName: string;
  
  // Scores
  eligibilityScore: number;
  proximityScore: number;
  relationshipScore: number;
  overallScore: number;
  
  status: GuardianshipStatus;
  isEligible: boolean;
  
  // Details
  passedChecks: string[];
  failedChecks: string[];
  warnings: string[];
  blockingIssues: string[];
  
  // UX
  legalReference: string;
  nextSteps: string[];
}

// ============================================================================
// 4. INFERRED TYPES (Use these in your React Components)
// ============================================================================

export type CreateFamilyInput = z.infer<typeof CreateFamilySchema>;
export type AddFamilyMemberInput = z.infer<typeof AddFamilyMemberSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof UpdateFamilyMemberSchema>;
export type GuardianEligibilityChecklist = z.infer<typeof GuardianEligibilityChecklistSchema>;
export type AssignGuardianInput = z.infer<typeof AssignGuardianSchema>;