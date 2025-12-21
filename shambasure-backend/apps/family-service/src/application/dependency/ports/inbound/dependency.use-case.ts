import { Result } from '../../../common/base/result';
import {
  AssessFinancialDependencyRequest,
  CreateDependencyAssessmentRequest,
  FileS26ClaimRequest,
  RecordCourtProvisionRequest,
} from '../../dto/request';
import {
  DependencyAssessmentResponse,
  DependencyStatistics,
  DependencyStatusResponse,
} from '../../dto/response';
import {
  CheckS29ComplianceQuery,
  GetDependencyByIdQuery,
  GetDependencyStatisticsQuery,
  ListDependenciesByDeceasedQuery,
  SearchDependenciesQuery,
} from '../../queries/impl';

/**
 * Inbound Port for the Dependency Management Module.
 * Defines the application capabilities for handling Dependants under the
 * Law of Succession Act (Cap 160), specifically Sections 26, 29, 35, and 40.
 */
export interface IDependencyUseCase {
  /**
   * Creates a new dependency assessment for a potential heir.
   * Enforces S.29 relationship categories (Priority vs. Conditional).
   *
   * @param request - The creation request containing deceased and dependant IDs
   * @returns Result containing the created assessment
   */
  createAssessment(
    request: CreateDependencyAssessmentRequest,
  ): Promise<Result<DependencyAssessmentResponse>>;

  /**
   * Assesses the degree of financial dependency for non-priority dependants (S.29(b)).
   * Calculates dependency ratios based on provided financial evidence.
   *
   * @param request - Financial data and ratio calculations
   * @returns Result containing the updated assessment
   */
  assessFinancialDependency(
    request: AssessFinancialDependencyRequest,
  ): Promise<Result<DependencyAssessmentResponse>>;

  /**
   * Files a claim under Section 26 for "reasonable provision" from the estate.
   * Used when a dependant feels inadequately provided for by will or intestacy rules.
   *
   * @param request - Claim details including amount, reason, and evidence
   * @returns Result containing the assessment with the filed claim
   */
  fileSection26Claim(request: FileS26ClaimRequest): Promise<Result<DependencyAssessmentResponse>>;

  /**
   * Records a formal Court Order regarding provision for a dependant.
   * Overrides manual assessments and updates the legal status of the dependant.
   *
   * @param request - Court order details (Order No, Amount, Date)
   * @returns Result containing the assessment with recorded court provision
   */
  recordCourtProvision(
    request: RecordCourtProvisionRequest,
  ): Promise<Result<DependencyAssessmentResponse>>;

  // --- Queries ---

  /**
   * Retrieves a single dependency assessment by its unique ID.
   *
   * @param query - Query parameters including ID and include flags
   * @returns Result containing the assessment details
   */
  getAssessmentById(query: GetDependencyByIdQuery): Promise<Result<DependencyAssessmentResponse>>;

  /**
   * Lists all dependants associated with a specific deceased person.
   * Supports filtering by status (S.29(a) vs S.29(b)), S.26 claim status, etc.
   *
   * @param query - Filter criteria and pagination options
   * @returns Result containing a list of assessments
   */
  listByDeceased(
    query: ListDependenciesByDeceasedQuery,
  ): Promise<Result<DependencyAssessmentResponse[]>>;

  /**
   * Performs a comprehensive compliance check against Section 29 of the LSA.
   * Generates a report detailing missing evidence, non-compliant dependants, and risks.
   *
   * @param query - Compliance check parameters
   * @returns Result containing a detailed status and compliance report
   */
  checkS29Compliance(query: CheckS29ComplianceQuery): Promise<Result<DependencyStatusResponse>>;

  /**
   * Generates statistical metrics for estate dependency analysis.
   * Useful for auditing large estates or court reporting.
   *
   * @param query - Statistics parameters (granularity, time period)
   * @returns Result containing the statistical data
   */
  getStatistics(query: GetDependencyStatisticsQuery): Promise<Result<DependencyStatistics>>;

  /**
   * Searches for dependencies across the system or for a specific estate.
   * Supports fuzzy matching on names and identifiers.
   *
   * @param query - Search term and scope options
   * @returns Result containing matching assessments
   */
  search(query: SearchDependenciesQuery): Promise<Result<DependencyAssessmentResponse[]>>;
}
