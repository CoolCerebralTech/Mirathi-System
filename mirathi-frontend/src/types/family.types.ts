// mirathi-frontend/src/family-types.ts

import { z } from 'zod';

// ============================================================================
// 1. ENUMS - Aligned with Prisma Schema
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

export const MarriageType = {
  MONOGAMOUS: 'MONOGAMOUS',
  POLYGAMOUS: 'POLYGAMOUS',
  COHABITATION: 'COHABITATION',
  SINGLE: 'SINGLE',
} as const;
export type MarriageType = (typeof MarriageType)[keyof typeof MarriageType];

export const MarriageStatus = {
  ACTIVE: 'ACTIVE',
  DIVORCED: 'DIVORCED',
  ANNULLED: 'ANNULLED',
  WIDOWED: 'WIDOWED',
} as const;
export type MarriageStatus = (typeof MarriageStatus)[keyof typeof MarriageStatus];

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

export const KenyanCounty = {
  BARINGO: 'BARINGO',
  BOMET: 'BOMET',
  BUNGOMA: 'BUNGOMA',
  BUSIA: 'BUSIA',
  ELGEYO_MARAKWET: 'ELGEYO_MARAKWET',
  EMBU: 'EMBU',
  GARISSA: 'GARISSA',
  HOMA_BAY: 'HOMA_BAY',
  ISIOLO: 'ISIOLO',
  KAJIADO: 'KAJIADO',
  KAKAMEGA: 'KAKAMEGA',
  KERICHO: 'KERICHO',
  KIAMBU: 'KIAMBU',
  KILIFI: 'KILIFI',
  KIRINYAGA: 'KIRINYAGA',
  KISII: 'KISII',
  KISUMU: 'KISUMU',
  KITUI: 'KITUI',
  KWALE: 'KWALE',
  LAIKIPIA: 'LAIKIPIA',
  LAMU: 'LAMU',
  MACHAKOS: 'MACHAKOS',
  MAKUENI: 'MAKUENI',
  MANDERA: 'MANDERA',
  MARSABIT: 'MARSABIT',
  MERU: 'MERU',
  MIGORI: 'MIGORI',
  MOMBASA: 'MOMBASA',
  MURANGA: 'MURANGA',
  NAIROBI: 'NAIROBI',
  NAKURU: 'NAKURU',
  NANDI: 'NANDI',
  NAROK: 'NAROK',
  NYAMIRA: 'NYAMIRA',
  NYANDARUA: 'NYANDARUA',
  NYERI: 'NYERI',
  SAMBURU: 'SAMBURU',
  SIAYA: 'SIAYA',
  TAITA_TAVETA: 'TAITA_TAVETA',
  TANA_RIVER: 'TANA_RIVER',
  THARAKA_NITHI: 'THARAKA_NITHI',
  TRANS_NZOIA: 'TRANS_NZOIA',
  TURKANA: 'TURKANA',
  UASIN_GISHU: 'UASIN_GISHU',
  VIHIGA: 'VIHIGA',
  WAJIR: 'WAJIR',
  WEST_POKOT: 'WEST_POKOT',
} as const;
export type KenyanCounty = (typeof KenyanCounty)[keyof typeof KenyanCounty];

// ============================================================================
// 2. ZOD SCHEMAS - Form Validation
// ============================================================================

// --- Family Creation ---
export const CreateFamilySchema = z.object({
  name: z
    .string()
    .min(3, 'Family name must be at least 3 characters')
    .max(200, 'Family name cannot exceed 200 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  // Note: Backend currently consumes name/description. 
  // County/Tribe fields kept for future UI/DB expansion.
  homeCounty: z.nativeEnum(KenyanCounty).optional(),
  tribe: z.string().max(50).optional(),
  clanName: z.string().max(100).optional(),
});

// --- Add Family Member ---
export const AddFamilyMemberSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name cannot exceed 100 characters'),
  middleName: z.string().max(100).optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name cannot exceed 100 characters'),
  maidenName: z.string().max(100).optional(),
  relationship: z.nativeEnum(RelationshipType),
  gender: z.nativeEnum(Gender).optional(),
  
  // Dates (ISO 8601 format)
  dateOfBirth: z.string().optional(),
  
  // Identity Documents
  nationalId: z.string().max(20).optional(),
  birthCertNo: z.string().max(50).optional(),
  kraPin: z.string().max(20).optional(),
  passportNumber: z.string().max(50).optional(),
  
  // Contact
  phoneNumber: z.string().max(20).optional(),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  currentAddress: z.string().max(500).optional(),
  
  // IMPORTANT: Backend handles isAlive/isMinor defaults. 
  // Sending them caused 400 Bad Request in tests.
  // We only include optional override fields if needed for specialized logic later.
  
  dateOfDeath: z.string().optional(),
  deathCertNo: z.string().max(50).optional(),
  
  // Special Statuses
  hasDisability: z.boolean().default(false),
  disabilityType: z.string().optional(),
  
  // Adoption
  isAdopted: z.boolean().default(false),
  adoptionType: z.enum(['LEGAL', 'CUSTOMARY']).optional(),
  adoptionDate: z.string().optional(),
  biologicalParentIds: z.array(z.string().uuid()).optional(),
  
  // Polygamy Context
  polygamousHouseId: z.string().uuid().optional(),
});

// --- Update Family Member ---
export const UpdateFamilyMemberSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  maidenName: z.string().max(100).optional(),
  gender: z.nativeEnum(Gender).optional(),
  
  dateOfBirth: z.string().datetime().optional(),
  placeOfBirth: z.string().max(200).optional(),
  
  nationalId: z.string().max(20).optional(),
  birthCertNo: z.string().max(50).optional(),
  kraPin: z.string().max(20).optional(),
  passportNumber: z.string().max(50).optional(),
  
  phoneNumber: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
  currentAddress: z.string().optional(),
  
  // Life Status - Update allows changing this
  isAlive: z.boolean().optional(),
  dateOfDeath: z.string().datetime().optional(),
  deathCertNo: z.string().max(50).optional(),
  
  // Disability
  hasDisability: z.boolean().optional(),
  disabilityType: z.string().optional(),
  isMentallyCapable: z.boolean().optional(),
});

// --- Marriage Creation ---
export const CreateMarriageSchema = z.object({
  spouse1Id: z.string().uuid(),
  spouse2Id: z.string().uuid(),
  type: z.nativeEnum(MarriageType),
  status: z.nativeEnum(MarriageStatus).default('ACTIVE'),
  marriageDate: z.string().datetime(),
  certNumber: z.string().max(100).optional(),
  isPolygamous: z.boolean().default(false),
  polygamousHouseId: z.string().uuid().optional(),
});

// --- Polygamous House Creation ---
export const CreatePolygamousHouseSchema = z.object({
  houseName: z.string().min(3).max(100),
  houseOrder: z.number().int().positive(),
  houseCode: z.string().max(20),
  motherId: z.string().uuid(),
  motherName: z.string().max(200),
  legalNotes: z.string().optional(),
});

// --- Guardian Eligibility Checklist ---
// Strictly matches the Backend Interface tested
export const GuardianEligibilityChecklistSchema = z.object({
  // Basic Requirements (Critical)
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
  isPrimary: z.boolean(), // Backend logic determines priority based on this
  checklist: GuardianEligibilityChecklistSchema, // Required by backend for audit trail
});

// ============================================================================
// 3. INPUT TYPES (Inferred from Zod Schemas)
// ============================================================================

export type CreateFamilyInput = z.infer<typeof CreateFamilySchema>;
export type AddFamilyMemberInput = z.infer<typeof AddFamilyMemberSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof UpdateFamilyMemberSchema>;
export type CreateMarriageInput = z.infer<typeof CreateMarriageSchema>;
export type CreatePolygamousHouseInput = z.infer<typeof CreatePolygamousHouseSchema>;
export type GuardianEligibilityChecklist = z.infer<typeof GuardianEligibilityChecklistSchema>;
export type AssignGuardianInput = z.infer<typeof AssignGuardianSchema>;

// ============================================================================
// 4. API RESPONSE TYPES
// ============================================================================

// --- Smart Suggestions ---
export interface SmartSuggestion {
  code: string;
  message: string;
  action: string;
  contextId?: string;
  severity?: 'info' | 'warning' | 'error';
}

// --- Family Response ---
export interface FamilyResponse {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  homeCounty?: KenyanCounty | null;
  tribe?: string | null;
  clanName?: string | null;
  isPolygamous: boolean;
  totalMembers: number;
  totalMinors: number;
  totalSpouses: number;
  hasMissingLinks: boolean;
  completenessScore: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

// --- Family Member Response ---
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
  placeOfBirth?: string | null;
  age?: number | null;
  
  isAlive: boolean;
  dateOfDeath?: string | null;
  
  isMinor: boolean;
  hasDisability: boolean;
  isMentallyCapable: boolean;
  
  phoneNumber?: string | null;
  email?: string | null;
  currentAddress?: string | null;
  
  verificationStatus: VerificationStatus;
  
  createdAt: string;
  updatedAt: string;
}

// --- Add Member Response ---
export interface AddMemberResponse {
  member: FamilyMemberResponse;
  suggestions: SmartSuggestion[];
}

// --- Family Tree Structures ---
// Matches the /family/mine/tree response
export interface TreeSpouse {
  id: string;
  name: string;
  houseName?: string | null;
  role?: string;
}

export interface TreeChild {
  id: string;
  name: string;
  isMinor: boolean;
  houseId?: string | null;
  role?: string;
}


// Define the Parent interface to replace 'any'
export interface TreeParent {
  id: string;
  name: string;
  role: string; // e.g., "FATHER" or "MOTHER"
  isAlive: boolean;
  gender?: Gender | null;
}

export interface FamilyTreeNode {
  id: string;
  name: string;
  role: string;
  gender?: Gender | null;
  isAlive: boolean;
  
  spouses?: TreeSpouse[];
  children?: TreeChild[];
  parents?: TreeParent[]; // Now strongly typed
  
  stats: {
    totalMembers: number;
    isPolygamous: boolean;
  };
}

// --- Heir Analysis ---
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
  // Optional fields that might be added later
  regime?: 'TESTATE' | 'INTESTATE';
  marriageType?: MarriageType;
}

// --- Guardianship Responses ---
export interface GuardianAssignmentSummary {
  id: string;
  guardianId: string;
  guardianName: string;
  wardId: string;
  wardName: string;
  isPrimary: boolean;
  isAlternate: boolean;
  priorityOrder: number;
  isActive: boolean;
  eligibilityScore: number;
  appointedDate: string;
  courtApproved: boolean;
}

export interface GuardianshipStatusResponse {
  hasGuardian: boolean;
  message?: string;
  guardianship?: {
    id: string;
    wardId: string;
    wardName: string;
    wardAge: number;
    status: GuardianshipStatus;
    eligibilityScore: number;
    proximityScore: number;
    relationshipScore: number;
    overallScore: number;
    blockingIssues: string[];
    warnings: string[];
    legalReference?: string;
    eligibilityChecklist: GuardianEligibilityChecklist;
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
  
  // Scores (0-100)
  eligibilityScore: number;
  proximityScore: number;
  relationshipScore: number;
  overallScore: number;
  
  status: GuardianshipStatus;
  isEligible: boolean;
  
  // Check Results
  passedChecks: string[];
  failedChecks: string[];
  warnings: string[];
  blockingIssues: string[];
  
  // Legal Context
  legalReference: string;
  nextSteps: string[];
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

// ============================================================================
// 5. ERROR RESPONSE TYPES
// ============================================================================

export interface ErrorResponse {
  statusCode: number;
  message: string | string[]; // Backend returns array for validation errors
  error?: string;
}