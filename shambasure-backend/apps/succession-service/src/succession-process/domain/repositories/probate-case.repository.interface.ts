import { GrantType } from '@prisma/client';

import { CaseStatus, ProbateCase } from '../entities/probate-case.entity';

export interface ProbateCaseRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<ProbateCase | null>;
  findAll(): Promise<ProbateCase[]>;
  save(probateCase: ProbateCase): Promise<ProbateCase>;
  delete(id: string): Promise<void>;

  // Domain-specific queries
  findByEstateId(estateId: string): Promise<ProbateCase | null>;
  findByCaseNumber(caseNumber: string): Promise<ProbateCase | null>;
  findByStatus(status: CaseStatus): Promise<ProbateCase[]>;
  findByGrantType(grantType: GrantType): Promise<ProbateCase[]>;

  // Court-specific queries
  findByCourtStation(station: string): Promise<ProbateCase[]>;
  findByCourtCounty(county: string): Promise<ProbateCase[]>;
  findByJudge(judgeName: string): Promise<ProbateCase[]>;

  // Applicant queries
  findByApplicantId(applicantId: string): Promise<ProbateCase[]>;
  findByApplicantName(applicantName: string): Promise<ProbateCase[]>;

  // Timeline queries
  findByFilingDateRange(start: Date, end: Date): Promise<ProbateCase[]>;
  findRecentCases(days: number): Promise<ProbateCase[]>;
  findCasesDueForConfirmation(): Promise<ProbateCase[]>;

  // Status workflow queries
  findCasesInObjectionPeriod(): Promise<ProbateCase[]>;
  findCasesPendingGrant(): Promise<ProbateCase[]>;
  findCasesReadyForConfirmation(): Promise<ProbateCase[]>;
  findClosedCases(): Promise<ProbateCase[]>;

  // Complex queries
  findCasesWithObjections(): Promise<ProbateCase[]>;
  findCasesInMediation(): Promise<ProbateCase[]>;
  findCasesWithLegalRepresentation(): Promise<ProbateCase[]>;
  findComplexCases(): Promise<ProbateCase[]>;

  // Statistical queries
  getCaseStatistics(timeframe?: { start: Date; end: Date }): Promise<{
    totalCases: number;
    byStatus: Record<CaseStatus, number>;
    byGrantType: Record<GrantType, number>;
    byCourtStation: Record<string, number>;
    averageProcessingTime: number;
  }>;

  // Bulk operations
  saveAll(cases: ProbateCase[]): Promise<ProbateCase[]>;
  updateStatus(caseIds: string[], status: CaseStatus): Promise<void>;

  // Validation queries
  existsByEstateId(estateId: string): Promise<boolean>;
  existsByCaseNumber(caseNumber: string): Promise<boolean>;

  // Search queries
  searchCases(query: string): Promise<ProbateCase[]>;

  // Advanced queries
  findOverdueCases(): Promise<ProbateCase[]>;
  findCasesRequiringAction(): Promise<ProbateCase[]>;
  findCasesByPriority(priority: 'NORMAL' | 'URGENT' | 'EXPEDITED'): Promise<ProbateCase[]>;
}
