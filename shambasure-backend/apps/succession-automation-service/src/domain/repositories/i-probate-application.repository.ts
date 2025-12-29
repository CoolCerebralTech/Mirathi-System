// src/succession-automation/src/domain/repositories/i-probate-application.repository.ts
import {
  ApplicationStatus,
  FilingPriority,
  ProbateApplication,
  ProbateApplicationType,
} from '../aggregates/probate-application.aggregate';
import { FamilyConsent } from '../entities/family-consent.entity';
import { GeneratedForm } from '../entities/generated-form.entity';

export const PROBATE_APPLICATION_REPOSITORY = 'PROBATE_APPLICATION_REPOSITORY';

/**
 * Standard Pagination Options
 */
export interface RepositoryQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Result Wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface IProbateApplicationRepository {
  // ==================== CORE CRUD ====================
  save(application: ProbateApplication): Promise<void>;
  findById(id: string): Promise<ProbateApplication | null>;
  findByEstateId(estateId: string): Promise<ProbateApplication | null>;
  findByReadinessAssessmentId(readinessAssessmentId: string): Promise<ProbateApplication | null>;
  delete(id: string): Promise<void>;

  // ==================== STATUS QUERIES ====================
  findByStatus(status: ApplicationStatus): Promise<ProbateApplication[]>;
  findByType(applicationType: ProbateApplicationType): Promise<ProbateApplication[]>;
  findByPriority(priority: FilingPriority): Promise<ProbateApplication[]>;

  // Specific Workflow States
  findReadyToFile(): Promise<ProbateApplication[]>;
  findFiled(): Promise<ProbateApplication[]>;
  findGranted(): Promise<ProbateApplication[]>;

  // Workflow Blockers (Aggregates needing attention)
  findWithPendingConsents(): Promise<ProbateApplication[]>;
  findWithPendingForms(): Promise<ProbateApplication[]>;

  // ==================== COURT QUERIES ====================
  findByCourtCaseNumber(courtCaseNumber: string): Promise<ProbateApplication | null>;
  findByCourtJurisdiction(jurisdiction: string): Promise<ProbateApplication[]>;
  findByCourtStation(station: string): Promise<ProbateApplication[]>;

  // ==================== APPLICANT QUERIES ====================
  findByApplicantUserId(userId: string): Promise<ProbateApplication[]>;

  // ==================== TIMELINE QUERIES ====================
  findApplicationsDueForReview(): Promise<ProbateApplication[]>;
  findApplicationsNeedingGazettePublication(): Promise<ProbateApplication[]>;
  findApplicationsWithExpiredObjectionDeadlines(): Promise<ProbateApplication[]>;
  findStaleApplications(staleDays: number): Promise<ProbateApplication[]>;

  // ==================== STATISTICS ====================
  count(): Promise<number>;
  countByStatus(status: ApplicationStatus): Promise<number>;
  countByType(applicationType: ProbateApplicationType): Promise<number>;
  getAverageProcessingDays(): Promise<number>;
  getGrantSuccessRate(): Promise<number>;

  // ==================== CHILD ENTITY QUERIES (Read Models) ====================
  // Note: While DDD repositories usually return Aggregates, these are useful for specific lookups

  /**
   * Find the specific form entity.
   * Ideally loads the Aggregate and extracts the entity.
   */
  findFormById(formId: string): Promise<GeneratedForm | null>;
  findFormsByApplicationId(applicationId: string): Promise<GeneratedForm[]>;

  /**
   * Find the specific consent entity.
   */
  findConsentById(consentId: string): Promise<FamilyConsent | null>;
  findConsentsByApplicationId(applicationId: string): Promise<FamilyConsent[]>;

  // ==================== ADVANCED / FILTERED QUERIES ====================

  findAllPaginated(options: RepositoryQueryOptions): Promise<PaginatedResult<ProbateApplication>>;

  findByStatusPaginated(
    status: ApplicationStatus,
    options: RepositoryQueryOptions,
  ): Promise<PaginatedResult<ProbateApplication>>;

  findApplicationsByRegime(regime: string): Promise<ProbateApplication[]>;
}
