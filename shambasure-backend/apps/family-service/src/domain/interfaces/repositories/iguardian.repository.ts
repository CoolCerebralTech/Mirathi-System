// domain/interfaces/repositories/iguardian.repository.ts
import { GuardianType } from '@prisma/client';

import { Guardian } from '../../entities/guardian.entity';

export interface IGuardianRepository {
  /**
   * Core CRUD Operations
   */
  create(guardian: Guardian): Promise<Guardian>;
  findById(id: string): Promise<Guardian | null>;
  update(guardian: Guardian): Promise<Guardian>;
  delete(id: string): Promise<void>;

  /**
   * Person-Centric Queries (Critical for legal relationships)
   */
  findAllByWardId(wardId: string): Promise<Guardian[]>;
  findAllByGuardianId(guardianId: string): Promise<Guardian[]>;
  findActiveByWardId(wardId: string): Promise<Guardian | null>;
  findActiveByGuardianId(guardianId: string): Promise<Guardian[]>;
  findActiveGuardianship(wardId: string, guardianId: string): Promise<Guardian | null>;

  /**
   * Kenyan Legal Requirement Queries (S.70-73 LSA)
   */
  findByCourtCaseNumber(caseNumber: string): Promise<Guardian | null>;
  findByCourtOrderNumber(orderNumber: string): Promise<Guardian | null>;
  findAllCourtAppointed(): Promise<Guardian[]>;
  findAllTestamentary(): Promise<Guardian[]>;

  /**
   * S.72 Guardian Bond Compliance Queries (Critical)
   */
  findGuardianshipsRequiringBond(): Promise<Guardian[]>;
  findWithoutBondPosted(): Promise<Guardian[]>;
  findWithExpiredBond(): Promise<Guardian[]>;
  findCompliantWithS72(): Promise<Guardian[]>;
  findNonCompliantWithS72(): Promise<Guardian[]>;

  /**
   * S.73 Annual Reporting Compliance Queries (Critical)
   */
  findWithOverdueReports(): Promise<Guardian[]>;
  findWithReportsDueSoon(daysThreshold: number): Promise<Guardian[]>;
  findCompliantWithS73(): Promise<Guardian[]>;
  findNonCompliantWithS73(): Promise<Guardian[]>;
  findRequiringAnnualReports(): Promise<Guardian[]>;

  /**
   * Status & Active Management Queries
   */
  findActiveGuardianships(): Promise<Guardian[]>;
  findTerminatedGuardianships(): Promise<Guardian[]>;
  findExpiredGuardianships(): Promise<Guardian[]>;
  findGuardianshipsExpiringSoon(daysThreshold: number): Promise<Guardian[]>;

  /**
   * Guardian Type & Powers Queries
   */
  findByType(type: GuardianType): Promise<Guardian[]>;
  findWithPropertyManagementPowers(): Promise<Guardian[]>;
  findWithoutPropertyManagementPowers(): Promise<Guardian[]>;
  findWithMedicalConsentPowers(): Promise<Guardian[]>;
  findWithMarriageConsentPowers(): Promise<Guardian[]>;

  /**
   * Bulk Operations for Family Management
   */
  batchCreate(guardians: Guardian[]): Promise<Guardian[]>;
  batchTerminateByWardId(wardId: string, reason: string): Promise<void>;
  batchUpdateReportStatuses(
    updates: Array<{ guardianId: string; reportStatus: string; lastReportDate: Date }>,
  ): Promise<void>;

  /**
   * Compliance & Legal Reporting
   */
  getGuardianshipComplianceSummary(): Promise<{
    total: number;
    active: number;
    terminated: number;
    bondRequired: number;
    bondCompliant: number;
    s73Compliant: number;
    s73NonCompliant: number;
    propertyPowers: number;
    courtAppointed: number;
    testamentary: number;
  }>;

  /**
   * Validation & Existence Checks
   */
  existsActiveForWard(wardId: string): Promise<boolean>;
  existsActiveForGuardian(guardianId: string): Promise<boolean>;
  validateGuardianshipUniqueness(
    wardId: string,
    guardianId: string,
    type: GuardianType,
  ): Promise<boolean>;

  /**
   * Bond Management Operations (S.72 LSA)
   */
  postBond(
    guardianId: string,
    provider: string,
    policyNumber: string,
    expiryDate: Date,
  ): Promise<void>;
  updateBondExpiry(guardianId: string, newExpiry: Date): Promise<void>;

  /**
   * Annual Report Management Operations (S.73 LSA)
   */
  fileAnnualReport(guardianId: string, reportDate: Date, approvedBy?: string): Promise<void>;
  approveAnnualReport(guardianId: string, approvedBy: string): Promise<void>;
  markReportOverdue(guardianId: string): Promise<void>;

  /**
   * Power Management Operations
   */
  grantPropertyManagementPowers(guardianId: string, courtOrderNumber?: string): Promise<void>;
  revokePropertyManagementPowers(guardianId: string): Promise<void>;
  updateGuardianPowers(
    guardianId: string,
    powers: {
      canConsentToMedical?: boolean;
      canConsentToMarriage?: boolean;
      restrictions?: any;
      specialInstructions?: string;
    },
  ): Promise<void>;

  /**
   * Allowance Management
   */
  updateAnnualAllowance(guardianId: string, amount: number, approvedBy: string): Promise<void>;
  approveAllowance(guardianId: string, approvedBy: string): Promise<void>;

  /**
   * Termination & Extension Operations
   */
  terminateGuardianship(guardianId: string, reason: string, terminationDate: Date): Promise<void>;
  extendGuardianshipTerm(
    guardianId: string,
    newValidUntil: Date,
    courtOrderNumber?: string,
  ): Promise<void>;

  /**
   * Complex Queries for Legal Proceedings
   */
  findGuardianshipsInLegalProceedings(): Promise<Guardian[]>;
  findGuardianshipsWithRestrictions(): Promise<Guardian[]>;
  findGuardianshipsWithSpecialInstructions(): Promise<Guardian[]>;
  findGuardianshipsByCourtStation(courtStation: string): Promise<Guardian[]>;
}
