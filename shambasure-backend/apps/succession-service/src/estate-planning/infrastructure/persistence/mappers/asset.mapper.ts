import { Asset as PrismaAsset, Prisma } from '@prisma/client';
import { Asset } from '../../../domain/entities/asset.entity';
import { AssetValue } from '../../../domain/value-objects/asset-value.vo';
import {
  AssetLocation,
  AssetIdentification,
  AssetReconstituteProps,
} from '../../../domain/entities/asset.entity';

export class AssetMapper {
  /**
   * Converts Domain Entity to Prisma Database Model
   */
  static toPersistence(asset: Asset): PrismaAsset {
    const value = asset.getCurrentValue();
    const location = asset.getLocation();
    const identification = asset.getIdentification();

    return {
      id: asset.getId(),
      name: asset.getName(),
      description: asset.getDescription() || '',
      type: asset.getType(),
      ownerId: asset.getOwnerId(),
      ownershipType: asset.getOwnershipType(),
      ownershipShare:
        asset.getOwnershipShare() !== null && asset.getOwnershipShare() !== undefined
          ? new Prisma.Decimal(asset.getOwnershipShare())
          : null,

      estimatedValue:
        value.getAmount() !== null && value.getAmount() !== undefined
          ? new Prisma.Decimal(value.getAmount())
          : null,
      currency: value.getCurrency(),
      valuationDate: value.getValuationDate(),
      valuationSource: 'SYSTEM_USER_INPUT',

      // Safe JSON serialization with proper typing
      location: location ? this.serializeToJsonValue(location) : null,
      identificationDetails: identification ? this.serializeToJsonValue(identification) : null,
      registrationNumber: identification?.registrationNumber || null,

      hasVerifiedDocument: asset.getHasVerifiedDocument(),
      isEncumbered: asset.getIsEncumbered(),
      encumbranceDetails: asset.getEncumbranceDetails(),

      metadata: null,
      isActive: asset.getIsActive(),
      createdAt: asset.getCreatedAt(),
      updatedAt: asset.getUpdatedAt(),
      deletedAt: asset.getDeletedAt(),
    } as PrismaAsset;
  }

  /**
   * Safely serialize domain objects to Prisma JsonValue
   */
  private static serializeToJsonValue(obj: any): Prisma.JsonValue {
    // Convert to plain object that satisfies JsonValue constraints
    return JSON.parse(JSON.stringify(obj)) as Prisma.JsonValue;
  }

  /**
   * Converts Prisma Model to Domain Entity
   */
  static toDomain(raw: PrismaAsset): Asset {
    const ownershipShare = raw.ownershipShare ? Number(raw.ownershipShare) : 100;
    const estimatedValue = raw.estimatedValue ? Number(raw.estimatedValue) : 0;

    const value = new AssetValue(estimatedValue, raw.currency, raw.valuationDate || new Date());

    const location = this.parseLocation(raw.location);
    const identification = this.parseIdentification(raw.identificationDetails);

    const reconstituteProps: AssetReconstituteProps = {
      id: raw.id,
      name: raw.name,
      description: raw.description || '',
      type: raw.type,
      ownerId: raw.ownerId,
      ownershipType: raw.ownershipType,
      ownershipShare: ownershipShare,
      currentValue: value,
      location: location,
      identification: identification,
      hasVerifiedDocument: raw.hasVerifiedDocument,
      isEncumbered: raw.isEncumbered,
      encumbranceDetails: raw.encumbranceDetails,
      encumbranceAmount: 0, // You'll need to add this field to Prisma schema
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };

    return Asset.reconstitute(reconstituteProps);
  }

  /**
   * Safely parse location JSON with type checking
   */
  private static parseLocation(locationData: Prisma.JsonValue): AssetLocation | null {
    if (!locationData || typeof locationData !== 'object') {
      return null;
    }

    const location = locationData as Record<string, unknown>;

    return {
      county: typeof location.county === 'string' ? location.county : '',
      subCounty: typeof location.subCounty === 'string' ? location.subCounty : undefined,
      ward: typeof location.ward === 'string' ? location.ward : undefined,
      village: typeof location.village === 'string' ? location.village : undefined,
      gpsCoordinates: this.parseGpsCoordinates(location.gpsCoordinates),
    };
  }

  /**
   * Safely parse GPS coordinates
   */
  private static parseGpsCoordinates(
    gpsData: unknown,
  ): { latitude: number; longitude: number } | undefined {
    if (!gpsData || typeof gpsData !== 'object') {
      return undefined;
    }

    const coords = gpsData as Record<string, unknown>;
    const latitude = typeof coords.latitude === 'number' ? coords.latitude : undefined;
    const longitude = typeof coords.longitude === 'number' ? coords.longitude : undefined;

    if (latitude !== undefined && longitude !== undefined) {
      return { latitude, longitude };
    }

    return undefined;
  }

  /**
   * Safely parse identification JSON with type checking
   */
  private static parseIdentification(
    identificationData: Prisma.JsonValue,
  ): AssetIdentification | null {
    if (!identificationData || typeof identificationData !== 'object') {
      return null;
    }

    const identification = identificationData as Record<string, unknown>;

    return {
      registrationNumber:
        typeof identification.registrationNumber === 'string'
          ? identification.registrationNumber
          : undefined,
      serialNumber:
        typeof identification.serialNumber === 'string' ? identification.serialNumber : undefined,
      accountNumber:
        typeof identification.accountNumber === 'string' ? identification.accountNumber : undefined,
      parcelNumber:
        typeof identification.parcelNumber === 'string' ? identification.parcelNumber : undefined,
      vehicleRegistration:
        typeof identification.vehicleRegistration === 'string'
          ? identification.vehicleRegistration
          : undefined,
      otherIdentifiers: this.parseOtherIdentifiers(identification.otherIdentifiers),
    };
  }

  /**
   * Safely parse other identifiers
   */
  private static parseOtherIdentifiers(
    identifiersData: unknown,
  ): Record<string, string> | undefined {
    if (!identifiersData || typeof identifiersData !== 'object') {
      return undefined;
    }

    const result: Record<string, string> = {};
    const identifiers = identifiersData as Record<string, unknown>;

    Object.entries(identifiers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result[key] = value;
      }
    });

    return Object.keys(result).length > 0 ? result : undefined;
  }
}
