// domain/interfaces/repositories/ilegal-dependant.repository.ts
import { DependencyLevel, KenyanLawSection } from '@prisma/client';

import { LegalDependant } from '../../entities/legal-dependant.entity';

export interface ILegalDependantRepository {
  /**
   * Core CRUD Operations
   */
  create(dependant: LegalDependant): Promise<LegalDependant>;
  findById(id: string): Promise<LegalDependant | null>;
  update(dependant: LegalDependant): Promise<LegalDependant>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  /**
   * Deceased-Dependant Relationship Queries (Critical for S.29)
   */
  findByDeceasedAndDependant(
    deceasedId: string,
    dependantId: string,
  ): Promise<LegalDependant | null>;
  findAllByDeceasedId(deceasedId: string): Promise<LegalDependant[]>;
  findAllByDependantId(dependantId: string): Promise<LegalDependant[]>;
  existsByDeceasedAndDependant(deceasedId: string, dependantId: string): Promise<boolean>;

  /**
   * S.29 LSA Compliance Queries (Critical for Inheritance)
   */
  findS29DependantsByDeceasedId(deceasedId: string): Promise<LegalDependant[]>;
  findPriorityDependantsByDeceasedId(deceasedId: string): Promise<LegalDependant[]>;
  findNonPriorityDependantsByDeceasedId(deceasedId: string): Promise<LegalDependant[]>;
  findDependantsWithCourtOrders(deceasedId: string): Promise<LegalDependant[]>;
  findDependantsWithoutCourtOrders(deceasedId: string): Promise<LegalDependant[]>;

  /**
   * S.26 Court Provision Queries (Critical for Claims)
   */
  findS26ClaimantsByDeceasedId(deceasedId: string): Promise<LegalDependant[]>;
  findPendingS26Claims(deceasedId: string): Promise<LegalDependant[]>;
  findApprovedS26Claims(deceasedId: string): Promise<LegalDependant[]>;
  findRejectedS26Claims(deceasedId: string): Promise<LegalDependant[]>;
  findS26ClaimsByAmount(deceasedId: string, minAmount: number): Promise<LegalDependant[]>;

  /**
   * Dependency Level & Type Queries
   */
  findByDependencyLevel(
    deceasedId: string,
    dependencyLevel: DependencyLevel,
  ): Promise<LegalDependant[]>;
  findByDependencyBasis(deceasedId: string, dependencyBasis: string): Promise<LegalDependant[]>;
  findFullDependants(deceasedId: string): Promise<LegalDependant[]>;
  findPartialDependants(deceasedId: string): Promise<LegalDependant[]>;

  /**
   * Special Circumstance Queries (S.29(2) LSA)
   */
  findMinorsByDeceasedId(deceasedId: string): Promise<LegalDependant[]>;
  findStudentsByDeceasedId(deceasedId: string): Promise<LegalDependant[]>;
  findDisabledDependants(deceasedId: string): Promise<LegalDependant[]>;
  findDependantsRequiringCare(deceasedId: string): Promise<LegalDependant[]>;
  findWithPhysicalDisabilities(deceasedId: string): Promise<LegalDependant[]>;
  findWithMentalDisabilities(deceasedId: string): Promise<LegalDependant[]>;

  /**
   * Financial Dependency Queries
   */
  findByDependencyPercentage(deceasedId: string, minPercentage: number): Promise<LegalDependant[]>;
  findWithFinancialEvidence(deceasedId: string): Promise<LegalDependant[]>;
  findWithoutFinancialEvidence(deceasedId: string): Promise<LegalDependant[]>;
  findWithMonthlySupport(deceasedId: string, minAmount: number): Promise<LegalDependant[]>;

  /**
   * Legal Section & Court Reference Queries
   */
  findByLegalSection(deceasedId: string, section: KenyanLawSection): Promise<LegalDependant[]>;
  findByCourtOrderReference(courtOrderReference: string): Promise<LegalDependant[]>;
  findByProvisionOrderNumber(provisionOrderNumber: string): Promise<LegalDependant | null>;

  /**
   * Evidence & Verification Queries
   */
  findWithEvidenceDocuments(deceasedId: string): Promise<LegalDependant[]>;
  findVerifiedByCourt(deceasedId: string): Promise<LegalDependant[]>;
  findUnverifiedByCourt(deceasedId: string): Promise<LegalDependant[]>;
  findWithInsufficientEvidence(deceasedId: string): Promise<LegalDependant[]>;

  /**
   * Custodial Parent Queries
   */
  findByCustodialParent(custodialParentId: string): Promise<LegalDependant[]>;
  findWithoutCustodialParent(deceasedId: string): Promise<LegalDependant[]>;

  /**
   * Bulk Operations for Estate Processing
   */
  batchSave(dependants: LegalDependant[]): Promise<LegalDependant[]>;
  batchUpdateDependencyLevel(
    deceasedId: string,
    dependantIds: string[],
    dependencyLevel: DependencyLevel,
  ): Promise<void>;
  batchUpdateCourtOrders(
    updates: Array<{
      dependantId: string;
      courtOrderNumber: string;
      approvedAmount: number;
      orderDate: Date;
    }>,
  ): Promise<void>;
  deleteAllByDeceasedId(deceasedId: string): Promise<void>;

  /**
   * Validation & Existence Checks
   */
  hasActiveS26Claim(deceasedId: string, dependantId: string): Promise<boolean>;
  hasCourtOrder(deceasedId: string, dependantId: string): Promise<boolean>;
  isAlreadyDependant(deceasedId: string, dependantId: string): Promise<boolean>;

  /**
   * Statistics & Reporting
   */
  getDependencyStatistics(deceasedId: string): Promise<{
    totalDependants: number;
    totalPriorityDependants: number;
    totalNonPriorityDependants: number;
    totalS26Claimants: number;
    totalWithCourtOrders: number;
    totalMinors: number;
    totalStudents: number;
    totalDisabled: number;
    totalFullDependants: number;
    totalPartialDependants: number;
    totalVerifiedByCourt: number;
    totalFinancialEvidence: number;
    averageDependencyPercentage: number;
    totalS26ClaimAmount: number;
    totalCourtApprovedAmount: number;
  }>;

  /**
   * Summation Queries for Estate Distribution
   */
  sumMonthlySupport(deceasedId: string): Promise<number>;
  sumClaimAmounts(deceasedId: string): Promise<number>;
  sumCourtApprovedAmounts(deceasedId: string): Promise<number>;
  calculateTotalDependencyPercentage(deceasedId: string): Promise<number>;

  /**
   * Age & Duration Queries
   */
  findDependantsExceedingAgeLimit(deceasedId: string, currentDate: Date): Promise<LegalDependant[]>;
  findStudentsExceedingLimit(deceasedId: string, currentDate: Date): Promise<LegalDependant[]>;
  findSupportEndedDependants(deceasedId: string, currentDate: Date): Promise<LegalDependant[]>;

  /**
   * Legal Compliance Queries
   */
  findNonCompliantDependants(deceasedId: string): Promise<LegalDependant[]>;
  findWithMissingEvidence(deceasedId: string): Promise<LegalDependant[]>;
  findWithExpiredStudentStatus(deceasedId: string, currentDate: Date): Promise<LegalDependant[]>;

  /**
   * Estate Distribution Queries
   */
  findEligibleForDistribution(deceasedId: string): Promise<LegalDependant[]>;
  findDependantsWithLifeInterests(deceasedId: string): Promise<LegalDependant[]>;
  findDependantsWithConditions(deceasedId: string): Promise<LegalDependant[]>;

  /**
   * Search & Filter Queries
   */
  searchByCriteria(
    deceasedId: string,
    criteria: {
      dependencyBasis?: string[];
      dependencyLevel?: DependencyLevel[];
      hasCourtOrder?: boolean;
      isMinor?: boolean;
      isStudent?: boolean;
      hasDisability?: boolean;
      minDependencyPercentage?: number;
      maxDependencyPercentage?: number;
      hasEvidence?: boolean;
    },
  ): Promise<LegalDependant[]>;

  /**
   * Timeline Queries
   */
  findCreatedAfter(deceasedId: string, date: Date): Promise<LegalDependant[]>;
  findUpdatedAfter(deceasedId: string, date: Date): Promise<LegalDependant[]>;
  findCourtOrdersIssuedAfter(deceasedId: string, date: Date): Promise<LegalDependant[]>;

  /**
   * Audit & History Queries
   */
  findDependantsByAssessmentDate(
    deceasedId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<LegalDependant[]>;
  findDependantsByVerificationDate(
    deceasedId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<LegalDependant[]>;
}
