// succession-service/src/succession-process/domain/repositories/succession-certificate.repository.interface.ts

import { SuccessionCertificate } from '../entities/succession-certificate.entity';

export interface SuccessionCertificateRepositoryInterface {
  save(certificate: SuccessionCertificate): Promise<void>;
  findById(id: string): Promise<SuccessionCertificate | null>;

  /**
   * Find the active grant for an estate.
   */
  findByEstateId(estateId: string): Promise<SuccessionCertificate | null>;

  /**
   * Find grants issued to a specific person (Executor History).
   */
  findByApplicantId(applicantId: string): Promise<SuccessionCertificate[]>;

  /**
   * Find grants that were issued > 6 months ago but not yet Confirmed.
   * Used to send reminders for Section 71 compliance.
   */
  findPendingConfirmation(monthsElapsed: number): Promise<SuccessionCertificate[]>;
}
