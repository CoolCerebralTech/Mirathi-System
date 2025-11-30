import { RelationshipType } from '@prisma/client';

import { FamilyMember } from '../entities/family-member.entity';

export interface FamilyMemberRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(member: FamilyMember): Promise<void>;
  saveMany(members: FamilyMember[]): Promise<void>;

  findById(id: string): Promise<FamilyMember | null>;
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Graph & Context Queries
  // ---------------------------------------------------------
  findByFamilyId(familyId: string): Promise<FamilyMember[]>;

  /**
   * Find a member linked to a specific system User.
   */
  findByUserId(userId: string): Promise<FamilyMember | null>;

  /**
   * Find all living minors in a family.
   * Critical for Appointment of Guardians (Section 35).
   */
  findMinors(familyId: string): Promise<FamilyMember[]>;

  /**
   * Find deceased members.
   * Used to initiate Probate or verify representation (per stirpes).
   */
  findDeceased(familyId: string): Promise<FamilyMember[]>;

  /**
   * Find all currently living members.
   * Essential for determining immediate heirs.
   */
  findLivingMembers(familyId: string): Promise<FamilyMember[]>;

  countByFamilyId(familyId: string): Promise<number>;

  // ---------------------------------------------------------
  // Kenyan Succession Law Specific Queries
  // ---------------------------------------------------------

  /**
   * Find dependants as defined in Section 29 of the Law of Succession Act.
   * (Spouse, Children, and Parents/others if maintained).
   * Note: Implementation likely involves complex filtering or joins with Relationships.
   */
  findDependants(familyId: string): Promise<FamilyMember[]>;

  /**
   * Find members by their specific role/relationship type.
   */
  findByRole(familyId: string, role: RelationshipType): Promise<FamilyMember[]>;

  /**
   * Find the Family Head(s) designated in the family metadata.
   * Critical for Customary Law dispute resolution.
   */
  findFamilyHeads(familyId: string): Promise<FamilyMember[]>;

  // ---------------------------------------------------------
  // Search & Identification
  // ---------------------------------------------------------

  /**
   * Search members by name across a specific family.
   */
  searchByName(query: string, familyId: string): Promise<FamilyMember[]>;

  /**
   * Find members by birth date range (e.g., to find members turning 18 soon).
   */
  findByBirthDateRange(startDate: Date, endDate: Date, familyId?: string): Promise<FamilyMember[]>;

  // ---------------------------------------------------------
  // Bulk Operations
  // ---------------------------------------------------------
  updateMany(members: FamilyMember[]): Promise<void>;

  /**
   * Perform soft delete on multiple members (e.g., pruning a branch).
   */
  softDeleteMany(memberIds: string[]): Promise<void>;
}
