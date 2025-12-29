// src/succession-automation/src/domain/repositories/i-probate-application.repository.ts
import {
  ApplicationStatus,
  ProbateApplication,
  ProbateApplicationType,
} from '../aggregates/probate-application.aggregate';
import { ConsentStatus } from '../entities/family-consent.entity';
import { FormStatus } from '../entities/generated-form.entity';

/**
 * Probate Application Repository Interface
 *
 * PURPOSE: Define the contract for persisting and retrieving ProbateApplication aggregates
 *
 * IMPLEMENTATION NOTE:
 * Infrastructure layer (PrismaProbateRepository) will implement this.
 */
export const PROBATE_REPOSITORY = 'PROBATE_REPOSITORY';
export interface IProbateApplicationRepository {
  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Save a new application or update existing
   * IMPORTANT: Must persist all child entities (Forms, Consents) atomically
   */
  save(application: ProbateApplication): Promise<void>;

  /**
   * Find application by aggregate ID
   */
  findById(id: string): Promise<ProbateApplication | null>;

  /**
   * Find application by estate ID
   * BUSINESS RULE: One application per estate (active)
   */
  findByEstateId(estateId: string): Promise<ProbateApplication | null>;

  /**
   * Check if application exists for estate
   */
  existsByEstateId(estateId: string): Promise<boolean>;

  /**
   * Delete application (soft delete)
   */
  delete(id: string): Promise<void>;

  // ==================== QUERY BY STATUS ====================

  /**
   * Find all applications with a specific status
   * Use case: Dashboard showing "Ready to File" applications
   */
  findByStatus(status: ApplicationStatus): Promise<ProbateApplication[]>;

  /**
   * Find applications ready to file
   */
  findReadyToFile(): Promise<ProbateApplication[]>;

  /**
   * Find filed applications pending court review
   */
  findPendingCourtReview(): Promise<ProbateApplication[]>;

  /**
   * Find granted applications
   */
  findGranted(): Promise<ProbateApplication[]>;

  /**
   * Find rejected applications (need revision)
   */
  findRejected(): Promise<ProbateApplication[]>;

  // ==================== QUERY BY APPLICANT ====================

  /**
   * Find applications by applicant user ID
   */
  findByApplicant(userId: string): Promise<ProbateApplication[]>;

  /**
   * Count applications by applicant
   */
  countByApplicant(userId: string): Promise<number>;

  // ==================== QUERY BY COURT ====================

  /**
   * Find applications for a specific court
   * Use case: Court admin viewing their queue
   */
  findByCourtStation(courtStation: string): Promise<ProbateApplication[]>;

  /**
   * Find applications by application type
   */
  findByApplicationType(applicationType: ProbateApplicationType): Promise<ProbateApplication[]>;

  // ==================== CONSENT QUERIES ====================

  /**
   * Find applications with pending consents
   * Use case: Reminder system for follow-ups
   */
  findWithPendingConsents(): Promise<ProbateApplication[]>;

  /**
   * Find applications with declined consents
   * Use case: Dispute resolution queue
   */
  findWithDeclinedConsents(): Promise<ProbateApplication[]>;

  /**
   * Find applications with expired consent requests
   * Use case: Cron job to mark as expired
   */
  findWithExpiredConsents(date?: Date): Promise<ProbateApplication[]>;

  /**
   * Find applications by family member consent
   * Use case: "Show all cases where John Doe needs to consent"
   */
  findByFamilyMemberConsent(familyMemberId: string): Promise<ProbateApplication[]>;

  // ==================== FORM QUERIES ====================

  /**
   * Find applications with specific form type
   */
  findByFormType(formType: string): Promise<ProbateApplication[]>;

  /**
   * Find applications with pending form approvals
   */
  findWithPendingFormApprovals(): Promise<ProbateApplication[]>;

  /**
   * Find applications with all forms approved
   */
  findWithAllFormsApproved(): Promise<ProbateApplication[]>;

  // ==================== FILING & PAYMENT ====================

  /**
   * Find applications with unpaid filing fees
   */
  findWithUnpaidFilingFees(): Promise<ProbateApplication[]>;

  /**
   * Find applications filed in date range
   */
  findFiledBetween(startDate: Date, endDate: Date): Promise<ProbateApplication[]>;

  /**
   * Find applications by court case number
   */
  findByCourtCaseNumber(caseNumber: string): Promise<ProbateApplication | null>;

  /**
   * Find applications by grant number
   */
  findByGrantNumber(grantNumber: string): Promise<ProbateApplication | null>;

  // ==================== STATISTICS ====================

  /**
   * Count total applications
   */
  count(): Promise<number>;

  /**
   * Count applications by status
   */
  countByStatus(status: ApplicationStatus): Promise<number>;

  /**
   * Get average time to file (from creation to filed)
   */
  getAverageTimeToFile(): Promise<number>; // Days

  /**
   * Get success rate (granted / filed)
   */
  getSuccessRate(): Promise<number>; // Percentage

  /**
   * Get most common rejection reasons
   */
  getMostCommonRejections(limit: number): Promise<Array<{ reason: string; count: number }>>;

  /**
   * Get filing stats by month
   */
  getFilingStatsByMonth(year: number): Promise<
    Array<{
      month: number;
      filed: number;
      granted: number;
      rejected: number;
    }>
  >;

  // ==================== BATCH OPERATIONS ====================

  /**
   * Save multiple applications in a single transaction
   */
  saveAll(applications: ProbateApplication[]): Promise<void>;

  /**
   * Find applications by multiple estate IDs
   */
  findByEstateIds(estateIds: string[]): Promise<ProbateApplication[]>;

  /**
   * Update multiple applications' status
   */
  bulkUpdateStatus(applicationIds: string[], newStatus: ApplicationStatus): Promise<void>;

  // ==================== AUDIT & COMPLIANCE ====================

  /**
   * Get application history (all versions via event sourcing)
   */
  getHistory(applicationId: string): Promise<
    Array<{
      version: number;
      eventType: string;
      occurredAt: Date;
      payload: any;
    }>
  >;

  /**
   * Find applications modified by specific user
   */
  findByModifiedBy(userId: string): Promise<ProbateApplication[]>;

  /**
   * Get application snapshot at specific point in time
   */
  getSnapshotAt(applicationId: string, timestamp: Date): Promise<ProbateApplication | null>;

  // ==================== ADVANCED QUERIES ====================

  /**
   * Find applications with all requirements met
   * (All forms approved, all consents received, fee paid)
   */
  findReadyToFileAdvanced(): Promise<ProbateApplication[]>;

  /**
   * Find stale applications (not updated in X days)
   */
  findStaleApplications(staleDays: number): Promise<ProbateApplication[]>;

  /**
   * Find applications with specific form status
   */
  findByFormStatus(formStatus: FormStatus): Promise<ProbateApplication[]>;

  /**
   * Find applications with specific consent status
   */
  findByConsentStatus(consentStatus: ConsentStatus): Promise<ProbateApplication[]>;

  /**
   * Find applications awaiting court decision
   * (Filed + no response for X days)
   */
  findAwaitingCourtDecision(minDays: number): Promise<ProbateApplication[]>;

  // ==================== SUCCESSION CONTEXT QUERIES ====================

  /**
   * Find applications by succession regime
   */
  findBySuccessionRegime(regime: string): Promise<ProbateApplication[]>;

  /**
   * Find Islamic applications (Kadhi's Court)
   */
  findIslamicApplications(): Promise<ProbateApplication[]>;

  /**
   * Find polygamous estate applications (Section 40)
   */
  findPolygamousApplications(): Promise<ProbateApplication[]>;

  /**
   * Find applications involving minors
   */
  findApplicationsWithMinors(): Promise<ProbateApplication[]>;
}

/**
 * Query Options for Pagination & Sorting
 */
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Extended Repository Interface with Pagination Support
 */
export interface IProbateApplicationRepositoryPaginated extends IProbateApplicationRepository {
  /**
   * Find with pagination
   */
  findAll(options: QueryOptions): Promise<{
    items: ProbateApplication[];
    total: number;
    page: number;
    pages: number;
  }>;

  /**
   * Find by status with pagination
   */
  findByStatusPaginated(
    status: ApplicationStatus,
    options: QueryOptions,
  ): Promise<{
    items: ProbateApplication[];
    total: number;
    page: number;
    pages: number;
  }>;

  /**
   * Find by applicant with pagination
   */
  findByApplicantPaginated(
    userId: string,
    options: QueryOptions,
  ): Promise<{
    items: ProbateApplication[];
    total: number;
    page: number;
    pages: number;
  }>;
}

/**
 * Repository Factory (for testing/mocking)
 */
export interface IProbateApplicationRepositoryFactory {
  create(): IProbateApplicationRepository;
}
