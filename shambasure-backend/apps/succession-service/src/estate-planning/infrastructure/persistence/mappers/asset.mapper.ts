import { Injectable, Logger } from '@nestjs/common';
import { Asset as PrismaAsset, Prisma } from '@prisma/client';
import { Asset } from '../../../domain/entities/asset.entity';
import { AssetValue } from '../../../domain/value-objects/asset-value.vo';
import {
  AssetLocation,
  AssetIdentification,
  AssetReconstituteProps,
} from '../../../domain/entities/asset.entity';

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class AssetMappingError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'AssetMappingError';
  }
}

export class InvalidAssetEntityError extends AssetMappingError {
  constructor(entityId: string, reason: string) {
    super(`Invalid asset entity ${entityId}: ${reason}`);
    this.name = 'InvalidAssetEntityError';
  }
}

// ============================================================================
// SAFE PARSERS & TYPE GUARDS
// ============================================================================

function parseAssetLocation(json: Prisma.JsonValue | null): AssetLocation | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;

  const obj = json as Record<string, unknown>;

  // County is required for a valid location
  if (typeof obj.county !== 'string' || !obj.county.trim()) {
    Logger.warn('Malformed AssetLocation JSON encountered in mapper: missing or invalid county', {
      json,
    });
    return null;
  }

  try {
    const location: AssetLocation = {
      county: obj.county.trim(),
    };

    // Optional fields
    if (typeof obj.subCounty === 'string' && obj.subCounty.trim()) {
      location.subCounty = obj.subCounty.trim();
    }
    if (typeof obj.ward === 'string' && obj.ward.trim()) {
      location.ward = obj.ward.trim();
    }
    if (typeof obj.village === 'string' && obj.village.trim()) {
      location.village = obj.village.trim();
    }

    // Parse GPS coordinates
    if (
      obj.gpsCoordinates &&
      typeof obj.gpsCoordinates === 'object' &&
      !Array.isArray(obj.gpsCoordinates)
    ) {
      const coords = obj.gpsCoordinates as Record<string, unknown>;
      const latitude = typeof coords.latitude === 'number' ? coords.latitude : undefined;
      const longitude = typeof coords.longitude === 'number' ? coords.longitude : undefined;

      if (latitude !== undefined && longitude !== undefined) {
        location.gpsCoordinates = { latitude, longitude };
      }
    }

    return location;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error('Error parsing asset location JSON', { json, error: errorMessage });
    return null;
  }
}

function parseAssetIdentification(json: Prisma.JsonValue | null): AssetIdentification | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;

  const obj = json as Record<string, unknown>;

  try {
    const identification: AssetIdentification = {};

    // Optional fields
    if (typeof obj.registrationNumber === 'string' && obj.registrationNumber.trim()) {
      identification.registrationNumber = obj.registrationNumber.trim();
    }
    if (typeof obj.serialNumber === 'string' && obj.serialNumber.trim()) {
      identification.serialNumber = obj.serialNumber.trim();
    }
    if (typeof obj.accountNumber === 'string' && obj.accountNumber.trim()) {
      identification.accountNumber = obj.accountNumber.trim();
    }
    if (typeof obj.parcelNumber === 'string' && obj.parcelNumber.trim()) {
      identification.parcelNumber = obj.parcelNumber.trim();
    }
    if (typeof obj.vehicleRegistration === 'string' && obj.vehicleRegistration.trim()) {
      identification.vehicleRegistration = obj.vehicleRegistration.trim();
    }

    // Parse other identifiers
    if (
      obj.otherIdentifiers &&
      typeof obj.otherIdentifiers === 'object' &&
      !Array.isArray(obj.otherIdentifiers)
    ) {
      const identifiers = obj.otherIdentifiers as Record<string, unknown>;
      const otherIdentifiers: Record<string, string> = {};

      Object.entries(identifiers).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          otherIdentifiers[key] = value.trim();
        }
      });

      if (Object.keys(otherIdentifiers).length > 0) {
        identification.otherIdentifiers = otherIdentifiers;
      }
    }

    return identification;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error('Error parsing asset identification JSON', { json, error: errorMessage });
    return null;
  }
}

function toJsonValue(value: any): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value));
}

function nullableJson(value: any): Prisma.NullableJsonNullValueInput {
  return value ? toJsonValue(value) : Prisma.JsonNull;
}

function validateAssetEntity(entity: unknown): entity is PrismaAsset {
  if (typeof entity !== 'object' || entity === null) {
    return false;
  }

  const e = entity as Record<string, unknown>;

  // Required fields validation
  if (typeof e.id !== 'string' || !e.id) return false;
  if (typeof e.name !== 'string' || !e.name.trim()) return false;
  if (typeof e.type !== 'string') return false;
  if (typeof e.ownerId !== 'string' || !e.ownerId) return false;
  if (typeof e.ownershipType !== 'string') return false;
  if (typeof e.currency !== 'string') return false;
  if (typeof e.hasVerifiedDocument !== 'boolean') return false;
  if (typeof e.isEncumbered !== 'boolean') return false;
  if (typeof e.isActive !== 'boolean') return false;
  if (!(e.createdAt instanceof Date)) return false;
  if (!(e.updatedAt instanceof Date)) return false;

  return true;
}

// ============================================================================
// ASSET MAPPER
// ============================================================================

@Injectable()
export class AssetMapper {
  private readonly logger = new Logger(AssetMapper.name);

  /**
   * Converts a Prisma Asset entity into the Domain Asset entity.
   * This is used by the repository when reading from the database.
   */
  toDomain(prismaAsset: PrismaAsset): Asset {
    const entityIdForErrorReporting = prismaAsset?.id ?? 'unknown';

    try {
      // Enhanced validation
      if (!validateAssetEntity(prismaAsset)) {
        throw new InvalidAssetEntityError(entityIdForErrorReporting, 'Entity validation failed');
      }

      // Parse decimal fields from Prisma
      const ownershipShare = prismaAsset.ownershipShare ? Number(prismaAsset.ownershipShare) : 100;
      const estimatedValue = prismaAsset.estimatedValue ? Number(prismaAsset.estimatedValue) : 0;
      const encumbranceAmount = prismaAsset.encumbranceAmount
        ? Number(prismaAsset.encumbranceAmount)
        : 0;

      // Create AssetValue value object from Prisma data
      const currentValue = new AssetValue(
        estimatedValue,
        prismaAsset.currency,
        prismaAsset.valuationDate || new Date(),
      );

      // Parse location and identification from Prisma JSON fields
      const location = parseAssetLocation(prismaAsset.location);
      const identification = parseAssetIdentification(prismaAsset.identificationDetails);

      const reconstituteProps: AssetReconstituteProps = {
        id: prismaAsset.id,
        name: prismaAsset.name,
        description: prismaAsset.description || '',
        type: prismaAsset.type,
        ownerId: prismaAsset.ownerId,
        ownershipType: prismaAsset.ownershipType,
        ownershipShare: ownershipShare,
        currentValue: currentValue,
        location: location,
        identification: identification,
        hasVerifiedDocument: prismaAsset.hasVerifiedDocument,
        isEncumbered: prismaAsset.isEncumbered,
        encumbranceDetails: prismaAsset.encumbranceDetails,
        encumbranceAmount: encumbranceAmount,
        isActive: prismaAsset.isActive,
        createdAt: prismaAsset.createdAt,
        updatedAt: prismaAsset.updatedAt,
        deletedAt: prismaAsset.deletedAt,
      };

      const asset = Asset.reconstitute(reconstituteProps);

      this.logger.debug(`Successfully mapped Prisma Asset to Domain Asset: ${prismaAsset.id}`);
      return asset;
    } catch (error) {
      this.logger.error(`Failed to map Prisma Asset to Domain Asset: ${prismaAsset?.id}`, error);
      if (error instanceof AssetMappingError) {
        throw error;
      }
      throw new AssetMappingError(
        `Failed to map Prisma Asset ${prismaAsset?.id} to Domain Asset`,
        error,
      );
    }
  }

  /**
   * Converts a Domain Asset entity into Prisma create data for database insertion.
   * This is used by the repository when creating new records.
   */
  toCreateData(domainAsset: Asset): Prisma.AssetCreateInput {
    try {
      const identification = domainAsset.identification;
      const currentValue = domainAsset.currentValue;

      const createData: Prisma.AssetCreateInput = {
        id: domainAsset.id,
        name: domainAsset.name,
        description: domainAsset.description,
        type: domainAsset.type,
        owner: { connect: { id: domainAsset.ownerId } },
        ownershipType: domainAsset.ownershipType,
        ownershipShare:
          domainAsset.ownershipShare !== undefined
            ? new Prisma.Decimal(domainAsset.ownershipShare)
            : null,
        estimatedValue:
          currentValue.getAmount() !== undefined
            ? new Prisma.Decimal(currentValue.getAmount())
            : null,
        currency: currentValue.getCurrency(),
        valuationDate: currentValue.getValuationDate(),
        valuationSource: 'SYSTEM_USER_INPUT',
        location: nullableJson(domainAsset.location),
        identificationDetails: nullableJson(domainAsset.identification),
        registrationNumber: identification?.registrationNumber || null,
        hasVerifiedDocument: domainAsset.hasVerifiedDocument,
        isEncumbered: domainAsset.isEncumbered,
        encumbranceDetails: domainAsset.encumbranceDetails,
        encumbranceAmount:
          domainAsset.encumbranceAmount !== undefined
            ? new Prisma.Decimal(domainAsset.encumbranceAmount)
            : null,
        metadata: Prisma.JsonNull,
        isActive: domainAsset.isActive,
        createdAt: domainAsset.createdAt,
        updatedAt: domainAsset.updatedAt,
      };

      return createData;
    } catch (error) {
      this.logger.error('Failed to create Prisma Asset create data from Domain Asset', error);
      throw new AssetMappingError(
        'Failed to create Prisma Asset create data from Domain Asset',
        error,
      );
    }
  }

  /**
   * Converts a Domain Asset entity into Prisma update data for database updates.
   * This is used by the repository when updating existing records.
   */
  toUpdateData(domainAsset: Asset): Prisma.AssetUpdateInput {
    try {
      const location = domainAsset.location;
      const identification = domainAsset.identification;
      const currentValue = domainAsset.currentValue;

      const updateData: Prisma.AssetUpdateInput = {
        name: domainAsset.name,
        description: domainAsset.description,
        ownershipType: domainAsset.ownershipType,
        ownershipShare:
          domainAsset.ownershipShare !== undefined
            ? new Prisma.Decimal(domainAsset.ownershipShare)
            : null,
        estimatedValue:
          currentValue.getAmount() !== undefined
            ? new Prisma.Decimal(currentValue.getAmount())
            : null,
        currency: currentValue.getCurrency(),
        valuationDate: currentValue.getValuationDate(),
        valuationSource: 'SYSTEM_USER_INPUT',
        location: nullableJson(domainAsset.location),
        identificationDetails: nullableJson(domainAsset.identification),
        registrationNumber: identification?.registrationNumber || null,
        hasVerifiedDocument: domainAsset.hasVerifiedDocument,
        isEncumbered: domainAsset.isEncumbered,
        encumbranceDetails: domainAsset.encumbranceDetails,
        encumbranceAmount:
          domainAsset.encumbranceAmount !== undefined
            ? new Prisma.Decimal(domainAsset.encumbranceAmount)
            : null,
        metadata: Prisma.JsonNull,
        isActive: domainAsset.isActive,
        updatedAt: domainAsset.updatedAt,
        deletedAt: domainAsset.deletedAt,
      };

      return updateData;
    } catch (error) {
      this.logger.error('Failed to create Prisma Asset update data from Domain Asset', error);
      throw new AssetMappingError(
        'Failed to create Prisma Asset update data from Domain Asset',
        error,
      );
    }
  }

  /**
   * Creates partial update data for performance optimization.
   * This is used by the repository when only specific fields need updating.
   */
  toPartialUpdateData(domainAsset: Asset, updatedFields: string[]): Prisma.AssetUpdateInput {
    try {
      const updateData: Prisma.AssetUpdateInput = {
        updatedAt: domainAsset.updatedAt,
      };

      const location = domainAsset.location;
      const identification = domainAsset.identification;
      const currentValue = domainAsset.currentValue;

      // Only include fields that are in the updatedFields array
      if (updatedFields.includes('name')) updateData.name = domainAsset.name;
      if (updatedFields.includes('description')) updateData.description = domainAsset.description;
      if (updatedFields.includes('ownershipType'))
        updateData.ownershipType = domainAsset.ownershipType;
      if (updatedFields.includes('ownershipShare')) {
        updateData.ownershipShare =
          domainAsset.ownershipShare !== undefined
            ? new Prisma.Decimal(domainAsset.ownershipShare)
            : null;
      }
      if (updatedFields.includes('estimatedValue')) {
        updateData.estimatedValue =
          currentValue.getAmount() !== undefined
            ? new Prisma.Decimal(currentValue.getAmount())
            : null;
      }
      if (updatedFields.includes('currency')) updateData.currency = currentValue.getCurrency();
      if (updatedFields.includes('valuationDate'))
        updateData.valuationDate = currentValue.getValuationDate();
      if (updatedFields.includes('location')) {
        updateData.location = nullableJson(location);
      }
      if (updatedFields.includes('identificationDetails')) {
        updateData.identificationDetails = nullableJson(identification);
      }
      if (updatedFields.includes('registrationNumber')) {
        updateData.registrationNumber = identification?.registrationNumber || null;
      }
      if (updatedFields.includes('hasVerifiedDocument'))
        updateData.hasVerifiedDocument = domainAsset.hasVerifiedDocument;
      if (updatedFields.includes('isEncumbered'))
        updateData.isEncumbered = domainAsset.isEncumbered;
      if (updatedFields.includes('encumbranceDetails'))
        updateData.encumbranceDetails = domainAsset.encumbranceDetails;
      if (updatedFields.includes('encumbranceAmount')) {
        updateData.encumbranceAmount =
          domainAsset.encumbranceAmount !== undefined
            ? new Prisma.Decimal(domainAsset.encumbranceAmount)
            : null;
      }
      if (updatedFields.includes('isActive')) updateData.isActive = domainAsset.isActive;
      if (updatedFields.includes('deletedAt')) updateData.deletedAt = domainAsset.deletedAt;

      return updateData;
    } catch (error) {
      this.logger.error(
        'Failed to create partial Prisma Asset update data from Domain Asset',
        error,
      );
      throw new AssetMappingError(
        'Failed to create partial Prisma Asset update data from Domain Asset',
        error,
      );
    }
  }

  /**
   * Converts multiple Prisma Asset entities to Domain Asset entities.
   * This is used by the repository when querying multiple records.
   */
  toDomainList(prismaAssets: PrismaAsset[]): Asset[] {
    return prismaAssets.map((asset) => this.toDomain(asset));
  }

  /**
   * Creates Prisma where input for database queries.
   * This is used by the repository to build query filters.
   */
  toWhereInput(filters: {
    ownerId?: string;
    isActive?: boolean;
    type?: string;
    hasVerifiedDocument?: boolean;
  }): Prisma.AssetWhereInput {
    const where: Prisma.AssetWhereInput = {};

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.hasVerifiedDocument !== undefined) {
      where.hasVerifiedDocument = filters.hasVerifiedDocument;
    }

    return where;
  }

  /**
   * Legacy method for backward compatibility.
   * Returns both create and update data structures.
   */
  toPersistence(domainAsset: Asset): {
    create: Prisma.AssetCreateInput;
    update: Prisma.AssetUpdateInput;
  } {
    return {
      create: this.toCreateData(domainAsset),
      update: this.toUpdateData(domainAsset),
    };
  }
}
