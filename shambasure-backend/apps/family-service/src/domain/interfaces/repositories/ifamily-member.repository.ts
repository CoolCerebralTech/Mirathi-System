// domain/interfaces/repositories/ifamily-member.repository.ts
import { FamilyMember } from '../../entities/family-member.entity';

/**
 * Defines the query criteria for finding FamilyMember entities.
 * All properties are optional, allowing for flexible searching.
 */
export interface FamilyMemberQueryCriteria {
  familyId?: string;
  isDeceased?: boolean;
  isMinor?: boolean;
  hasDisability?: boolean;
  isMissing?: boolean;
}

export interface IFamilyMemberRepository {
  /**
   * Finds a FamilyMember by its unique ID.
   */
  findById(id: string): Promise<FamilyMember | null>;

  /**
   * Finds a FamilyMember by their unique National ID number. Essential for preventing duplicates.
   */
  findByNationalId(nationalId: string): Promise<FamilyMember | null>;

  /**
   * Finds a FamilyMember by their associated User ID. Essential for linking to the accounts service.
   */
  findByUserId(userId: string): Promise<FamilyMember | null>;

  /**
   * Finds all FamilyMember entities that match the given criteria.
   * @param criteria The query criteria to filter members by.
   */
  findAll(criteria: FamilyMemberQueryCriteria): Promise<FamilyMember[]>;

  /**
   * Saves a new or updated FamilyMember entity. This method handles both
   * creation and updates (upsert).
   * @param member The FamilyMember entity to save.
   * @param tx An optional transaction client to perform the operation within a transaction.
   */
  save(member: FamilyMember, tx?: any): Promise<FamilyMember>;

  /**
   * Saves multiple FamilyMember entities in a single transaction.
   * @param members An array of FamilyMember entities to save.
   */
  saveMany(members: FamilyMember[]): Promise<void>;

  /**
   * Deletes a FamilyMember from the repository. The implementation should handle
   * whether this is a hard or soft delete.
   */
  delete(id: string, tx?: any): Promise<void>;
}
