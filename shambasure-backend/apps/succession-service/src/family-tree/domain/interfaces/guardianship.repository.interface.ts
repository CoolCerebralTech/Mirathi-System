import { Guardianship } from '../entities/guardianship.entity';

export interface GuardianshipRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(guardianship: Guardianship): Promise<void>;
  findById(id: string): Promise<Guardianship | null>;
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Domain Lookups
  // ---------------------------------------------------------
  findByWardId(wardId: string): Promise<Guardianship[]>;
  findByGuardianId(guardianId: string): Promise<Guardianship[]>;
  findActiveByFamilyId(familyId: string): Promise<Guardianship[]>;

  // ---------------------------------------------------------
  // Kenyan Legal Guardianship Specific Queries
  // ---------------------------------------------------------
  /**
   * Find expiring guardianships (for court review notifications)
   */
  findExpiringGuardianships(daysThreshold: number): Promise<Guardianship[]>;

  /**
   * Find guardianships by court order number
   */
  findByCourtOrder(courtOrderNumber: string): Promise<Guardianship | null>;

  /**
   * Find testamentary guardianships (appointed by will)
   */
  findTestamentaryGuardianships(familyId: string): Promise<Guardianship[]>;

  /**
   * Find temporary guardianships requiring review
   */
  findTemporaryGuardianshipsRequiringReview(): Promise<Guardianship[]>;

  // ---------------------------------------------------------
  // Validation & Compliance
  // ---------------------------------------------------------
  /**
   * Check if member is already a guardian (for capacity validation)
   */
  isMemberGuardian(memberId: string): Promise<boolean>;

  /**
   * Count active guardianships for a guardian (for capacity limits)
   */
  countActiveByGuardian(guardianId: string): Promise<number>;

  /**
   * Find guardianships that need compliance reporting
   */
  findGuardianshipsRequiringReporting(): Promise<Guardianship[]>;

  // ---------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------
  getGuardianshipStatistics(familyId: string): Promise<{
    total: number;
    active: number;
    testamentary: number;
    courtOrdered: number;
    expiringSoon: number;
  }>;
}
