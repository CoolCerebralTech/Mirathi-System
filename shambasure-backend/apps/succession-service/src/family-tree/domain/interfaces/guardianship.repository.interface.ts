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

  /**
   * Find active guardianships.
   * Note: Guardianship model does not have 'familyId' directly.
   * Implementation must likely query via Ward's familyId.
   */
  findActiveByFamilyId(familyId: string): Promise<Guardianship[]>;

  // ---------------------------------------------------------
  // Kenyan Legal Guardianship Specific Queries
  // ---------------------------------------------------------
  /**
   * Find expiring guardianships within threshold days.
   * Critical for Children's Court compliance reviews.
   */
  findExpiringGuardianships(daysThreshold: number): Promise<Guardianship[]>;

  /**
   * Find guardianships by court order number.
   * Used for Legal Guardianship verification.
   */
  findByCourtOrder(courtOrderNumber: string): Promise<Guardianship | null>;

  /**
   * Find testamentary guardianships (appointed by will).
   */
  findTestamentaryGuardianships(familyId: string): Promise<Guardianship[]>;

  /**
   * Find temporary guardianships requiring review.
   * Based on `reviewDate` field.
   */
  findTemporaryGuardianshipsRequiringReview(): Promise<Guardianship[]>;

  // ---------------------------------------------------------
  // Validation & Compliance
  // ---------------------------------------------------------
  /**
   * Check if member is already acting as a guardian.
   * Used to prevent overloading a single guardian.
   */
  isMemberGuardian(memberId: string): Promise<boolean>;

  /**
   * Count active guardianships for a guardian.
   */
  countActiveByGuardian(guardianId: string): Promise<number>;

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
