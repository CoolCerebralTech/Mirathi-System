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
  /**
   * Find who is guarding a specific child.
   */
  findByWardId(wardId: string): Promise<Guardianship[]>;

  /**
   * Find all children guarded by a specific adult.
   */
  findByGuardianId(guardianId: string): Promise<Guardianship[]>;

  /**
   * Find active guardianships in a family (e.g. for dashboard alerts).
   */
  findActiveByFamilyId(familyId: string): Promise<Guardianship[]>;
}
