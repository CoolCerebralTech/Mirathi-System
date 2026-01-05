// apps/family-service/src/domain/interfaces/family.repository.interface.ts
import { Family, FamilyMember, Guardianship, Marriage } from '../models/family.model';

export interface IFamilyRepository {
  // Family Aggregate
  createFamily(data: Partial<Family>): Promise<Family>;
  findByCreatorId(creatorId: string): Promise<Family | null>;
  findById(id: string): Promise<Family | null>;
  updateFamily(id: string, data: Partial<Family>): Promise<Family>;

  // Members
  addMember(data: Partial<FamilyMember>): Promise<FamilyMember>;
  findMemberById(id: string): Promise<FamilyMember | null>;
  findMembersByFamilyId(familyId: string): Promise<FamilyMember[]>;
  updateMember(id: string, data: Partial<FamilyMember>): Promise<FamilyMember>;
  deleteMember(id: string): Promise<void>;

  // Marriages (Relationships)
  addMarriage(data: Partial<Marriage>): Promise<Marriage>;
  findMarriagesByFamilyId(familyId: string): Promise<Marriage[]>;

  // Guardianship
  createGuardianship(data: Partial<Guardianship>): Promise<Guardianship>;
  findGuardianshipByWardId(wardId: string): Promise<Guardianship | null>;
  updateGuardianship(id: string, data: Partial<Guardianship>): Promise<Guardianship>;
}
