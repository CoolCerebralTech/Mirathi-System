// application/dependency/ports/inbound/dependency.use-case.ts
import { AssessFinancialDependencyRequest } from '../../dto/request/assess-financial-dependency.request';
import { CreateDependencyAssessmentRequest } from '../../dto/request/create-dependency-assessment.request';
import { FileS26ClaimRequest } from '../../dto/request/file-s26-claim.request';
import { RecordCourtProvisionRequest } from '../../dto/request/record-court-provision.request';
import { DependencyAssessmentResponse } from '../../dto/response/dependency-assessment.response';
import { DependencyStatusResponse } from '../../dto/response/dependency-status.response';

export interface CommandMetadata {
  userId: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
  courtId?: string;
}

export interface QueryMetadata {
  userId: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ApplicationResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
  warnings?: string[];
  requestId?: string;
  timestamp: string;
  executionTimeMs?: number;
}

export interface PaginatedApplicationResponse<T> extends ApplicationResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Dependency Use Case Interface
 *
 * Defines the operations that can be performed in the Dependency bounded context.
 * This is the inbound port that adapters (controllers, event handlers) will call.
 */
export interface IDependencyUseCase {
  // --- Command Operations ---

  /**
   * Create a new dependency assessment
   */
  createDependencyAssessment(
    request: CreateDependencyAssessmentRequest,
    metadata: CommandMetadata,
    correlationId?: string,
  ): Promise<ApplicationResponse<DependencyAssessmentResponse>>;

  /**
   * Assess financial dependency for an existing assessment
   */
  assessFinancialDependency(
    request: AssessFinancialDependencyRequest,
    metadata: CommandMetadata,
    correlationId?: string,
  ): Promise<ApplicationResponse<DependencyAssessmentResponse>>;

  /**
   * File an S.26 claim for a dependant
   */
  fileS26Claim(
    request: FileS26ClaimRequest,
    metadata: CommandMetadata,
    correlationId?: string,
  ): Promise<ApplicationResponse<DependencyAssessmentResponse>>;

  /**
   * Record a court provision order
   */
  recordCourtProvision(
    request: RecordCourtProvisionRequest,
    metadata: CommandMetadata,
    correlationId?: string,
  ): Promise<ApplicationResponse<DependencyAssessmentResponse>>;

  // --- Query Operations ---

  /**
   * Get a dependency assessment by ID
   */
  getDependencyById(
    dependencyId: string,
    options?: {
      includeDeceasedDetails?: boolean;
      includeDependantDetails?: boolean;
      includeEvidenceDocuments?: boolean;
      includeCourtOrderDetails?: boolean;
      includeAuditHistory?: boolean;
    },
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<ApplicationResponse<DependencyAssessmentResponse>>;

  /**
   * List dependencies for a deceased person
   */
  listDependenciesByDeceased(
    deceasedId: string,
    options?: {
      status?: string;
      basis?: string;
      dependencyLevel?: string;
      isMinor?: boolean;
      isStudent?: boolean;
      hasDisability?: boolean;
      hasCourtOrder?: boolean;
      isClaimant?: boolean;
      minDependencyPercentage?: number;
      maxDependencyPercentage?: number;
      minClaimAmount?: number;
      maxClaimAmount?: number;
      createdAfter?: string;
      createdBefore?: string;
      updatedAfter?: string;
      updatedBefore?: string;
      courtOrderAfter?: string;
      courtOrderBefore?: string;
      hasEvidence?: boolean;
      minEvidenceDocuments?: number;
      searchTerm?: string;
      includeDependantDetails?: boolean;
      includeCourtOrderDetails?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortDirection?: 'ASC' | 'DESC';
    },
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<PaginatedApplicationResponse<DependencyAssessmentResponse>>;

  /**
   * Check S.29 compliance for a deceased's dependants
   */
  checkS29Compliance(
    deceasedId: string,
    options?: {
      checkLevel?: string;
      reportFormat?: string;
      includeRecommendations?: boolean;
      includeLegalCitations?: boolean;
      includeCaseStudies?: boolean;
      calculateDistribution?: boolean;
      validateAgainstEstateValue?: boolean;
      estateValue?: number;
      jurisdiction?: string;
      asOfDate?: string;
    },
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<ApplicationResponse<any>>;

  /**
   * Get dependency statistics for a deceased person
   */
  getDependencyStatistics(
    deceasedId: string,
    options?: {
      granularity?: string;
      timePeriod?: string;
      startDate?: string;
      endDate?: string;
      includeTrends?: boolean;
      includeComparisons?: boolean;
      includeFinancialSummary?: boolean;
      includeLegalCompliance?: boolean;
      comparisonDeceasedId?: string;
      exportToCsv?: boolean;
      exportFormat?: string;
    },
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<ApplicationResponse<any>>;

  /**
   * Get overall dependency status for a deceased person
   */
  getDependencyStatus(
    deceasedId: string,
    includeDependants?: boolean,
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<ApplicationResponse<DependencyStatusResponse>>;

  // --- Bulk Operations ---

  /**
   * Batch create dependency assessments
   */
  batchCreateDependencyAssessments(
    requests: CreateDependencyAssessmentRequest[],
    metadata: CommandMetadata,
    correlationId?: string,
  ): Promise<ApplicationResponse<{ success: number; failed: number; results: any[] }>>;

  /**
   * Batch update dependency levels
   */
  batchUpdateDependencyLevels(
    deceasedId: string,
    dependantIds: string[],
    dependencyLevel: string,
    metadata: CommandMetadata,
    correlationId?: string,
  ): Promise<ApplicationResponse<{ updated: number }>>;

  // --- Utility Operations ---

  /**
   * Validate dependency assessment data
   */
  validateDependencyAssessment(
    request: CreateDependencyAssessmentRequest,
    metadata?: QueryMetadata,
  ): Promise<ApplicationResponse<{ isValid: boolean; errors: string[]; warnings: string[] }>>;

  /**
   * Calculate suggested dependency percentage
   */
  calculateSuggestedDependency(
    deceasedId: string,
    dependantId: string,
    financialData: {
      monthlyNeeds: number;
      monthlyContribution: number;
      totalDeceasedIncome: number;
    },
    metadata?: QueryMetadata,
  ): Promise<
    ApplicationResponse<{
      suggestedPercentage: number;
      suggestedLevel: string;
      explanation: string;
    }>
  >;

  /**
   * Generate dependency report
   */
  generateDependencyReport(
    deceasedId: string,
    reportType: string,
    options?: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<ApplicationResponse<any>>;
}
