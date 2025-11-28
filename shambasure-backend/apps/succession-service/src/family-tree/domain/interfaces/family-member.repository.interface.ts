import { FamilyMember } from '../entities/family-member.entity';

export interface FamilyMemberRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(member: FamilyMember): Promise<void>;
  findById(id: string): Promise<FamilyMember | null>;
  delete(id: string): Promise<void>;
  saveMany(members: FamilyMember[]): Promise<void>;

  // ---------------------------------------------------------
  // Graph Queries
  // ---------------------------------------------------------
  findByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findByUserId(userId: string): Promise<FamilyMember | null>;
  findMinors(familyId: string): Promise<FamilyMember[]>;
  findDeceased(familyId: string): Promise<FamilyMember[]>;
  countByFamilyId(familyId: string): Promise<number>;

  // ---------------------------------------------------------
  // Kenyan Succession Law Specific Queries
  // ---------------------------------------------------------
  /**
   * Find potential heirs for intestate succession calculations
   */
  findPotentialHeirs(familyId: string, excludeDeceasedId?: string): Promise<FamilyMember[]>;

  /**
   * Find dependants under Section 29 of Law of Succession Act
   */
  findDependants(familyId: string, deceasedMemberId: string): Promise<FamilyMember[]>;

  /**
   * Find family members by relationship type for succession analysis
   */
  findByRelationshipType(familyId: string, relationshipType: string): Promise<FamilyMember[]>;

  /**
   * Find family head/elders for decision-making processes
   */
  findFamilyHeads(familyId: string): Promise<FamilyMember[]>;

  /**
   * Find members with disabilities for dependency analysis
   */
  findMembersWithDisabilities(familyId: string): Promise<FamilyMember[]>;

  // ---------------------------------------------------------
  // Search & Identification
  // ---------------------------------------------------------
  /**
   * Find by national ID for legal identification
   */
  findByNationalId(nationalId: string): Promise<FamilyMember | null>;

  /**
   * Search members by name across families
   */
  searchByName(query: string, familyId?: string): Promise<FamilyMember[]>;

  /**
   * Find members by birth date range
   */
  findByBirthDateRange(startDate: Date, endDate: Date, familyId?: string): Promise<FamilyMember[]>;

  // ---------------------------------------------------------
  // Bulk Operations
  // ---------------------------------------------------------
  /**
   * Update multiple members in batch
   */
  updateMany(members: FamilyMember[]): Promise<void>;

  /**
   * Soft delete multiple members
   */
  softDeleteMany(memberIds: string[]): Promise<void>;
}
