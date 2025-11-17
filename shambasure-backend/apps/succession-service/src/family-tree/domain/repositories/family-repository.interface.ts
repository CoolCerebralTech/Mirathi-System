// family-tree/domain/repositories/family.repository.interface.ts
import { Family } from '../../entities/family.entity';
import { FamilyAggregate } from '../aggregates/family.aggregate';

export interface FamilyRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<FamilyAggregate | null>;
  findByCreatorId(creatorId: string): Promise<FamilyAggregate[]>;
  save(family: FamilyAggregate): Promise<void>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  // Complex queries
  findFamiliesWithMembers(memberId: string): Promise<FamilyAggregate[]>;
  findFamiliesByCulturalBackground(background: string): Promise<FamilyAggregate[]>;
  findActiveFamilies(): Promise<FamilyAggregate[]>;

  // Search operations
  searchFamilies(query: string): Promise<FamilyAggregate[]>;
  findFamiliesByLocation(county: string): Promise<FamilyAggregate[]>;

  // Analytics
  countFamiliesByCreator(creatorId: string): Promise<number>;
  getFamilyStatistics(familyId: string): Promise<{
    memberCount: number;
    marriageCount: number;
    minorCount: number;
    elderCount: number;
  }>;

  // Transaction support
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
