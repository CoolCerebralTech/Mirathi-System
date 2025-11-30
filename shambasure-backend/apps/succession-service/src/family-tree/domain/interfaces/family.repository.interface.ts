import { Family } from '../entities/family.entity';

export interface FamilyRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(family: Family): Promise<void>;
  findById(id: string): Promise<Family | null>;
  delete(id: string): Promise<void>;

  // Aligning with 'deletedAt' schema field
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Domain Lookups
  // ---------------------------------------------------------
  /**
   * Find families created by a specific user.
   * Matches Prisma field 'creatorId'.
   */
  findByCreatorId(creatorId: string): Promise<Family[]>;

  findByName(creatorId: string, name: string): Promise<Family | null>;

  // ---------------------------------------------------------
  // Kenyan Family Law Specific Queries
  // ---------------------------------------------------------
  /**
   * Find families marked as having customary marriages.
   * Critical for applying Customary Law under Section 2 & 3(2).
   */
  findFamiliesWithCustomaryMarriages(): Promise<Family[]>;

  /**
   * Find families with polygamous structure.
   * Critical for Section 40 (Polygamous Intestate Succession).
   */
  findFamiliesWithPolygamousMarriages(): Promise<Family[]>;

  /**
   * Find families containing minors.
   * Critical for Section 35 (Continuing Trusts).
   */
  findFamiliesWithMinors(): Promise<Family[]>;

  /**
   * Find families by clan/sub-clan.
   * Used for traditional family tracing and customary disputes.
   */
  findByClan(clanName: string, subClan?: string): Promise<Family[]>;

  // ---------------------------------------------------------
  // Analytics & Reporting
  // ---------------------------------------------------------
  /**
   * Returns denormalized statistics stored on the Family entity.
   */
  getFamilyStatistics(familyId: string): Promise<{
    memberCount: number;
    livingMemberCount: number;
    minorCount: number;
    customaryMarriageCount: number;
    polygamousMarriageCount: number;
  }>;

  /**
   * Count families by creator for subscription usage limits.
   */
  countByCreator(creatorId: string): Promise<number>;
}
