import { Prisma, Asset as PrismaAsset } from '@prisma/client';

import {
  Asset,
  AssetReconstituteProps,
  GPSCoordinates,
} from '../../../domain/entities/asset.entity';

export class AssetMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaAsset): Asset {
    // 1. Safe JSON extraction for GPS coordinates
    const gpsCoordinates = this.parseGpsCoordinates(raw.gpsCoordinates);

    // 2. Safe JSON extraction for identification details
    const identificationDetails = this.parseIdentificationDetails(raw.identificationDetails);

    // 3. Construct Reconstruction Props with ALL fields
    const props: AssetReconstituteProps = {
      // Core Identity
      id: raw.id,
      name: raw.name,
      description: raw.description,
      type: raw.type,
      ownerId: raw.ownerId,
      ownershipType: raw.ownershipType,
      ownershipShare: raw.ownershipShare ? Number(raw.ownershipShare) : 100.0, // Default to 100 if null

      // Kenyan Location Data
      county: raw.county,
      subCounty: raw.subCounty,
      ward: raw.ward,
      village: raw.village,
      landReferenceNumber: raw.landReferenceNumber,
      gpsCoordinates: gpsCoordinates,

      // Kenyan Identification
      titleDeedNumber: raw.titleDeedNumber,
      registrationNumber: raw.registrationNumber,
      kraPin: raw.kraPin,
      identificationDetails: identificationDetails,

      // Valuation
      currentValue: raw.currentValue ? Number(raw.currentValue) : null,
      currency: raw.currency,
      valuationDate: raw.valuationDate,
      valuationSource: raw.valuationSource,

      // Legal Status - Kenyan Compliance
      verificationStatus: raw.verificationStatus,
      isEncumbered: raw.isEncumbered,
      encumbranceType: raw.encumbranceType,
      encumbranceDetails: raw.encumbranceDetails,
      encumbranceAmount: raw.encumbranceAmount ? Number(raw.encumbranceAmount) : null,

      // Matrimonial Property Status
      isMatrimonialProperty: raw.isMatrimonialProperty,
      acquiredDuringMarriage: raw.acquiredDuringMarriage,
      spouseConsentRequired: raw.spouseConsentRequired,

      // Life Interest Support
      hasLifeInterest: raw.hasLifeInterest,
      lifeInterestHolderId: raw.lifeInterestHolderId,
      lifeInterestEndsAt: raw.lifeInterestEndsAt,

      // Management & Status
      isActive: raw.isActive,
      requiresProbate: raw.requiresProbate,

      // Audit Trail
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };

    return Asset.reconstitute(props);
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(entity: Asset): Prisma.AssetUncheckedCreateInput {
    // Prepare JSON objects with proper Prisma null handling
    const gpsCoordinatesJson = entity.gpsCoordinates
      ? (JSON.parse(JSON.stringify(entity.gpsCoordinates)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    const identificationDetailsJson = entity.identificationDetails
      ? (JSON.parse(JSON.stringify(entity.identificationDetails)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    return {
      // Core Identity
      id: entity.id,
      name: entity.name,
      description: entity.description,
      type: entity.type,
      ownerId: entity.ownerId,
      ownershipType: entity.ownershipType,
      ownershipShare: entity.ownershipShare,

      // Kenyan Location Data
      county: entity.county,
      subCounty: entity.subCounty,
      ward: entity.ward,
      village: entity.village,
      landReferenceNumber: entity.landReferenceNumber,
      gpsCoordinates: gpsCoordinatesJson,

      // Kenyan Identification
      titleDeedNumber: entity.titleDeedNumber,
      registrationNumber: entity.registrationNumber,
      kraPin: entity.kraPin,
      identificationDetails: identificationDetailsJson,

      // Valuation
      currentValue: entity.currentValue,
      currency: entity.currency,
      valuationDate: entity.valuationDate,
      valuationSource: entity.valuationSource,

      // Legal Status
      verificationStatus: entity.verificationStatus,
      isEncumbered: entity.isEncumbered,
      encumbranceType: entity.encumbranceType,
      encumbranceDetails: entity.encumbranceDetails,
      encumbranceAmount: entity.encumbranceAmount,

      // Matrimonial Property
      isMatrimonialProperty: entity.isMatrimonialProperty,
      acquiredDuringMarriage: entity.acquiredDuringMarriage,
      spouseConsentRequired: entity.spouseConsentRequired,

      // Life Interest
      hasLifeInterest: entity.hasLifeInterest,
      lifeInterestHolderId: entity.lifeInterestHolderId,
      lifeInterestEndsAt: entity.lifeInterestEndsAt,

      // Management & Status
      isActive: entity.isActive,
      requiresProbate: entity.requiresProbate,

      // Audit Trail
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  /**
   * Create update-specific persistence data
   * Excludes immutable fields and handles partial updates
   */
  static toUpdatePersistence(entity: Asset): Prisma.AssetUncheckedUpdateInput {
    const full = this.toPersistence(entity);

    const updatableFields: Omit<
      Prisma.AssetUncheckedCreateInput,
      'id' | 'ownerId' | 'type' | 'createdAt'
    > = full;

    return {
      ...updatableFields,
      updatedAt: new Date(),
    };
  }

  /**
   * Parse GPS coordinates from Prisma JSON field
   */
  private static parseGpsCoordinates(gpsCoordinates: Prisma.JsonValue): GPSCoordinates | null {
    if (!gpsCoordinates || typeof gpsCoordinates !== 'object' || Array.isArray(gpsCoordinates)) {
      return null;
    }

    const coords = gpsCoordinates as Record<string, unknown>;
    if (typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    }

    return null;
  }

  /**
   * Parse identification details from Prisma JSON field
   */
  private static parseIdentificationDetails(
    identificationDetails: Prisma.JsonValue,
  ): Record<string, any> | null {
    if (
      !identificationDetails ||
      typeof identificationDetails !== 'object' ||
      Array.isArray(identificationDetails)
    ) {
      return null;
    }

    return identificationDetails as Record<string, any>;
  }
}
