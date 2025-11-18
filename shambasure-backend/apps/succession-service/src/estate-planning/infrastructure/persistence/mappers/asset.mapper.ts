import { AssetType, AssetOwnershipType } from '@prisma/client';
import { Asset } from '../../../domain/entities/asset.entity';
import { AssetValue } from '../../../domain/value-objects/asset-value.vo';
import { LandParcel } from '../../../domain/value-objects/land-parcel.vo';

export class AssetMapper {
  static toDomain(prismaAsset: any): Asset {
    if (!prismaAsset) return null;

    // Create AssetValue
    const currentValue = new AssetValue(
      prismaAsset.estimatedValue?.toNumber() || 0,
      prismaAsset.currency,
      prismaAsset.valuationDate,
    );

    const asset = new Asset(
      prismaAsset.id,
      prismaAsset.name,
      prismaAsset.type as AssetType,
      prismaAsset.ownerId,
      currentValue,
      prismaAsset.createdAt,
      prismaAsset.updatedAt,
    );

    // Set additional properties
    Object.assign(asset, {
      description: prismaAsset.description,
      ownershipType: prismaAsset.ownershipType as AssetOwnershipType,
      ownershipShare: prismaAsset.ownershipShare?.toNumber() || 100,
      location: prismaAsset.location,
      identification: prismaAsset.identificationDetails,
      hasVerifiedDocument: prismaAsset.hasVerifiedDocument,
      isEncumbered: prismaAsset.isEncumbered,
      encumbranceDetails: prismaAsset.encumbranceDetails,
      metadata: prismaAsset.metadata,
      isActive: prismaAsset.isActive,
      deletedAt: prismaAsset.deletedAt,
    });

    return asset;
  }

  static toPersistence(asset: Asset): any {
    return {
      id: asset.getId(),
      name: asset.getName(),
      description: asset.getDescription(),
      type: asset.getType(),
      ownerId: asset.getOwnerId(),
      ownershipType: asset.getOwnershipType(),
      ownershipShare: asset.getOwnershipShare(),
      estimatedValue: asset.getCurrentValue().getAmount(),
      currency: asset.getCurrentValue().getCurrency(),
      valuationDate: asset.getCurrentValue().getValuationDate(),
      location: asset.getLocation(),
      identificationDetails: asset.getIdentification(),
      hasVerifiedDocument: asset.getHasVerifiedDocument(),
      isEncumbered: asset.getIsEncumbered(),
      encumbranceDetails: asset.getEncumbranceDetails(),
      metadata: asset.getMetadata(),
      isActive: asset.getIsActive(),
      createdAt: asset.getCreatedAt(),
      updatedAt: asset.getUpdatedAt(),
      deletedAt: asset.getDeletedAt(),
    };
  }

  static toDomainList(prismaAssets: any[]): Asset[] {
    return prismaAssets.map((asset) => this.toDomain(asset)).filter(Boolean);
  }

  // Specialized mappers for different asset types
  static toLandParcel(prismaAsset: any): LandParcel | null {
    if (!prismaAsset || prismaAsset.type !== AssetType.LAND_PARCEL) {
      return null;
    }

    try {
      return new LandParcel(
        prismaAsset.identificationDetails?.titleNumber,
        prismaAsset.location,
        prismaAsset.metadata?.size || 0,
        prismaAsset.identificationDetails?.landReference,
      );
    } catch (error) {
      console.warn('Failed to map land parcel:', error);
      return null;
    }
  }
}
