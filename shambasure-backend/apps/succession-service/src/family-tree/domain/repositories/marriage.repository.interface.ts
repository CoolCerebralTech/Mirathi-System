// family-tree/domain/repositories/marriage.repository.interface.ts
import { MarriageStatus } from '@prisma/client';
import { Marriage } from '../entities/marriage.entity';
import { KenyanMarriage } from '../value-objects/kenyan-marriage.vo';

export interface MarriageRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<Marriage | null>;
  findByFamilyId(familyId: string): Promise<Marriage[]>;
  findBySpouseId(spouseId: string): Promise<Marriage[]>;
  save(marriage: Marriage): Promise<void>;
  delete(id: string): Promise<void>;

  // Status-based queries
  findByStatus(familyId: string, status: MarriageStatus): Promise<Marriage[]>;
  findActiveMarriages(familyId: string): Promise<Marriage[]>;
  findDissolvedMarriages(familyId: string): Promise<Marriage[]>;

  // Type-based queries
  findCustomaryMarriages(familyId: string): Promise<Marriage[]>;
  findCivilMarriages(familyId: string): Promise<Marriage[]>;
  findPolygamousMarriages(familyId: string): Promise<Marriage[]>;

  // Complex queries
  findMarriagesByDuration(familyId: string, minYears: number): Promise<Marriage[]>;
  findMarriagesProducingChildren(familyId: string): Promise<Marriage[]>;

  // Validation queries
  validateNoOverlappingMarriages(spouseId: string, marriageDate: Date): Promise<boolean>;
  validatePolygamousMarriage(spouseId: string, community: string): Promise<boolean>;

  // Analytics
  getMarriageStatistics(familyId: string): Promise<{
    totalMarriages: number;
    activeMarriages: number;
    averageDuration: number;
    customaryMarriages: number;
    polygamousMarriages: number;
  }>;
}
