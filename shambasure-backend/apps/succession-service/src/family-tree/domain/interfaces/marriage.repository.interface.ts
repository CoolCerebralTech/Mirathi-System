import { MarriageStatus } from '@prisma/client';

import { Marriage } from '../entities/marriage.entity';

export interface MarriageRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(marriage: Marriage): Promise<void>;
  findById(id: string): Promise<Marriage | null>;
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Domain Lookups
  // ---------------------------------------------------------
  findByFamilyId(familyId: string): Promise<Marriage[]>;

  /**
   * Find all marriages (active and dissolved) involving a member.
   */
  findByMemberId(memberId: string): Promise<Marriage[]>;

  /**
   * Check for existing marriage between two people.
   */
  findActiveBetween(spouse1Id: string, spouse2Id: string): Promise<Marriage | null>;

  /**
   * Find currently active marriages for a member.
   */
  findActiveMarriages(memberId: string): Promise<Marriage[]>;

  // ---------------------------------------------------------
  // Kenyan Marriage Law Specific Queries
  // ---------------------------------------------------------
  /**
   * Find customary marriages.
   * Critical for customary law succession rules.
   */
  findCustomaryMarriages(familyId: string): Promise<Marriage[]>;

  /**
   * Find marriages by certificate number.
   * Used for Civil/Christian marriage verification.
   */
  findByCertificateNumber(certificateNumber: string): Promise<Marriage | null>;

  /**
   * Find dissolved marriages.
   * Important for determining Ex-Spouse rights (if any).
   */
  findDissolvedMarriages(familyId: string): Promise<Marriage[]>;

  // ---------------------------------------------------------
  // Validation & Business Rules
  // ---------------------------------------------------------
  /**
   * Check if member can enter another marriage based on existing records.
   * Implementation checks if existing marriages are Monogamous (Civil/Christian).
   */
  canMemberMarry(memberId: string, proposedMarriageType: MarriageStatus): Promise<boolean>;

  // ---------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------
  getMarriageStatistics(familyId: string): Promise<{
    total: number;
    active: number;
    dissolved: number;
    customary: number;
    civil: number;
    averageDurationYears: number;
  }>;
}
