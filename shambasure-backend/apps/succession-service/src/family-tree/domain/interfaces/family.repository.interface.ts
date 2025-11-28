import { Family } from '../entities/family.entity';

export interface FamilyRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(family: Family): Promise<void>;
  findById(id: string): Promise<Family | null>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Domain Lookups
  // ---------------------------------------------------------
  findByOwnerId(ownerId: string): Promise<Family[]>;
  findByName(ownerId: string, name: string): Promise<Family | null>;

  // ---------------------------------------------------------
  // Kenyan Family Law Specific Queries
  // ---------------------------------------------------------
  /**
   * Find families with customary marriages (for polygamy succession rules)
   */
  findFamiliesWithCustomaryMarriages(): Promise<Family[]>;

  /**
   * Find families with polygamous marriages
   */
  findFamiliesWithPolygamousMarriages(): Promise<Family[]>;

  /**
   * Find families with minors (for guardianship oversight)
   */
  findFamiliesWithMinors(): Promise<Family[]>;

  /**
   * Find families by clan/sub-clan (traditional Kenyan family tracing)
   */
  findByClan(clanName: string, subClan?: string): Promise<Family[]>;

  // ---------------------------------------------------------
  // Analytics & Reporting
  // ---------------------------------------------------------
  getFamilyStatistics(familyId: string): Promise<{
    totalMembers: number;
    livingMembers: number;
    deceasedMembers: number;
    minorCount: number;
    marriageCount: number;
    customaryMarriageCount: number;
  }>;

  /**
   * Count families by owner for usage limits
   */
  countByOwner(ownerId: string): Promise<number>;
}
