// domain/interfaces/repositories/icohabitation-record.repository.ts
import { CohabitationRecord } from '../../entities/cohabitation-record.entity';

export interface ICohabitationRecordRepository {
  /**
   * Core CRUD Operations
   */
  create(record: CohabitationRecord): Promise<CohabitationRecord>;
  findById(id: string): Promise<CohabitationRecord | null>;
  update(record: CohabitationRecord): Promise<CohabitationRecord>;
  delete(id: string): Promise<void>;

  /**
   * Partner Relationship Queries (Critical for S.29(5))
   */
  findActiveByPartners(partner1Id: string, partner2Id: string): Promise<CohabitationRecord | null>;
  findAllByPartners(partner1Id: string, partner2Id: string): Promise<CohabitationRecord[]>;
  findAllByPartnerId(partnerId: string): Promise<CohabitationRecord[]>;
  getActivePartnerId(partnerId: string): Promise<string | null>;
  isPersonInActiveCohabitation(partnerId: string): Promise<boolean>;

  /**
   * Family Relationship Queries
   */
  findAllByFamilyId(familyId: string): Promise<CohabitationRecord[]>;
  countByFamilyId(familyId: string): Promise<number>;
  findActiveByFamilyId(familyId: string): Promise<CohabitationRecord[]>;
  findEndedByFamilyId(familyId: string): Promise<CohabitationRecord[]>;

  /**
   * S.29(5) LSA Compliance Queries (Critical for Inheritance)
   */
  findQualifyingForS29ByFamilyId(familyId: string): Promise<CohabitationRecord[]>;
  findQualifyingForS29ByPartnerId(partnerId: string): Promise<CohabitationRecord[]>;
  findQualifyingAsWomanLivingAsWife(familyId: string): Promise<CohabitationRecord[]>;

  /**
   * Status-Based Queries
   */
  findAcknowledgedByFamilyId(familyId: string): Promise<CohabitationRecord[]>;
  findRegisteredByFamilyId(familyId: string): Promise<CohabitationRecord[]>;
  findRejectedByFamilyId(familyId: string): Promise<CohabitationRecord[]>;
  findWithChildrenByFamilyId(familyId: string): Promise<CohabitationRecord[]>;

  /**
   * Duration-Based Queries (Critical for S.29(5) threshold)
   */
  findWithDurationGreaterThan(familyId: string, years: number): Promise<CohabitationRecord[]>;
  findActiveWithLongDuration(familyId: string, years: number): Promise<CohabitationRecord[]>;
  findPotentialS29Claims(familyId: string): Promise<CohabitationRecord[]>;

  /**
   * Bulk Operations
   */
  batchSave(records: CohabitationRecord[]): Promise<CohabitationRecord[]>;
  batchEndByFamilyId(familyId: string, endDate: Date): Promise<void>;

  /**
   * Validation & Existence Checks
   */
  existsActiveForPartners(partner1Id: string, partner2Id: string): Promise<boolean>;
  validateCohabitationUniqueness(
    familyId: string,
    partner1Id: string,
    partner2Id: string,
    startDate: Date,
  ): Promise<boolean>;

  /**
   * Statistics & Reporting
   */
  getCohabitationStatistics(familyId: string): Promise<{
    total: number;
    active: number;
    ended: number;
    acknowledged: number;
    registered: number;
    qualifyingS29: number;
    withChildren: number;
    averageDuration: number;
  }>;

  /**
   * Date Range Queries
   */
  findOverlappingByDateRange(
    familyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CohabitationRecord[]>;

  /**
   * Legal Evidence Queries
   */
  findWithStrongEvidence(familyId: string): Promise<CohabitationRecord[]>;
}
