// polygamous-house.mapper.ts
import { Injectable } from '@nestjs/common';
import { Prisma, PolygamousHouse as PrismaPolygamousHouse } from '@prisma/client';

import {
  PolygamousHouse,
  PolygamousHouseProps,
} from '../../../domain/entities/polygamous-house.entity';

@Injectable()
export class PolygamousHouseMapper {
  /**
   * Converts Prisma PolygamousHouse to Domain PolygamousHouse entity
   * Handles JSON fields and proper type conversions for S.40 compliance
   */
  toDomain(raw: PrismaPolygamousHouse | null): PolygamousHouse | null {
    if (!raw) return null;

    try {
      // Parse JSON fields safely
      let wivesAgreementDetails: any = raw.wivesAgreementDetails;
      if (wivesAgreementDetails && typeof wivesAgreementDetails === 'string') {
        try {
          wivesAgreementDetails = JSON.parse(wivesAgreementDetails);
        } catch {
          wivesAgreementDetails = null;
        }
      }

      const props: PolygamousHouseProps = {
        id: raw.id,
        familyId: raw.familyId,
        houseName: raw.houseName,
        houseOrder: raw.houseOrder,
        houseHeadId: raw.houseHeadId ?? undefined,
        establishedDate: new Date(raw.establishedDate),
        courtRecognized: raw.courtRecognized,
        courtOrderNumber: raw.courtOrderNumber ?? undefined,
        s40CertificateNumber: raw.s40CertificateNumber ?? undefined,
        certificateIssuedDate: raw.certificateIssuedDate
          ? new Date(raw.certificateIssuedDate)
          : undefined,
        certificateIssuingCourt: raw.certificateIssuingCourt ?? undefined,
        houseSharePercentage: raw.houseSharePercentage ?? undefined,
        houseBusinessName: raw.houseBusinessName ?? undefined,
        houseBusinessKraPin: raw.houseBusinessKraPin ?? undefined,
        separateProperty: raw.separateProperty,
        wivesConsentObtained: raw.wivesConsentObtained,
        wivesConsentDocument: raw.wivesConsentDocument ?? undefined,
        wivesAgreementDetails,
        successionInstructions: raw.successionInstructions ?? undefined,
        houseDissolvedAt: raw.houseDissolvedAt ? new Date(raw.houseDissolvedAt) : undefined,
        houseAssetsFrozen: raw.houseAssetsFrozen,
        version: raw.version,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
      };

      return PolygamousHouse.createFromProps(props);
    } catch (error) {
      console.error('Error reconstituting PolygamousHouse from persistence:', error);
      throw new Error(`Failed to reconstitute PolygamousHouse ${raw.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain PolygamousHouse entity to Prisma create/update input
   * Properly serializes JSON fields and handles S.40 compliance data
   */
  toPersistence(entity: PolygamousHouse): Prisma.PolygamousHouseUncheckedCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      familyId: props.familyId,
      houseName: props.houseName,
      houseOrder: props.houseOrder,
      houseHeadId: props.houseHeadId,
      establishedDate: props.establishedDate,
      courtRecognized: props.courtRecognized,
      courtOrderNumber: props.courtOrderNumber,
      s40CertificateNumber: props.s40CertificateNumber,
      certificateIssuedDate: props.certificateIssuedDate,
      certificateIssuingCourt: props.certificateIssuingCourt,
      houseSharePercentage: props.houseSharePercentage,
      houseBusinessName: props.houseBusinessName,
      houseBusinessKraPin: props.houseBusinessKraPin,
      separateProperty: props.separateProperty,
      wivesConsentObtained: props.wivesConsentObtained,
      wivesConsentDocument: props.wivesConsentDocument,
      wivesAgreementDetails: props.wivesAgreementDetails as Prisma.JsonValue,
      successionInstructions: props.successionInstructions,
      houseDissolvedAt: props.houseDissolvedAt,
      houseAssetsFrozen: props.houseAssetsFrozen,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates a partial update DTO from domain changes
   */
  toPrismaUpdate(entity: PolygamousHouse): Prisma.PolygamousHouseUncheckedUpdateInput {
    const props = entity.toJSON();

    return {
      houseName: props.houseName,
      houseOrder: props.houseOrder,
      houseHeadId: props.houseHeadId,
      courtRecognized: props.courtRecognized,
      courtOrderNumber: props.courtOrderNumber,
      s40CertificateNumber: props.s40CertificateNumber,
      certificateIssuedDate: props.certificateIssuedDate,
      certificateIssuingCourt: props.certificateIssuingCourt,
      houseSharePercentage: props.houseSharePercentage,
      houseBusinessName: props.houseBusinessName,
      houseBusinessKraPin: props.houseBusinessKraPin,
      separateProperty: props.separateProperty,
      wivesConsentObtained: props.wivesConsentObtained,
      wivesConsentDocument: props.wivesConsentDocument,
      wivesAgreementDetails: props.wivesAgreementDetails as Prisma.JsonValue,
      successionInstructions: props.successionInstructions,
      houseDissolvedAt: props.houseDissolvedAt,
      houseAssetsFrozen: props.houseAssetsFrozen,
      version: props.version,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts domain entity to Prisma create input with relationships
   */
  toPrismaCreate(entity: PolygamousHouse): Prisma.PolygamousHouseCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      family: { connect: { id: props.familyId } },
      houseName: props.houseName,
      houseOrder: props.houseOrder,
      houseHead: props.houseHeadId ? { connect: { id: props.houseHeadId } } : undefined,
      establishedDate: props.establishedDate,
      courtRecognized: props.courtRecognized,
      courtOrderNumber: props.courtOrderNumber,
      s40CertificateNumber: props.s40CertificateNumber,
      certificateIssuedDate: props.certificateIssuedDate,
      certificateIssuingCourt: props.certificateIssuingCourt,
      houseSharePercentage: props.houseSharePercentage,
      houseBusinessName: props.houseBusinessName,
      houseBusinessKraPin: props.houseBusinessKraPin,
      separateProperty: props.separateProperty,
      wivesConsentObtained: props.wivesConsentObtained,
      wivesConsentDocument: props.wivesConsentDocument,
      wivesAgreementDetails: props.wivesAgreementDetails as Prisma.JsonValue,
      successionInstructions: props.successionInstructions,
      houseDissolvedAt: props.houseDissolvedAt,
      houseAssetsFrozen: props.houseAssetsFrozen,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates Prisma where clause for finding by ID
   */
  createWhereById(id: string): Prisma.PolygamousHouseWhereUniqueInput {
    return { id };
  }

  /**
   * Creates Prisma where clause for finding by family
   */
  createWhereByFamily(familyId: string): Prisma.PolygamousHouseWhereInput {
    return { familyId };
  }

  /**
   * Creates Prisma where clause for finding by house head
   */
  createWhereByHouseHead(houseHeadId: string): Prisma.PolygamousHouseWhereInput {
    return { houseHeadId };
  }

  /**
   * Creates Prisma where clause for active houses (not dissolved)
   */
  createWhereActive(): Prisma.PolygamousHouseWhereInput {
    return { houseDissolvedAt: null };
  }

  /**
   * Creates Prisma where clause for S.40 certified houses
   */
  createWhereS40Certified(): Prisma.PolygamousHouseWhereInput {
    return {
      s40CertificateNumber: { not: null },
      courtRecognized: true,
    };
  }

  /**
   * Creates Prisma where clause for houses requiring S.40 compliance
   */
  createWhereRequiresS40Compliance(): Prisma.PolygamousHouseWhereInput {
    return {
      houseOrder: { gt: 1 },
      s40CertificateNumber: null,
    };
  }

  /**
   * Creates Prisma where clause for houses with frozen assets
   */
  createWhereAssetsFrozen(): Prisma.PolygamousHouseWhereInput {
    return { houseAssetsFrozen: true };
  }

  /**
   * Creates Prisma where clause for houses with separate property
   */
  createWhereSeparateProperty(): Prisma.PolygamousHouseWhereInput {
    return { separateProperty: true };
  }

  /**
   * Creates Prisma where clause for houses with wives consent
   */
  createWhereWivesConsent(): Prisma.PolygamousHouseWhereInput {
    return { wivesConsentObtained: true };
  }

  /**
   * Creates Prisma where clause for houses by order
   */
  createWhereByOrder(houseOrder: number): Prisma.PolygamousHouseWhereInput {
    return { houseOrder };
  }

  /**
   * Creates Prisma include clause for eager loading relationships
   */
  createIncludeClause(): Prisma.PolygamousHouseInclude {
    return {
      family: true,
      houseHead: true,
      marriages: true,
      children: true,
    };
  }

  /**
   * Validates mapping consistency between domain and persistence
   */
  validateMapping(entity: PolygamousHouse, raw: PrismaPolygamousHouse): boolean {
    const errors: string[] = [];

    // Basic ID validation
    if (entity.id !== raw.id) {
      errors.push(`ID mismatch: Domain=${entity.id}, Persistence=${raw.id}`);
    }

    // Version validation for optimistic concurrency
    if (entity.version !== raw.version) {
      errors.push(`Version mismatch: Domain=${entity.version}, Persistence=${raw.version}`);
    }

    // Validate S.40 certificate consistency
    if (entity.s40CertificateNumber !== (raw.s40CertificateNumber || undefined)) {
      errors.push(
        `S.40 certificate mismatch: Domain=${entity.s40CertificateNumber}, Persistence=${raw.s40CertificateNumber}`,
      );
    }

    // Validate court recognition
    if (entity.courtRecognized !== raw.courtRecognized) {
      errors.push(
        `Court recognition mismatch: Domain=${entity.courtRecognized}, Persistence=${raw.courtRecognized}`,
      );
    }

    // Validate house order
    if (entity.houseOrder !== raw.houseOrder) {
      errors.push(
        `House order mismatch: Domain=${entity.houseOrder}, Persistence=${raw.houseOrder}`,
      );
    }

    // Validate S.40 compliance status
    const domainCompliance = entity.s40ComplianceStatus;
    const persistenceCompliance = this.determineS40ComplianceFromPersistence(raw);

    if (domainCompliance !== persistenceCompliance) {
      errors.push(
        `S.40 compliance mismatch: Domain=${domainCompliance}, Persistence=${persistenceCompliance}`,
      );
    }

    // Validate house dissolution status
    if (entity.isDissolved !== !!raw.houseDissolvedAt) {
      errors.push(
        `Dissolution status mismatch: Domain=${entity.isDissolved}, Persistence=${!!raw.houseDissolvedAt}`,
      );
    }

    // Validate asset freeze status
    if (entity.houseAssetsFrozen !== raw.houseAssetsFrozen) {
      errors.push(
        `Asset freeze mismatch: Domain=${entity.houseAssetsFrozen}, Persistence=${raw.houseAssetsFrozen}`,
      );
    }

    if (errors.length > 0) {
      console.warn('PolygamousHouse mapping validation errors:', errors);
      return false;
    }

    return true;
  }

  /**
   * Determines S.40 compliance status from persistence data
   */
  private determineS40ComplianceFromPersistence(
    raw: PrismaPolygamousHouse,
  ): 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' {
    if (raw.houseOrder === 1) return 'COMPLIANT'; // First house doesn't need S.40 certification

    if (raw.courtRecognized && raw.s40CertificateNumber) {
      return 'COMPLIANT';
    }

    if (raw.wivesConsentObtained) {
      return 'PENDING'; // Has consent but not court recognized
    }

    return 'NON_COMPLIANT';
  }

  /**
   * Extracts relationship IDs from Prisma result with includes
   */
  extractRelationships(
    prismaHouse: PrismaPolygamousHouse & {
      family?: { id: string };
      houseHead?: { id: string };
      marriages?: { id: string }[];
      children?: { id: string }[];
    },
  ) {
    return {
      familyId: prismaHouse.family?.id || prismaHouse.familyId,
      houseHeadId: prismaHouse.houseHead?.id || prismaHouse.houseHeadId,
      marriageIds: prismaHouse.marriages?.map((m) => m.id) || [],
      childrenIds: prismaHouse.children?.map((c) => c.id) || [],
    };
  }

  /**
   * Creates a batch mapper for multiple polygamous houses
   */
  toDomainBatch(rawList: PrismaPolygamousHouse[]): PolygamousHouse[] {
    return rawList.map((raw) => this.toDomain(raw)).filter(Boolean) as PolygamousHouse[];
  }

  /**
   * Creates batch persistence data
   */
  toPersistenceBatch(entityList: PolygamousHouse[]): Prisma.PolygamousHouseUncheckedCreateInput[] {
    return entityList.map((entity) => this.toPersistence(entity));
  }

  /**
   * Checks if house is active based on persistence data
   */
  isActiveInPersistence(raw: PrismaPolygamousHouse): boolean {
    return !raw.houseDissolvedAt;
  }

  /**
   * Checks S.40 compliance from persistence data
   */
  isS40CompliantInPersistence(raw: PrismaPolygamousHouse): boolean {
    return this.determineS40ComplianceFromPersistence(raw) === 'COMPLIANT';
  }

  /**
   * Creates filter for polygamous houses by business registration
   */
  createWhereHasBusiness(): Prisma.PolygamousHouseWhereInput {
    return {
      OR: [{ houseBusinessName: { not: null } }, { houseBusinessKraPin: { not: null } }],
    };
  }

  /**
   * Creates filter for houses with defined share percentages
   */
  createWhereHasSharePercentage(): Prisma.PolygamousHouseWhereInput {
    return { houseSharePercentage: { not: null } };
  }

  /**
   * Creates filter for houses established within a date range
   */
  createWhereEstablishedInRange(
    startDate?: Date,
    endDate?: Date,
  ): Prisma.PolygamousHouseWhereInput {
    const filter: any = {};

    if (startDate) {
      filter.establishedDate = { gte: startDate };
    }

    if (endDate) {
      if (filter.establishedDate) {
        filter.establishedDate.lte = endDate;
      } else {
        filter.establishedDate = { lte: endDate };
      }
    }

    return filter;
  }

  /**
   * Creates sort order for polygamous houses
   */
  createSortOrder(
    sortBy: 'houseOrder' | 'establishedDate' | 'createdAt' = 'houseOrder',
    order: 'asc' | 'desc' = 'asc',
  ): Prisma.PolygamousHouseOrderByWithRelationInput {
    return { [sortBy]: order };
  }

  /**
   * Helper to extract polygamous house statistics from persistence data
   */
  extractStatistics(rawList: PrismaPolygamousHouse[]): {
    total: number;
    active: number;
    dissolved: number;
    s40Compliant: number;
    s40NonCompliant: number;
    withBusiness: number;
    withSeparateProperty: number;
    byOrder: Record<number, number>;
  } {
    const stats = {
      total: rawList.length,
      active: 0,
      dissolved: 0,
      s40Compliant: 0,
      s40NonCompliant: 0,
      withBusiness: 0,
      withSeparateProperty: 0,
      byOrder: {} as Record<number, number>,
    };

    rawList.forEach((raw) => {
      // Count active/dissolved
      if (raw.houseDissolvedAt) {
        stats.dissolved++;
      } else {
        stats.active++;
      }

      // Count S.40 compliance
      const compliance = this.determineS40ComplianceFromPersistence(raw);
      if (compliance === 'COMPLIANT') {
        stats.s40Compliant++;
      } else if (compliance === 'NON_COMPLIANT') {
        stats.s40NonCompliant++;
      }

      // Count with business
      if (raw.houseBusinessName || raw.houseBusinessKraPin) {
        stats.withBusiness++;
      }

      // Count with separate property
      if (raw.separateProperty) {
        stats.withSeparateProperty++;
      }

      // Count by house order
      stats.byOrder[raw.houseOrder] = (stats.byOrder[raw.houseOrder] || 0) + 1;
    });

    return stats;
  }

  /**
   * Calculates house share for estate distribution (S.40(2) LSA)
   */
  calculateHouseShareDistribution(
    houses: PrismaPolygamousHouse[],
    totalEstateValue: number,
  ): Array<{ houseId: string; houseName: string; share: number; value: number }> {
    const distribution = [];

    // Calculate total shares
    let totalShares = 0;
    const houseShares = new Map<string, number>();

    houses.forEach((house) => {
      const share = house.houseSharePercentage || 100 / houses.length; // Default equal share
      houseShares.set(house.id, share);
      totalShares += share;
    });

    // Calculate actual distribution
    houseShares.forEach((share, houseId) => {
      const house = houses.find((h) => h.id === houseId);
      if (!house) return;

      const percentage = (share / totalShares) * 100;
      const value = (share / totalShares) * totalEstateValue;

      distribution.push({
        houseId,
        houseName: house.houseName,
        houseOrder: house.houseOrder,
        sharePercentage: percentage,
        shareValue: value,
        s40Certified: !!house.s40CertificateNumber,
      });
    });

    return distribution;
  }

  /**
   * Validates S.40 compliance requirements for house creation
   */
  validateS40ComplianceRequirements(
    houseOrder: number,
    hasWivesConsent: boolean,
    isCourtRecognized: boolean,
  ): {
    valid: boolean;
    requirements: string[];
    missing: string[];
  } {
    const requirements: string[] = [];
    const missing: string[] = [];

    if (houseOrder === 1) {
      requirements.push('First house - No S.40 requirements');
      return { valid: true, requirements, missing };
    }

    requirements.push('Subsequent house requires:');

    // Wives consent
    if (houseOrder > 1) {
      requirements.push('- Consent from existing wives');
      if (!hasWivesConsent) {
        missing.push('Wives consent');
      }
    }

    // Court recognition (for full S.40 compliance)
    requirements.push('- Court recognition (for full compliance)');
    if (!isCourtRecognized) {
      missing.push('Court recognition');
    }

    const valid = missing.length === 0;
    return { valid, requirements, missing };
  }
}

/**
 * Factory for creating PolygamousHouseMapper with dependency injection support
 */
export class PolygamousHouseMapperFactory {
  static create(): PolygamousHouseMapper {
    return new PolygamousHouseMapper();
  }
}

/**
 * Type guard for Prisma PolygamousHouse with relationships
 */
export function isPrismaPolygamousHouseWithRelationships(
  house: any,
): house is PrismaPolygamousHouse & {
  family?: { id: string };
  houseHead?: { id: string };
  marriages?: { id: string }[];
  children?: { id: string }[];
} {
  return house && typeof house === 'object' && 'id' in house && 'familyId' in house;
}

/**
 * Helper to validate S.40 certificate format
 */
export function validateS40CertificateFormat(certificateNumber: string): boolean {
  // Kenyan S.40 certificate format validation
  const pattern = /^S40\/[A-Z]+\/\d+\/\d{4}$/;
  return pattern.test(certificateNumber);
}

/**
 * Helper to calculate house order validation
 */
export function validateHouseOrder(houseOrder: number, existingHousesCount: number): boolean {
  // House order should be sequential and not skip numbers
  return houseOrder > 0 && houseOrder <= existingHousesCount + 1;
}
