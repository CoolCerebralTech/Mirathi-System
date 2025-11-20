import { FamilyMember } from '../entities/family-member.entity';

export interface FamilyMemberRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(member: FamilyMember): Promise<void>;
  findById(id: string): Promise<FamilyMember | null>;
  delete(id: string): Promise<void>;

  /**
   * Optimized method to save multiple members (e.g. bulk import).
   */
  saveMany(members: FamilyMember[]): Promise<void>;

  // ---------------------------------------------------------
  // Graph Queries
  // ---------------------------------------------------------
  /**
   * Get all nodes for a specific tree.
   */
  findByFamilyId(familyId: string): Promise<FamilyMember[]>;

  /**
   * Find the specific member node linked to a registered System User.
   */
  findByUserId(userId: string): Promise<FamilyMember | null>;

  /**
   * Find members who are currently marked as Minors.
   */
  findMinors(familyId: string): Promise<FamilyMember[]>;

  /**
   * Find members marked as Deceased (for Succession triggering).
   */
  findDeceased(familyId: string): Promise<FamilyMember[]>;

  // ---------------------------------------------------------
  // Validation
  // ---------------------------------------------------------
  countByFamilyId(familyId: string): Promise<number>;
}
