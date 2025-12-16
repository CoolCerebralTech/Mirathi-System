// domain/interfaces/repositories/imarriage.repository.ts
import { MarriageEndReason, MarriageType } from '@prisma/client';

import { Marriage } from '../../entities/marriage.entity';

export interface IMarriageRepository {
  /**
   * Core CRUD Operations
   */
  create(marriage: Marriage): Promise<Marriage>;
  findById(id: string): Promise<Marriage | null>;
  update(marriage: Marriage): Promise<Marriage>;
  delete(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;

  /**
   * Legal Registration Queries (Critical for Civil/Christian marriages)
   */
  findByRegistrationNumber(registrationNumber: string): Promise<Marriage | null>;
  existsByRegistrationNumber(registrationNumber: string): Promise<boolean>;
  findUnregisteredMarriages(familyId: string): Promise<Marriage[]>;
  findRegisteredMarriages(familyId: string): Promise<Marriage[]>;

  /**
   * Family Relationship Queries
   */
  findAllByFamilyId(familyId: string): Promise<Marriage[]>;
  findActiveByFamilyId(familyId: string): Promise<Marriage[]>;
  findEndedByFamilyId(familyId: string): Promise<Marriage[]>;
  countByFamilyId(familyId: string): Promise<number>;

  /**
   * Spouse-Centric Queries (Critical for inheritance calculations)
   */
  findActiveBySpouseId(spouseId: string): Promise<Marriage | null>;
  findAllBySpouseId(spouseId: string): Promise<Marriage[]>;
  findActiveMarriagesBySpouseId(spouseId: string): Promise<Marriage[]>;
  findEndedMarriagesBySpouseId(spouseId: string): Promise<Marriage[]>;
  findDeceasedSpouseMarriages(spouseId: string): Promise<Marriage[]>;
  findDivorcedMarriagesBySpouseId(spouseId: string): Promise<Marriage[]>;

  /**
   * S.40 Polygamy Compliance Queries (Critical for estate distribution)
   */
  findPolygamousByFamilyId(familyId: string): Promise<Marriage[]>;
  findMonogamousByFamilyId(familyId: string): Promise<Marriage[]>;
  findByPolygamousHouseId(houseId: string): Promise<Marriage[]>;
  findWithoutPolygamousHouse(familyId: string): Promise<Marriage[]>;
  validateS40Compliance(familyId: string): Promise<{
    totalHouses: number;
    marriagesWithoutHouse: number;
    nonPolygamousMarriages: number;
    isCompliant: boolean;
  }>;

  /**
   * Marriage Type Queries (Critical for legal distinctions)
   */
  findByType(familyId: string, type: MarriageType): Promise<Marriage[]>;
  findCustomaryMarriages(familyId: string): Promise<Marriage[]>;
  findIslamicMarriages(familyId: string): Promise<Marriage[]>;
  findCivilMarriages(familyId: string): Promise<Marriage[]>;
  findChristianMarriages(familyId: string): Promise<Marriage[]>;

  /**
   * Status & Lifecycle Queries
   */
  findActiveMarriages(familyId: string): Promise<Marriage[]>;
  findEndedMarriages(familyId: string, endReason?: MarriageEndReason): Promise<Marriage[]>;
  findDissolvedMarriages(familyId: string): Promise<Marriage[]>;
  findWidowedMarriages(familyId: string): Promise<Marriage[]>;
  findSeparatedMarriages(familyId: string): Promise<Marriage[]>;

  /**
   * S.29 Dependant Claim Queries (Critical for inheritance)
   */
  findQualifyingDependantMarriages(familyId: string): Promise<Marriage[]>;
  findMarriagesWithPendingMaintenance(familyId: string): Promise<Marriage[]>;
  findMarriagesWithUnsettledProperty(familyId: string): Promise<Marriage[]>;

  /**
   * Bride Price & Customary Compliance Queries
   */
  findMarriagesWithBridePrice(familyId: string): Promise<Marriage[]>;
  findMarriagesWithPaidBridePrice(familyId: string): Promise<Marriage[]>;
  findMarriagesWithUnpaidBridePrice(familyId: string): Promise<Marriage[]>;
  findMarriagesWithClanApproval(familyId: string): Promise<Marriage[]>;
  findMarriagesWithFamilyConsent(familyId: string): Promise<Marriage[]>;

  /**
   * Islamic Marriage Queries
   */
  findMarriagesWithMahr(familyId: string): Promise<Marriage[]>;
  findMarriagesWithTalaq(familyId: string): Promise<Marriage[]>;

  /**
   * Matrimonial Property Act Queries
   */
  findMarriagesWithMatrimonialProperty(familyId: string): Promise<Marriage[]>;
  findMarriagesWithSettledProperty(familyId: string): Promise<Marriage[]>;
  findMarriagesWithUnsettledProperty(familyId: string): Promise<Marriage[]>;

  /**
   * Date Range & Timeline Queries
   */
  findMarriagesByDateRange(familyId: string, startDate: Date, endDate: Date): Promise<Marriage[]>;
  findOverlappingMarriages(
    spouse1Id: string,
    spouse2Id: string,
    startDate: Date,
    endDate?: Date,
  ): Promise<Marriage[]>;
  findCurrentMarriageAtDate(spouseId: string, date: Date): Promise<Marriage | null>;

  /**
   * Bulk Operations for Family Aggregates
   */
  batchSave(marriages: Marriage[]): Promise<Marriage[]>;
  batchDeleteByFamilyId(familyId: string): Promise<void>;
  batchEndMarriagesBySpouseDeath(spouseId: string, dateOfDeath: Date): Promise<void>;

  /**
   * Validation & Existence Checks
   */
  existsActiveForSpouses(spouse1Id: string, spouse2Id: string): Promise<boolean>;
  validateMarriageUniqueness(
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    startDate: Date,
  ): Promise<boolean>;
  hasAnyActiveMarriage(spouseId: string): Promise<boolean>;
  countActiveMarriages(spouseId: string): Promise<number>;

  /**
   * Statistics & Reporting
   */
  getMarriageStatistics(familyId: string): Promise<{
    total: number;
    active: number;
    ended: number;
    polygamous: number;
    customary: number;
    islamic: number;
    civil: number;
    christian: number;
    withBridePrice: number;
    withMatrimonialProperty: number;
    averageDuration: number;
    divorceRate: number;
  }>;

  /**
   * Legal Compliance Checks
   */
  findNonCompliantMarriages(familyId: string): Promise<Marriage[]>;
  findInvalidUnderKenyanLaw(familyId: string): Promise<Marriage[]>;
  findMarriagesNeedingCourtValidation(familyId: string): Promise<Marriage[]>;
}
