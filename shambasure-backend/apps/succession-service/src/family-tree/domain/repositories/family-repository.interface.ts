import { Family } from '../entities/family.entity';

export interface FamilyRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(family: Family): Promise<void>;
  findById(id: string): Promise<Family | null>;
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Domain Lookups
  // ---------------------------------------------------------
  /**
   * Find the family tree created/owned by a specific user.
   * Note: Currently assumes 1 Tree per User, but returns array for flexibility.
   */
  findByOwnerId(ownerId: string): Promise<Family[]>;

  /**
   * Find family by name (Search/Validation).
   */
  findByName(ownerId: string, name: string): Promise<Family | null>;
}
