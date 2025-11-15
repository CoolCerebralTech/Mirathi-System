/**
 * API Contract Type Definitions
 * High-integrity, real-world DTOs for entire Succession System API
 */

import {
  WillStatus,
  AssetType,
  AssetOwnershipType,
  BequestType,
  BequestConditionType,
  RelationshipType,
  Gender,
  DistributionStatus,
  WitnessStatus,
} from './succession.types';

import {
  MarriageType,
  ProbateCaseType,
  IntestateScenarioType,
  GrantType,
  KenyanCounty,
  ExecutorStatus,
} from './kenyan-law.types';

/* ============================================================================
   GENERIC API RESPONSE TYPES
============================================================================ */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
  timestamp: string;
  path: string;
  version?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
  target?: string;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta: Required<ApiMeta>;
}

/* ============================================================================
   PAGINATION / FILTERS / SEARCH
============================================================================ */

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: unknown;
}

export interface SearchParams extends PaginationParams {
  q?: string;
  filters?: FilterParams;
}

/* ============================================================================
   WILL REQUEST TYPES
============================================================================ */

export interface WillCreateRequest {
  title: string;
  testatorId: string;
  specialInstructions?: string;
  funeralWishes?: string;
  digitalAssetInstructions?: string;
}

export interface WillUpdateRequest {
  title?: string;
  specialInstructions?: string;
  funeralWishes?: string;
  digitalAssetInstructions?: string;
  status?: WillStatus;
}

/* ============================================================================
   ASSET REQUEST TYPES
============================================================================ */

export interface AssetCreateRequest {
  name: string;
  type: AssetType;
  description?: string;
  ownershipType: AssetOwnershipType;
  estimatedValue: number;
  currency?: 'KES' | 'USD';
  location?: AssetLocationRequest;
  identification?: AssetIdentificationRequest;
}

export interface AssetLocationRequest {
  county: KenyanCounty;
  subCounty?: string;
  ward?: string;
  parcelNumber?: string;
  coordinates?: GeoCoordinatesRequest;
}

export interface GeoCoordinatesRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AssetIdentificationRequest {
  registrationNumber?: string;
  serialNumber?: string;
  titleDeedNumber?: string;
  accountNumber?: string;
  otherIdentifiers?: Record<string, string>;
}

/* ============================================================================
   BENEFICIARIES & BEQUESTS
============================================================================ */

export interface BeneficiaryAssignmentRequest {
  beneficiaryId?: string;
  familyMemberId?: string;
  externalBeneficiary?: ExternalBeneficiaryRequest;
  bequestType: BequestType;
  sharePercentage?: number;
  specificAmount?: number;
  conditions?: ConditionRequest[];
}

export interface ExternalBeneficiaryRequest {
  fullName: string;
  email?: string;
  phone?: string;
  relationship: RelationshipType;
  address?: AddressRequest;
}

export interface ConditionRequest {
  type: BequestConditionType;
  details: string;
  alternateBeneficiaryId?: string;
}

/* ============================================================================
   ADDRESS & CONTACT TYPES
============================================================================ */

export interface AddressRequest {
  street: string;
  city: string;
  county: KenyanCounty;
  postalCode: string;
  country?: string;
}

export interface ContactInfoRequest {
  phone: string;
  email: string;
  address: AddressRequest;
}

/* ============================================================================
   EXECUTORS
============================================================================ */

export interface ExecutorNominationRequest {
  executorId?: string;
  externalExecutor?: ExternalExecutorRequest;
  isPrimary: boolean;
  orderOfPriority: number;
  compensation?: CompensationRequest;
}

export interface ExternalExecutorRequest {
  fullName: string;
  email?: string;
  phone?: string;
  relationship: RelationshipType;
  address?: AddressRequest;
}

export interface CompensationRequest {
  isCompensated: boolean;
  amount?: number;
  percentage?: number;
}

/* ============================================================================
   WITNESSES
============================================================================ */

export interface WitnessAdditionRequest {
  witnessId?: string;
  externalWitness?: ExternalWitnessRequest;
}

export interface ExternalWitnessRequest {
  fullName: string;
  email?: string;
  phone?: string;
  idNumber: string;
  relationship: RelationshipType;
  address: AddressRequest;
}

/* ============================================================================
   FAMILY + RELATIONSHIPS
============================================================================ */

export interface FamilyCreateRequest {
  name: string;
  description?: string;
  privacy?: FamilyPrivacyRequest;
}

export interface FamilyPrivacyRequest {
  level: 'PRIVATE' | 'SHARED' | 'PUBLIC';
  sharedWith?: string[];
}

export interface FamilyMemberAddRequest {
  userId?: string;
  externalMember?: ExternalMemberRequest;
  relationship: RelationshipType;
  relationshipTo: string;
  isMinor?: boolean;
  notes?: string;
}

export interface ExternalMemberRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
}

/* ============================================================================
   MARRIAGE
============================================================================ */

export interface MarriageCreateRequest {
  spouse1Id: string;
  spouse2Id: string;
  marriageType: MarriageType;
  marriageDate: string;
  certificateNumber?: string;
  customaryDetails?: CustomaryMarriageRequest;
}

export interface CustomaryMarriageRequest {
  community: string;
  traditions: string[];
  bridePrice?: BridePriceRequest;
  elderApproval: boolean;
}

export interface BridePriceRequest {
  paid: boolean;
  amount?: number;
  items?: string[];
}

/* ============================================================================
   PROBATE / COURT / DOCUMENTATION
============================================================================ */

export interface ProbateApplicationRequest {
  deceasedId: string;
  caseType: ProbateCaseType;
  applicants: ApplicantRequest[];
  documents: DocumentReference[];
  estateValue: number;
  grantType?: GrantType;
}

export interface ApplicantRequest {
  applicantId: string;
  relationship: RelationshipType;
  contact: ContactInfoRequest;
}

export interface DocumentReference {
  documentId: string;
  type: string;
  required: boolean;
}

/* ============================================================================
   CORE RESPONSE TYPES
============================================================================ */

export interface WillResponse {
  id: string;
  title: string;
  status: WillStatus;
  testator: TestatorResponse;
  willDate: string;
  lastModified: string;
  version: number;

  assets: AssetSummaryResponse[];
  beneficiaries: BeneficiarySummaryResponse[];
  executors: ExecutorSummaryResponse[];
  witnesses: WitnessSummaryResponse[];

  specialInstructions?: string;
  funeralWishes?: string;
  digitalAssetInstructions?: string;

  compliance: ComplianceResponse;
}

export interface TestatorResponse {
  id: string;
  fullName: string;
  dateOfBirth: string;
  dateOfDeath?: string;
  address: AddressResponse;
  identification: IdentificationResponse;
}

export interface AddressResponse {
  street: string;
  city: string;
  county: KenyanCounty;
  postalCode: string;
  country: string;
}

export interface IdentificationResponse {
  type: string;
  number: string;
  issueDate?: string;
  expiryDate?: string;
  verified: boolean;
}

export interface AssetSummaryResponse {
  id: string;
  name: string;
  type: AssetType;
  estimatedValue: number;
  currency: string;
  ownershipType: AssetOwnershipType;
  isVerified: boolean;
}

export interface BeneficiarySummaryResponse {
  id: string;
  name: string;
  relationship: RelationshipType;
  bequestType: BequestType;
  sharePercentage?: number;
  specificAmount?: number;
  distributionStatus: DistributionStatus;
}

export interface ExecutorSummaryResponse {
  id: string;
  name: string;
  relationship: RelationshipType;
  isPrimary: boolean;
  status: ExecutorStatus;
}

export interface WitnessSummaryResponse {
  id: string;
  name: string;
  relationship: RelationshipType;
  status: WitnessStatus;
  signed: boolean;
}

/* ============================================================================
   COMPLIANCE ENGINE RESPONSE
============================================================================ */

export interface ComplianceResponse {
  isCompliant: boolean;
  violations: string[];
  recommendations: string[];
  lawSections: string[];
}

/* ============================================================================
   FAMILY TREE
============================================================================ */

export interface FamilyTreeResponse {
  family: FamilySummaryResponse;
  tree: TreeStructureResponse;
  statistics: TreeStatisticsResponse;
}

export interface FamilySummaryResponse {
  id: string;
  name: string;
  memberCount: number;
  created: string;
  creator: string;
}

export interface TreeStructureResponse {
  nodes: TreeNodeResponse[];
  edges: TreeEdgeResponse[];
  rootId: string;
}

export interface TreeNodeResponse {
  id: string;
  label: string;
  type: string;
  data: TreeNodeDataResponse;
  position?: TreePositionResponse;
}

export interface TreeNodeDataResponse {
  relationship: RelationshipType;
  isDeceased: boolean;
  isMinor: boolean;
  dateOfBirth?: string;
  dateOfDeath?: string;
}

export interface TreePositionResponse {
  x: number;
  y: number;
  level: number;
}

export interface TreeEdgeResponse {
  from: string;
  to: string;
  type: string;
  label?: string;
}

export interface TreeStatisticsResponse {
  totalMembers: number;
  livingMembers: number;
  deceasedMembers: number;
  minorMembers: number;
  generations: number;
  marriages: number;
}

/* ============================================================================
   ANALYSIS ENGINE
============================================================================ */

export interface SuccessionAnalysisResponse {
  familyId: string;
  analysisDate: string;
  dependants: DependantAnalysisResponse;
  succession: SuccessionAnalysisSummary;
  risks: RiskAnalysisResponse;
  recommendations: RecommendationResponse[];
}

export interface DependantAnalysisResponse {
  totalDependants: number;
  minorDependants: number;
  adultDependants: number;
  dependantCategories: DependantCategoryResponse[];
}

export interface DependantCategoryResponse {
  category: RelationshipType;
  count: number;
  provisionRequired: boolean;
}

export interface SuccessionAnalysisSummary {
  intestateScenario: IntestateScenarioResponse;
  testateScenario: TestateScenarioResponse;
  recommendation: string;
}

export interface IntestateScenarioResponse {
  applicable: boolean;
  scenarioType?: IntestateScenarioType;
  distribution: IntestateDistributionResponse;
  issues: string[];
}

export interface IntestateDistributionResponse {
  spouseShare: DistributionShareResponse;
  childrenShare: DistributionShareResponse;
  totalEstate: number;
}

export interface DistributionShareResponse {
  shareType: string;
  percentage: number;
  amount: number;
}

export interface TestateScenarioResponse {
  applicable: boolean;
  willExists: boolean;
  coverage: number;
  issues: string[];
}

export interface RiskAnalysisResponse {
  financialRisks: RiskItemResponse[];
  legalRisks: RiskItemResponse[];
  familyRisks: RiskItemResponse[];
  overallRisk: string;
}

export interface RiskItemResponse {
  type: string;
  severity: string;
  probability: string;
  impact: string;
}

export interface RecommendationResponse {
  category: string;
  priority: string;
  description: string;
  action: string;
  timeline: string;
}

/* ============================================================================
   BULK OPERATIONS
============================================================================ */

export interface ValidationErrorResponse {
  field: string;
  message: string;
  code: string;
  details?: unknown;
}

export interface BulkOperationResponse {
  total: number;
  successful: number;
  failed: number;
  errors: BulkOperationError[];
}

export interface BulkOperationError {
  item: unknown;
  error: ApiError;
}

/* ============================================================================
   FILE UPLOADS
============================================================================ */

export interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

/* ============================================================================
   TYPE GUARDS
============================================================================ */

export const isApiResponse = (response: unknown): response is ApiResponse => {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const r = response as Record<string, unknown>;
  return (
    typeof r.success === 'boolean' && typeof r.timestamp === 'string' && typeof r.path === 'string'
  );
};

export const isPaginatedResponse = (response: unknown): response is PaginatedResponse => {
  if (!isApiResponse(response)) {
    return false;
  }

  const r = response as ApiResponse & { meta?: unknown; data?: unknown };

  if (!Array.isArray(r.data) || typeof r.meta !== 'object' || r.meta === null) {
    return false;
  }

  const meta = r.meta as Record<string, unknown>;
  return (
    typeof meta.total === 'number' &&
    typeof meta.page === 'number' &&
    typeof meta.limit === 'number' &&
    typeof meta.pages === 'number' &&
    typeof meta.hasNext === 'boolean' &&
    typeof meta.hasPrev === 'boolean'
  );
};
