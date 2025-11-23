import { SuccessionCertificate, GrantStatus } from '../entities/succession-certificate.entity';
import { GrantType } from '@prisma/client';

export interface SuccessionCertificateRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<SuccessionCertificate | null>;
  findAll(): Promise<SuccessionCertificate[]>;
  save(certificate: SuccessionCertificate): Promise<SuccessionCertificate>;
  delete(id: string): Promise<void>;

  // Domain-specific queries
  findByEstateId(estateId: string): Promise<SuccessionCertificate | null>;
  findByApplicantId(applicantId: string): Promise<SuccessionCertificate[]>;
  findByStatus(status: GrantStatus): Promise<SuccessionCertificate[]>;
  findByGrantType(grantType: GrantType): Promise<SuccessionCertificate[]>;

  // Court-specific queries
  findByCourtStation(station: string): Promise<SuccessionCertificate[]>;
  findByGrantNumber(grantNumber: string): Promise<SuccessionCertificate | null>;
  findByCaseNumber(caseNumber: string): Promise<SuccessionCertificate | null>;

  // Status workflow queries
  findActiveCertificates(): Promise<SuccessionCertificate[]>;
  findConfirmedCertificates(): Promise<SuccessionCertificate[]>;
  findRevokedCertificates(): Promise<SuccessionCertificate[]>;
  findExpiredCertificates(): Promise<SuccessionCertificate[]>;

  // Timeline queries
  findByIssueDateRange(start: Date, end: Date): Promise<SuccessionCertificate[]>;
  findByConfirmationDateRange(start: Date, end: Date): Promise<SuccessionCertificate[]>;
  findCertificatesExpiringSoon(days: number): Promise<SuccessionCertificate[]>;

  // Complex queries
  findCertificatesWithConditions(): Promise<SuccessionCertificate[]>;
  findAmendedCertificates(): Promise<SuccessionCertificate[]>;
  findReplacedCertificates(): Promise<SuccessionCertificate[]>;
  findCertificatesRequiringRenewal(): Promise<SuccessionCertificate[]>;

  // Validation queries
  findValidCertificates(estateId: string): Promise<SuccessionCertificate[]>;
  existsActiveCertificateForEstate(estateId: string): Promise<boolean>;
  existsByGrantNumber(grantNumber: string): Promise<boolean>;

  // Statistical queries
  getCertificateStatistics(): Promise<{
    totalCertificates: number;
    byStatus: Record<GrantStatus, number>;
    byType: Record<GrantType, number>;
    activeCertificates: number;
    expiredCertificates: number;
    revokedCertificates: number;
  }>;

  // Bulk operations
  saveAll(certificates: SuccessionCertificate[]): Promise<SuccessionCertificate[]>;
  updateStatus(certificateIds: string[], status: GrantStatus): Promise<void>;
  markAsExpired(certificateIds: string[]): Promise<void>;

  // Search queries
  searchCertificates(query: string): Promise<SuccessionCertificate[]>;

  // Advanced queries
  findCertificatesForRenewal(): Promise<SuccessionCertificate[]>;
  findCertificatesWithUpcomingExpiry(days: number): Promise<SuccessionCertificate[]>;
  findCertificatesByIssuer(issuedBy: string): Promise<SuccessionCertificate[]>;
}
