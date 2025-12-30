import { z } from 'zod';

// ============================================================================
// 1. SHARED ENUMS (Converted to CONST OBJECTS for 'erasableSyntaxOnly')
// ============================================================================

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const KenyanCounty = {
  NAIROBI: 'NAIROBI',
  MOMBASA: 'MOMBASA',
  KISUMU: 'KISUMU',
  NAKURU: 'NAKURU',
  UASIN_GISHU: 'UASIN_GISHU',
  KIAMBU: 'KIAMBU',
  MACHAKOS: 'MACHAKOS',
  // ... (Add other counties as needed)
  OTHER: 'OTHER',
} as const;
export type KenyanCounty = (typeof KenyanCounty)[keyof typeof KenyanCounty];

export const RelationshipType = {
  SPOUSE: 'SPOUSE',
  CHILD: 'CHILD',
  PARENT: 'PARENT',
  SIBLING: 'SIBLING',
  GRANDCHILD: 'GRANDCHILD',
  GRANDPARENT: 'GRANDPARENT',
  OTHER: 'OTHER',
} as const;
export type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType];

export const MarriageType = {
  CIVIL: 'CIVIL',
  CHRISTIAN: 'CHRISTIAN',
  ISLAMIC: 'ISLAMIC',
  HINDU: 'HINDU',
  CUSTOMARY: 'CUSTOMARY',
  COME_WE_STAY: 'COME_WE_STAY', // Cohabitation
} as const;
export type MarriageType = (typeof MarriageType)[keyof typeof MarriageType];

// ============================================================================
// 2. REQUEST SCHEMAS (Zod - For Forms & Input Validation)
// ============================================================================

// --- DTO: CreateFamilyDto ---
const CreatorProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  gender: z.nativeEnum(Gender),
  dateOfBirth: z.string().optional(), // ISO Date String
  nationalId: z.string().optional(),
});

export const CreateFamilyRequestSchema = z.object({
  familyName: z.string().min(2, 'Family name must be at least 2 characters'),
  description: z.string().optional(),
  homeCounty: z.nativeEnum(KenyanCounty).optional(),
  clanName: z.string().optional(),
  subClan: z.string().optional(),
  totem: z.string().optional(),
  creatorProfile: CreatorProfileSchema,
});

// --- DTO: AddFamilyMemberDto ---
export const AddFamilyMemberRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  gender: z.nativeEnum(Gender),
  dateOfBirth: z.string().optional(),
  dateOfBirthEstimated: z.boolean().optional(),
  nationalId: z.string().optional(),
  placeOfBirth: z.nativeEnum(KenyanCounty).optional(),
  tribe: z.string().optional(),
  // Smart Link Features
  relativeId: z.string().uuid().optional(),
  relationshipToRelative: z.nativeEnum(RelationshipType).optional(),
});

// --- DTO: EstablishPolygamousHouseDto (S.40) ---
export const EstablishPolygamousHouseRequestSchema = z.object({
  originalWifeId: z.string().uuid({ message: 'Valid Wife ID required' }),
  houseHeadId: z.string().uuid().optional(),
  houseOrder: z.number().int().min(1, 'House order must be 1 or greater'),
  houseName: z.string().min(1).optional(),
  distributionWeight: z.number().default(1.0).optional(),
  establishmentType: z.enum(['CUSTOMARY', 'ISLAMIC', 'TRADITIONAL', 'COURT_RECOGNIZED']).optional(),
  residentialCounty: z.nativeEnum(KenyanCounty).optional(),
});

// --- DTO: RegisterMarriageDto ---
const DowryPaymentSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().default('KES'),
  isPaidInFull: z.boolean(),
  livestockCount: z.number().optional(),
});

export const RegisterMarriageRequestSchema = z.object({
  spouse1Id: z.string().uuid(),
  spouse2Id: z.string().uuid(),
  marriageType: z.nativeEnum(MarriageType),
  startDate: z.string().datetime(), // ISO String
  location: z.string().optional(),
  county: z.nativeEnum(KenyanCounty).optional(),
  witnesses: z.array(z.string()).optional(),
  registrationNumber: z.string().optional(),
  dowryPayment: DowryPaymentSchema.optional(),
  isPolygamous: z.boolean().optional(),
  polygamousHouseId: z.string().uuid().optional(),
  marriageOrder: z.number().optional(),
}).superRefine((data, ctx) => {
  if (data.isPolygamous && !data.polygamousHouseId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Polygamous House ID is required if marriage is polygamous",
      path: ["polygamousHouseId"],
    });
  }
});

// --- DTO: DefineRelationshipDto ---
export const DefineRelationshipRequestSchema = z.object({
  fromMemberId: z.string().uuid(),
  toMemberId: z.string().uuid(),
  relationshipType: z.nativeEnum(RelationshipType),
  isBiological: z.boolean().default(true).optional(),
  isLegal: z.boolean().default(true).optional(),
  evidenceDocumentId: z.string().uuid().optional(),
});

// --- DTO: RecordAdoptionDto ---
export const RecordAdoptionRequestSchema = z.object({
  adopteeId: z.string().uuid(),
  adoptiveParentId: z.string().uuid(),
  adoptionType: z.enum(['FORMAL', 'CUSTOMARY']),
  adoptionDate: z.string().datetime(),
  courtOrderNumber: z.string().optional(),
  courtName: z.string().optional(),
  clanElders: z.array(z.string()).optional(),
  ceremonyLocation: z.string().optional(),
  agreementDocumentId: z.string().uuid().optional(),
});

// --- DTO: RecordCohabitationDto ---
export const RecordCohabitationRequestSchema = z.object({
  partner1Id: z.string().uuid(),
  partner2Id: z.string().uuid(),
  startDate: z.string().datetime(),
  sharedResidenceAddress: z.string().min(1, 'Address is required'),
  county: z.nativeEnum(KenyanCounty),
  isExclusive: z.boolean().default(true).optional(),
  jointAssets: z.boolean().optional(),
  hasChildrenTogether: z.boolean().optional(),
  affidavitId: z.string().uuid().optional(),
});

// --- DTO: VerifyMemberIdentityDto ---
export const VerifyMemberIdentityRequestSchema = z.object({
  isValid: z.boolean(),
  verificationMethod: z.enum(['IPRS_CHECK', 'MANUAL_DOCUMENT_REVIEW', 'TRUSTED_AGENT']),
  documentId: z.string().uuid().optional(),
  notes: z.string().optional(),
  correctedNationalId: z.string().optional(),
});

// --- DTO: ArchiveFamilyDto ---
export const ArchiveFamilyRequestSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

// ============================================================================
// 3. RESPONSE INTERFACES (TypeScript - For API Data Consumption)
// ============================================================================

// --- Response: FamilyDetailsDto ---
export interface FamilyStats {
  totalMembers: number;
  livingMembers: number;
  deceasedMembers: number;
  verifiedMembers: number;
  generationsCount: number;
  potentialDependents: number;
}

export interface FamilyStructure {
  type: 'NUCLEAR' | 'EXTENDED' | 'POLYGAMOUS' | 'SINGLE_PARENT' | 'BLENDED' | 'COMPLEX' | 'UNKNOWN';
  houseCount: number;
  isS40Compliant: boolean;
  polygamyStatus: 'MONOGAMOUS' | 'POLYGAMOUS' | 'POTENTIALLY_POLYGAMOUS';
}

export interface RecentEvent {
  eventId: string;
  date: string; // ISO Date
  description: string;
  actorName: string;
  type: string;
}

export interface Completeness {
  score: number;
  missingFieldsCount: number;
  nextRecommendedAction?: {
    title: string;
    route: string;
    reason: string;
  };
}

export interface FamilyDetailsResponse {
  familyId: string;
  name: string;
  description?: string;
  county: string;
  clanName?: string;
  totem?: string;
  stats: FamilyStats;
  structure: FamilyStructure;
  recentEvents: RecentEvent[];
  completeness: Completeness;
}

// --- Response: FamilyMemberDto ---
export interface ParentLink {
  id: string;
  name: string;
  relationshipType: 'BIOLOGICAL' | 'ADOPTIVE' | 'FOSTER' | 'STEP';
  isAlive: boolean;
}

export interface SpouseLink {
  id: string;
  name: string;
  marriageType: string;
  status: string; // MARRIED, DIVORCED, WIDOWED
  dateOfMarriage?: string;
}

export interface ChildLink {
  id: string;
  name: string;
  gender: Gender;
  age?: number;
}

export interface SiblingLink {
  id: string;
  name: string;
  type: 'FULL' | 'HALF' | 'STEP';
}

export interface FamilyMemberResponse {
  id: string;
  familyId: string;
  identity: {
    fullName: string;
    officialName: string;
    first: string;
    last: string;
    gender: Gender;
    dateOfBirth?: string;
    age?: number;
    nationalId?: string;
  };
  vitalStatus: {
    isAlive: boolean;
    dateOfDeath?: string;
    isMissing: boolean;
  };
  context: {
    tribe?: string;
    clan?: string;
    homeCounty?: string;
    placeOfBirth?: string;
  };
  verification: {
    isVerified: boolean;
    status: string;
    method?: string;
    confidenceScore?: number;
  };
  kinship: {
    parents: ParentLink[];
    spouses: SpouseLink[];
    children: ChildLink[];
    siblings: SiblingLink[];
  };
  polygamyContext: {
    isPolygamousFamily: boolean;
    belongsToHouseId?: string;
    belongsToHouseName?: string;
    isHouseHead: boolean;
  };
  legalStatus: {
    isMinor: boolean;
    isAdult: boolean;
    hasGuardian: boolean;
    qualifiesForS29: boolean;
    inheritanceEligibility: 'FULL' | 'LIMITED' | 'NONE' | 'PENDING_VERIFICATION';
  };
}

// --- Response: FamilyTreeDto (Graph) ---
export interface GraphNodeData {
  fullName: string;
  gender: Gender;
  dateOfBirth?: string;
  isAlive: boolean;
  isHeadOfFamily: boolean;
  isVerified: boolean;
  hasMissingData: boolean;
  photoUrl?: string;
  houseId?: string;
  houseColor?: string;
}

export interface GraphNode {
  id: string;
  type: 'MEMBER' | 'GHOST';
  data: GraphNodeData;
  generationLevel?: number;
}

export interface GraphEdgeData {
  isBiological: boolean;
  isLegal: boolean;
  isVerified: boolean;
  label?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'PARENT_CHILD' | 'SPOUSE' | 'SIBLING' | 'COHABITATION';
  data: GraphEdgeData;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    animated?: boolean;
  };
}

export interface FamilyTreeResponse {
  familyId: string;
  stats: {
    nodesCount: number;
    edgesCount: number;
    generations: number;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// --- Response: PolygamyStatusDto ---
export interface HouseMember {
  memberId: string;
  name: string;
  relationshipToHead: 'CHILD' | 'SPOUSE' | 'GRANDCHILD' | 'OTHER';
  age?: number;
  isMinor: boolean;
  isStudent: boolean;
  hasDisability: boolean;
  isEligibleBeneficiary: boolean;
}

export interface HouseGroup {
  houseId: string;
  houseName: string;
  order: number;
  theoreticalSharePercentage: number;
  headOfHouse: {
    memberId: string;
    name: string;
    isAlive: boolean;
    marriageStatus: string;
  };
  members: HouseMember[];
  memberCount: number;
  minorCount: number;
}

export interface PolygamyStatusResponse {
  familyId: string;
  isPolygamous: boolean;
  distributionMethod: 'PER_STIRPES' | 'PER_CAPITA';
  totalHouses: number;
  houses: HouseGroup[];
  unassignedMembers: HouseMember[];
  hasUnassignedRisks: boolean;
}

// --- Response: SuccessionAnalysisDto ---
export interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionLink?: string;
}

export interface SuccessionAnalysisResponse {
  familyId: string;
  generatedAt: string;
  overallScore: number;
  readinessLevel: 'NOT_READY' | 'PARTIAL' | 'READY_TO_FILE';
  dependencyAnalysis: {
    status: 'PASS' | 'WARNING' | 'FAIL';
    potentialClaimantsCount: number;
    claimantNames: string[];
    issues: string[];
  };
  polygamyAnalysis: {
    isPolygamous: boolean;
    status: 'NOT_APPLICABLE' | 'PASS' | 'FAIL';
    definedHouses: number;
    issues: string[];
  };
  dataIntegrity: {
    verifiedMembersPercentage: number;
    missingCriticalDocuments: string[];
  };
  recommendations: Recommendation[];
}

// ============================================================================
// 4. INFERRED INPUT TYPES
// ============================================================================
export type CreateFamilyInput = z.infer<typeof CreateFamilyRequestSchema>;
export type AddFamilyMemberInput = z.infer<typeof AddFamilyMemberRequestSchema>;
export type EstablishPolygamousHouseInput = z.infer<typeof EstablishPolygamousHouseRequestSchema>;
export type RegisterMarriageInput = z.infer<typeof RegisterMarriageRequestSchema>;
export type DefineRelationshipInput = z.infer<typeof DefineRelationshipRequestSchema>;
export type RecordAdoptionInput = z.infer<typeof RecordAdoptionRequestSchema>;
export type RecordCohabitationInput = z.infer<typeof RecordCohabitationRequestSchema>;
export type VerifyMemberIdentityInput = z.infer<typeof VerifyMemberIdentityRequestSchema>;
export type ArchiveFamilyInput = z.infer<typeof ArchiveFamilyRequestSchema>;