import { Family } from '../../aggregates/family.aggregate';
import { FamilyLegalEvent } from '../../entities/family-legal-event.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { PolygamousHouse } from '../../entities/polygamous-house.entity';

export interface IFamilyRepository {
  // Family operations
  findById(id: string): Promise<Family | null>;
  findByCreatorId(creatorId: string): Promise<Family[]>;
  findByCounty(county: string): Promise<Family[]>;
  save(family: Family): Promise<Family>;
  update(family: Family): Promise<Family>;
  delete(id: string): Promise<void>;
  softDelete(id: string, deletedBy: string, reason?: string): Promise<void>;

  // Family member operations
  addMember(familyId: string, member: FamilyMember): Promise<FamilyMember>;
  removeMember(familyId: string, memberId: string): Promise<void>;
  findMemberById(memberId: string): Promise<FamilyMember | null>;
  findMemberByNationalId(nationalId: string): Promise<FamilyMember | null>;
  findMemberByKraPin(kraPin: string): Promise<FamilyMember | null>;
  findMembersByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findLivingMembers(familyId: string): Promise<FamilyMember[]>;
  findDeceasedMembers(familyId: string): Promise<FamilyMember[]>;
  findMinors(familyId: string): Promise<FamilyMember[]>;

  // Polygamous house operations
  createPolygamousHouse(house: PolygamousHouse): Promise<PolygamousHouse>;
  findPolygamousHouses(familyId: string): Promise<PolygamousHouse[]>;
  findPolygamousHouseById(houseId: string): Promise<PolygamousHouse | null>;
  updatePolygamousHouse(house: PolygamousHouse): Promise<PolygamousHouse>;
  dissolvePolygamousHouse(houseId: string): Promise<void>;

  // Event sourcing
  recordLegalEvent(event: FamilyLegalEvent): Promise<FamilyLegalEvent>;
  getFamilyLegalHistory(familyId: string, limit?: number): Promise<FamilyLegalEvent[]>;

  // Search operations
  searchFamilies(criteria: {
    name?: string;
    county?: string;
    clanName?: string;
    isPolygamous?: boolean;
  }): Promise<Family[]>;

  // Statistics
  getFamilyStatistics(familyId: string): Promise<{
    totalMembers: number;
    livingMembers: number;
    deceasedMembers: number;
    minors: number;
    dependants: number;
    polygamousHouses: number;
  }>;
}
