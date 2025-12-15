// domain/interfaces/repositories/ifamily-member.repository.ts
import { FamilyMember } from '../../entities/family-member.entity';

export interface IFamilyMemberRepository {
  save(member: FamilyMember): Promise<void>;

  findById(id: string): Promise<FamilyMember | null>;

  /**
   * Retrieves all members of a specific family.
   * Critical for reconstructing the Family Tree.
   */
  findByFamilyId(familyId: string): Promise<FamilyMember[]>;

  /**
   * Finds a member by their Kenyan National ID.
   * Enforces uniqueness in the system.
   */
  findByNationalId(nationalId: string): Promise<FamilyMember | null>;

  /**
   * Finds a member by KRA PIN.
   * Essential for Tax Compliance & Estate Asset mapping.
   */
  findByKraPin(kraPin: string): Promise<FamilyMember | null>;

  /**
   * Finds members marked as deceased within a family.
   */
  findDeceasedByFamily(familyId: string): Promise<FamilyMember[]>;

  /**
   * Batch retrieval for performance (e.g., fetching all beneficiaries for a case).
   */
  findByIds(ids: string[]): Promise<FamilyMember[]>;
}
