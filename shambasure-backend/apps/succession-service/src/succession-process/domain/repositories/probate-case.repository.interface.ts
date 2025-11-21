// succession-service/src/succession-process/domain/repositories/probate-case.repository.interface.ts

import { ProbateCase, CaseStatus } from '../entities/probate-case.entity';

export interface ProbateCaseRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(probateCase: ProbateCase): Promise<void>;
  findById(id: string): Promise<ProbateCase | null>;

  // ---------------------------------------------------------
  // Domain Lookups
  // ---------------------------------------------------------
  /**
   * Find the active court case for a specific Estate.
   */
  findByEstateId(estateId: string): Promise<ProbateCase | null>;

  /**
   * Find by the official Judiciary Case Number (e.g. "E123 of 2025").
   * Critical for E-Filing integration.
   */
  findByCaseNumber(caseNumber: string): Promise<ProbateCase | null>;

  /**
   * Find cases in a specific state (e.g. "OBJECTION_PERIOD" to check for expiry).
   */
  findByStatus(status: CaseStatus): Promise<ProbateCase[]>;

  /**
   * Find cases where the Gazette Notice objection period has expired
   * but haven't moved to "GRANT_ISSUED" yet.
   */
  findReadyForGrantIssue(): Promise<ProbateCase[]>;
}
