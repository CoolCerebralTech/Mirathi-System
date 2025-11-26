import { Asset as PrismaAsset, Prisma } from '@prisma/client';
import {
  Asset,
  AssetLocation,
  AssetIdentification,
  AssetReconstituteProps,
} from '../../../domain/entities/asset.entity';
import { AssetType, AssetOwnershipType } from '@prisma/client';

export class AssetMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaAsset): Asset {
    // 1. Safe JSON extraction with explicit typing
    const location =
      raw.location && typeof raw.location === 'object' && !Array.isArray(raw.location)
        ? (raw.location as unknown as AssetLocation)
        : null;

    const identification =
      raw.identificationDetails &&
      typeof raw.identificationDetails === 'object' &&
      !Array.isArray(raw.identificationDetails)
        ? (raw.identificationDetails as unknown as AssetIdentification)
        : null;

    // 2. Extract Metadata safely
    const metadataRecord = (raw.metadata as Record<string, unknown>) || {};
    const encumbranceAmount =
      typeof metadataRecord.encumbranceAmount === 'number' ? metadataRecord.encumbranceAmount : 0;

    // 3. Handle Decimal conversions safely
    const ownershipShare = raw.ownershipShare ? raw.ownershipShare.toNumber() : 100;
    const estimatedValue = raw.estimatedValue ? raw.estimatedValue.toNumber() : 0;

    // 4. Construct Reconstruction Props
    const props: AssetReconstituteProps = {
      id: raw.id,
      name: raw.name,
      description: raw.description || '',
      type: raw.type as unknown as AssetType,
      ownerId: raw.ownerId,
      ownershipType: raw.ownershipType as unknown as AssetOwnershipType,
      ownershipShare: ownershipShare,

      // Reconstruct AssetValue Data
      currentValue: {
        amount: estimatedValue,
        currency: raw.currency,
        valuationDate: raw.valuationDate || raw.createdAt,
      },

      location: location,
      identification: identification,

      hasVerifiedDocument: raw.hasVerifiedDocument,
      isEncumbered: raw.isEncumbered,
      encumbranceDetails: raw.encumbranceDetails,
      encumbranceAmount: encumbranceAmount,

      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };

    return Asset.reconstitute(props);
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   * ENHANCED: Proper JSON null handling for Prisma
   */
  static toPersistence(entity: Asset): Prisma.AssetUncheckedCreateInput {
    // 1. Extract Value Objects
    const currentValue = entity.currentValue;

    // 2. Prepare Metadata strictly as a JsonObject
    const metadata: Prisma.JsonObject = {
      encumbranceAmount: entity.encumbranceAmount,
      domainVersion: 1,
    };

    // 3. ENHANCED: Prepare JSON objects with proper Prisma null handling
    const locationJson = entity.location
      ? (JSON.parse(JSON.stringify(entity.location)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    const identificationJson = entity.identification
      ? (JSON.parse(JSON.stringify(entity.identification)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    const metadataJson = metadata
      ? (JSON.parse(JSON.stringify(metadata)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    // 4. Map 'registrationNumber' using ONLY fields that exist in AssetIdentification
    const regNumber =
      entity.identification?.registrationNumber ||
      entity.identification?.parcelNumber || // Used for Land
      entity.identification?.vehicleRegistration ||
      null;

    // 5. ENHANCED: Return Prisma input type instead of model type for better compatibility
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,

      // Strict Enum Casting
      type: entity.type,
      ownerId: entity.ownerId,
      ownershipType: entity.ownershipType,

      ownershipShare: new Prisma.Decimal(entity.ownershipShare),

      // Valuation Mapping
      estimatedValue: new Prisma.Decimal(currentValue.getAmount()),
      currency: currentValue.getCurrency(),
      valuationDate: currentValue.getValuationDate(),
      valuationSource: 'System Update',

      // ENHANCED: Use Prisma.JsonNull for null JSON values
      location: locationJson,
      identificationDetails: identificationJson,
      registrationNumber: regNumber,

      // Legal Status
      hasVerifiedDocument: entity.hasVerifiedDocument,
      isEncumbered: entity.isEncumbered,
      encumbranceDetails: entity.encumbranceDetails,

      // ENHANCED: Use Prisma.JsonNull for metadata
      metadata: metadataJson,

      // System Flags
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  /**
   * ENHANCEMENT: Create update-specific persistence data
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
}
