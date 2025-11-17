// family-tree/domain/repositories/guardianship.repository.interface.ts
import { GuardianType } from '@prisma/client';
import { Guardianship } from '../entities/guardianship.entity';

export interface GuardianshipRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<Guardianship | null>;
  findByFamilyId(familyId: string): Promise<Guardianship[]>;
  findByGuardianId(guardianId: string): Promise<Guardianship[]>;
  findByWardId(wardId: string): Promise<Guardianship[]>;
  save(guardianship: Guardianship): Promise<void>;
  delete(id: string): Promise<void>;

  // Status-based queries
  findActiveGuardianships(familyId: string): Promise<Guardianship[]>;
  findExpiredGuardianships(familyId: string): Promise<Guardianship[]>;
  findCourtAppointedGuardianships(familyId: string): Promise<Guardianship[]>;

  // Type-based queries
  findByGuardianType(familyId: string, guardianType: GuardianType): Promise<Guardianship[]>;
  findTestamentaryGuardianships(familyId: string): Promise<Guardianship[]>;
  findFinancialGuardianships(familyId: string): Promise<Guardianship[]>;

  // Complex queries
  findGuardianshipsRequiringRenewal(daysThreshold: number): Promise<Guardianship[]>;
  findGuardianshipsWithFinancialResponsibilities(familyId: string): Promise<Guardianship[]>;

  // Validation queries
  validateNoConflictingGuardianships(wardId: string): Promise<boolean>;
  validateGuardianEligibility(guardianId: string, wardId: string): Promise<boolean>;

  // Analytics
  getGuardianshipStatistics(familyId: string): Promise<{
    totalGuardianships: number;
    activeGuardianships: number;
    byType: Record<GuardianType, number>;
    averageDuration: number;
  }>;

  // Bulk operations
  bulkTerminateGuardianships(
    guardianshipIds: string[],
    terminationDate: Date,
    reason: string,
  ): Promise<void>;
  bulkExtendGuardianships(guardianshipIds: string[], newValidUntil: Date): Promise<void>;
}
