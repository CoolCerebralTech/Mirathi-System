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
  findByMemberId(memberId: string): Promise<Marriage[]>;
  findActiveBetween(spouse1Id: string, spouse2Id: string): Promise<Marriage | null>;
  findActiveMarriages(memberId: string): Promise<Marriage[]>;

  // ---------------------------------------------------------
  // Kenyan Marriage Law Specific Queries
  // ---------------------------------------------------------
  /**
   * Find customary marriages for traditional succession rules
   */
  findCustomaryMarriages(familyId: string): Promise<Marriage[]>;

  /**
   * Find polygamous marriages for complex succession calculations
   */
  findPolygamousMarriages(familyId: string): Promise<Marriage[]>;

  /**
   * Find marriages by certificate number for legal verification
   */
  findByCertificateNumber(certificateNumber: string): Promise<Marriage | null>;

  /**
   * Find dissolved marriages that may affect inheritance
   */
  findDissolvedMarriages(familyId: string): Promise<Marriage[]>;

  /**
   * Find marriages within date range for legal reporting
   */
  findByMarriageDateRange(startDate: Date, endDate: Date, familyId?: string): Promise<Marriage[]>;

  // ---------------------------------------------------------
  // Validation & Business Rules
  // ---------------------------------------------------------
  /**
   * Check if member can enter another marriage (polygamy rules)
   */
  canMemberMarry(
    memberId: string,
    proposedMarriageType: MarriageStatus,
  ): Promise<{
    canMarry: boolean;
    reason?: string;
    existingMarriages: Marriage[];
  }>;

  /**
   * Validate marriage eligibility under Kenyan law
   */
  validateMarriageEligibility(
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageStatus,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  // ---------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------
  getMarriageStatistics(familyId: string): Promise<{
    total: number;
    active: number;
    dissolved: number;
    customary: number;
    civil: number;
    averageDuration: number;
  }>;
}
