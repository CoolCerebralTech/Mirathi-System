// packages/shared-types/src/family-service/types.ts

import { z } from 'zod';

// ============================================================================
// 1. ENUMS - Aligned with Prisma Schema
// ============================================================================

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHERS: 'OTHERS', // Updated to match Prisma schema
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
  dateOfBirth: z.string().datetime().optional(),
  
  // Identity Documents
  nationalId: z.string().max(20).optional(),
  birthCertNo: z.string().max(50).optional(),
  kraPin: z.string().max(20).optional(),
  passportNumber: z.string().max(50).optional(),
  
  // Contact
  phoneNumber: z.string().max(20).optional(),
  email: z.string().email('Invalid email address').max(255).optional(),
  currentAddress: z.string().max(500).optional(),
  
  // Life Status
  isAlive: z.boolean().default(true),
  dateOfDeath: z.string().datetime().optional(),
  deathCertNo: z.string().max(50).optional(),
  causeOfDeath: z.string().max(500).optional(),
  placeOfDeath: z.string().max(200).optional(),
  
  // Special Statuses
  hasDisability: z.boolean().default(false),
  disabilityType: z.string().optional(),
  isMentallyCapable: z.boolean().default(true),
  
  // Adoption
  isAdopted: z.boolean().default(false),
  adoptionType: z.enum(['LEGAL', 'CUSTOMARY']).optional(),
  adoptionDate: z.string().datetime().optional(),
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
  
  // Life Status
  isAlive: z.boolean().optional(),
  dateOfDeath: z.string().datetime().optional(),
  deathCertNo: z.string().max(50).optional(),
  causeOfDeath: z.string().max(500).optional(),
  placeOfDeath: z.string().max(200).optional(),
  
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
  registeredAt: z.string().datetime().optional(),
  registryOffice: z.string().max(200).optional(),
  isPolygamous: z.boolean().default(false),
  marriageOrder: z.number().int().positive().optional(),
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
  isPrimary: z.boolean(),
  isAlternate: z.boolean().default(false),
  priorityOrder: z.number().int().positive().default(1),
  checklist: GuardianEligibilityChecklistSchema,
  courtApproved: z.boolean().default(false),
  courtOrderRef: z.string().max(100).optional(),
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
  homeCounty?: KenyanCounty;
  tribe?: string;
  clanName?: string;
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
  userId?: string;
  
  // Core Identity
  firstName: string;
  middleName?: string;
  lastName: string;
  maidenName?: string;
  relationship: RelationshipType;
  
  // Demographics
  gender?: Gender;
  dateOfBirth?: string;
  placeOfBirth?: string;
  age?: number;
  
  // Identity Documents
  nationalId?: string;
  birthCertNo?: string;
  kraPin?: string;
  passportNumber?: string;
  
  // Life Status
  isAlive: boolean;
  dateOfDeath?: string;
  deathCertNo?: string;
  causeOfDeath?: string;
  placeOfDeath?: string;
  
  // Special Statuses
  isMinor: boolean;
  hasDisability: boolean;
  disabilityType?: string;
  isMentallyCapable: boolean;
  
  // Adoption
  isAdopted: boolean;
  adoptionType?: string;
  adoptionDate?: string;
  biologicalParentIds?: string[];
  
  // Polygamy
  polygamousHouseId?: string;
  
  // Contact
  phoneNumber?: string;
  email?: string;
  currentAddress?: string;
  
  // Verification
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// --- Add Member Response ---
export interface AddMemberResponse {
  member: FamilyMemberResponse;
  suggestions: SmartSuggestion[];
}

// --- Marriage Response ---
export interface MarriageResponse {
  id: string;
  familyId: string;
  spouse1Id: string;
  spouse2Id: string;
  type: MarriageType;
  status: MarriageStatus;
  marriageDate: string;
  divorceDate?: string;
  isPolygamous: boolean;
  marriageOrder?: number;
  polygamousHouseId?: string;
  certNumber?: string;
  registeredAt?: string;
  registryOffice?: string;
  numberOfChildren: number;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

// --- Polygamous House Response ---
export interface PolygamousHouseResponse {
  id: string;
  familyId: string;
  houseName: string;
  houseOrder: number;
  houseCode: string;
  motherId: string;
  motherName: string;
  childCount: number;
  isActive: boolean;
  dissolutionDate?: string;
  dissolutionReason?: string;
  legalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Family Tree Structures ---
export interface TreeSpouse {
  id: string;
  name: string;
  houseName?: string;
  houseOrder?: number;
  role?: string;
  isAlive: boolean;
  gender?: Gender;
}

export interface TreeChild {
  id: string;
  name: string;
  isMinor: boolean;
  age?: number;
  houseId?: string;
  houseName?: string;
  role?: string;
  isAlive: boolean;
  gender?: Gender;
}

export interface TreeParent {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;
  gender?: Gender;
}

export interface FamilyTreeNode {
  id: string;
  name: string;
  role: string;
  gender?: Gender;
  isAlive: boolean;
  age?: number;
  isMinor: boolean;
  
  spouses?: TreeSpouse[];
  children?: TreeChild[];
  parents?: TreeParent[];
  siblings?: TreeChild[];
  
  stats: {
    totalMembers: number;
    totalMinors: number;
    totalSpouses: number;
    isPolygamous: boolean;
    completenessScore: number;
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
  house?: string;
  houseOrder?: number;
  share?: string;
  conditions?: string[];
}

export interface HeirsResponse {
  heirs: PotentialHeir[];
  regime: 'TESTATE' | 'INTESTATE' | 'PARTIALLY_INTESTATE';
  religion: 'STATUTORY' | 'ISLAMIC' | 'HINDU' | 'CUSTOMARY';
  marriageType: MarriageType;
  disclaimer: string;
  legalNote: string;
  warnings?: string[];
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
  proximityScore: number;
  relationshipScore: number;
  overallScore: number;
  appointedDate: string;
  activatedDate?: string;
  courtApproved: boolean;
  courtOrderRef?: string;
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
  };
  primaryGuardian?: GuardianAssignmentSummary;
  alternateGuardians?: GuardianAssignmentSummary[];
  compliance?: {
    isCompliant: boolean;
    lastReportDate?: string;
    nextReportDue?: string;
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
  
  // Detailed Checklist
  checklistSnapshot?: GuardianEligibilityChecklist;
}

export interface ChecklistTemplateResponse {
  title: string;
  subtitle: string;
  sections: {
    category: string;
    description?: string;
    checks: {
      key: keyof GuardianEligibilityChecklist;
      label: string;
      description?: string;
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
  legalContext: string;
}

// ============================================================================
// 5. PAGINATED RESPONSE TYPES
// ============================================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================================================
// 6. ERROR RESPONSE TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  details?: ValidationError[];
  timestamp: string;
  path?: string;
}

// ============================================================================
// 7. UTILITY TYPES
// ============================================================================

export type CreateFamilyResponse = FamilyResponse;
export type UpdateFamilyResponse = FamilyResponse;
export type GetFamilyResponse = FamilyResponse;

export type CreateMemberResponse = AddMemberResponse;
export type UpdateMemberResponse = AddMemberResponse;
export type GetMemberResponse = FamilyMemberResponse;

export type ListMembersResponse = PaginatedResponse<FamilyMemberResponse>;
export type ListMarriagesResponse = PaginatedResponse<MarriageResponse>;
export type ListHousesResponse = PaginatedResponse<PolygamousHouseResponse>;