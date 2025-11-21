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
  /**
   * Find all marriages associated with a specific family tree.
   */
  findByFamilyId(familyId: string): Promise<Marriage[]>;

  /**
   * Find any marriage involving a specific person.
   * Includes active and dissolved.
   */
  findByMemberId(memberId: string): Promise<Marriage[]>;

  /**
   * Find specific active marriage between two people.
   */
  findActiveBetween(spouse1Id: string, spouse2Id: string): Promise<Marriage | null>;

  /**
   * Find active marriages for validation (Polygamy checks).
   */
  findActiveMarriages(memberId: string): Promise<Marriage[]>;
}
