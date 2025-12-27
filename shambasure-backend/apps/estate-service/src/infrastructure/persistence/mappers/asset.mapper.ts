// src/estate-service/src/infrastructure/persistence/mappers/asset.mapper.ts
import { Injectable } from '@nestjs/common';
import { Asset as PrismaAsset } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { Asset } from '../../../domain/entities/asset.entity';
import { AssetStatus } from '../../../domain/enums/asset-status.enum';
import { CoOwnershipType } from '../../../domain/enums/co-ownership-type.enum';
import {
  BusinessAssetDetailsVO,
  FinancialAssetDetailsVO,
  LandAssetDetailsVO,
  VehicleAssetDetailsVO,
} from '../../../domain/value-objects/asset-details';
import { AssetTypeVO } from '../../../domain/value-objects/asset-type.vo';
import { MoneyVO } from '../../../domain/value-objects/money.vo';
import { AssetCoOwnerMapper } from './asset-co-owner.mapper';
import { AssetLiquidationMapper } from './asset-liquidation.mapper';
import { AssetValuationMapper } from './asset-valuation.mapper';

@Injectable()
export class AssetMapper {
  constructor(
    private readonly coOwnerMapper: AssetCoOwnerMapper,
    private readonly valuationMapper: AssetValuationMapper,
    private readonly liquidationMapper: AssetLiquidationMapper,
  ) {}

  /**
   * Convert Prisma model to Domain Entity
   */
  toDomain(
    prismaAsset: PrismaAsset & {
      landDetails?: any;
      vehicleDetails?: any;
      financialDetails?: any;
      businessDetails?: any;
      valuations?: any[];
      coOwners?: any[];
      assetLiquidations?: any[];
    },
  ): Asset {
    if (!prismaAsset) return null;

    const {
      id,
      estateId,
      ownerId,
      name,
      description,
      location,
      type,
      status,
      currentValueAmount,
      currentValueCurrency,
      isEncumbered,
      encumbranceDetails,
      coOwnershipType,
      totalSharePercentage,
      purchaseDate,
      sourceOfFunds,
      isVerified,
      landDetails,
      vehicleDetails,
      financialDetails,
      businessDetails,
      valuations = [],
      coOwners = [],
      assetLiquidations = [],
    } = prismaAsset;

    // Map current value
    const currentValue = MoneyVO.create({
      amount: Number(currentValueAmount),
      currency: currentValueCurrency || 'KES',
    });

    // Map asset type
    const assetType = this.mapToDomainAssetType(type);

    // Map asset details based on type
    const assetDetails = this.mapAssetDetails(assetType, {
      landDetails,
      vehicleDetails,
      financialDetails,
      businessDetails,
    });

    // Map co-ownership structure
    const coOwnership = this.mapCoOwnershipStructure(
      coOwners,
      coOwnershipType,
      totalSharePercentage,
    );

    // Map valuations
    const mappedValuations = this.valuationMapper.toDomainList(valuations);

    // Map active liquidation
    const liquidation = this.mapActiveLiquidation(assetLiquidations);

    // Create AssetProps
    const assetProps = {
      estateId,
      name,
      type: assetType,
      currentValue,
      description: description || undefined,
      status: this.mapToDomainAssetStatus(status),
      isEncumbered,
      encumbranceDetails: encumbranceDetails || undefined,
      ...assetDetails,
      coOwnership,
      valuations: mappedValuations,
      liquidation,
      location: location || undefined,
      purchaseDate: purchaseDate || undefined,
      sourceOfFunds: sourceOfFunds || undefined,
      isVerified,
    };

    return Asset.create(assetProps, new UniqueEntityID(id));
  }

  /**
   * Convert Domain Entity to Prisma model
   */
  toPersistence(asset: Asset): any {
    const props = asset.getProps();

    return {
      id: asset.id.toString(),
      estateId: props.estateId,
      ownerId: props.estateId, // Using estateId as ownerId for now
      name: props.name,
      description: props.description || null,
      location: props.location || null,
      type: this.mapToPrismaAssetType(props.type),
      status: this.mapToPrismaAssetStatus(props.status),
      currentValueAmount: props.currentValue.amount,
      currentValueCurrency: props.currentValue.currency,
      isEncumbered: props.isEncumbered,
      encumbranceDetails: props.encumbranceDetails || null,
      coOwnershipType: props.coOwnership?.ownershipType
        ? this.mapToPrismaCoOwnershipType(props.coOwnership.ownershipType)
        : null,
      totalSharePercentage: props.coOwnership?.totalSharePercentage || null,
      purchaseDate: props.purchaseDate || null,
      sourceOfFunds: props.sourceOfFunds || null,
      isVerified: props.isVerified,
    };
  }

  /**
   * Map asset details based on asset type (Strategy Pattern)
   */
  private mapAssetDetails(
    assetType: AssetTypeVO,
    details: {
      landDetails?: any;
      vehicleDetails?: any;
      financialDetails?: any;
      businessDetails?: any;
    },
  ): {
    landDetails?: LandAssetDetailsVO;
    vehicleDetails?: VehicleAssetDetailsVO;
    financialDetails?: FinancialAssetDetailsVO;
    businessDetails?: BusinessAssetDetailsVO;
  } {
    switch (assetType.value) {
      case 'LAND':
        if (details.landDetails) {
          return {
            landDetails: LandAssetDetailsVO.create({
              titleDeedNumber: details.landDetails.titleDeedNumber,
              parcelNumber: details.landDetails.parcelNumber || undefined,
              county: details.landDetails.county,
              subCounty: details.landDetails.subCounty || undefined,
              acreage: details.landDetails.acreage,
              landUse: details.landDetails.landUse || undefined,
            }),
          };
        }
        break;

      case 'VEHICLE':
        if (details.vehicleDetails) {
          return {
            vehicleDetails: VehicleAssetDetailsVO.create({
              registrationNumber: details.vehicleDetails.registrationNumber,
              make: details.vehicleDetails.make,
              model: details.vehicleDetails.model,
              chassisNumber: details.vehicleDetails.chassisNumber || undefined,
            }),
          };
        }
        break;

      case 'FINANCIAL':
        if (details.financialDetails) {
          return {
            financialDetails: FinancialAssetDetailsVO.create({
              institutionName: details.financialDetails.institutionName,
              accountNumber: details.financialDetails.accountNumber,
              accountType: details.financialDetails.accountType,
              branchName: details.financialDetails.branchName || undefined,
            }),
          };
        }
        break;

      case 'BUSINESS':
        if (details.businessDetails) {
          return {
            businessDetails: BusinessAssetDetailsVO.create({
              businessName: details.businessDetails.businessName,
              registrationNumber: details.businessDetails.registrationNumber || undefined,
              sharePercentage: details.businessDetails.sharePercentage,
            }),
          };
        }
        break;
    }

    return {};
  }

  /**
   * Map co-ownership structure
   */
  private mapCoOwnershipStructure(
    coOwners: any[],
    ownershipType: string | null,
    totalSharePercentage: number | null,
  ) {
    if (!coOwners || coOwners.length === 0) {
      return undefined;
    }

    const mappedCoOwners = this.coOwnerMapper.toDomainList(coOwners);

    return {
      coOwners: mappedCoOwners,
      ownershipType: ownershipType
        ? this.mapToDomainCoOwnershipType(ownershipType)
        : mappedCoOwners[0]?.ownershipType || CoOwnershipType.TENANCY_IN_COMMON,
      totalSharePercentage:
        totalSharePercentage || mappedCoOwners.reduce((sum, co) => sum + co.sharePercentage, 0),
    };
  }

  /**
   * Map active liquidation
   */
  private mapActiveLiquidation(liquidations: any[]) {
    if (!liquidations || liquidations.length === 0) {
      return undefined;
    }

    // Get the most recent active liquidation
    const activeLiquidations = liquidations.filter((l) =>
      ['IN_PROGRESS', 'PENDING', 'APPROVED'].includes(l.status),
    );

    if (activeLiquidations.length === 0) {
      return undefined;
    }

    // Sort by initiatedAt (newest first) and take the first
    const latestLiquidation = activeLiquidations.sort(
      (a, b) => new Date(b.initiatedAt || 0).getTime() - new Date(a.initiatedAt || 0).getTime(),
    )[0];

    return this.liquidationMapper.toDomain(latestLiquidation);
  }

  /**
   * Map Prisma asset type to Domain AssetTypeVO
   */
  private mapToDomainAssetType(prismaType: string): AssetTypeVO {
    switch (prismaType) {
      case 'LAND_PARCEL':
        return AssetTypeVO.createLand();
      case 'PROPERTY':
        return AssetTypeVO.createLand(); // Properties are also land
      case 'VEHICLE':
        return AssetTypeVO.createVehicle();
      case 'FINANCIAL_ASSET':
        return AssetTypeVO.createFinancial();
      case 'BUSINESS_INTEREST':
        return AssetTypeVO.createBusiness();
      case 'DIGITAL_ASSET':
        return AssetTypeVO.createDigital();
      case 'INTELLECTUAL_PROPERTY':
        return AssetTypeVO.createIntellectualProperty();
      case 'LIVESTOCK':
        return AssetTypeVO.createLivestock();
      case 'PERSONAL_EFFECTS':
        return AssetTypeVO.createPersonalEffects();
      case 'OTHER':
        return AssetTypeVO.createOther();
      default:
        throw new Error(`Unknown asset type: ${prismaType}`);
    }
  }

  /**
   * Map Domain AssetTypeVO to Prisma asset type
   */
  private mapToPrismaAssetType(assetType: AssetTypeVO): string {
    switch (assetType.value) {
      case 'LAND':
        return 'LAND_PARCEL';
      case 'VEHICLE':
        return 'VEHICLE';
      case 'FINANCIAL':
        return 'FINANCIAL_ASSET';
      case 'BUSINESS':
        return 'BUSINESS_INTEREST';
      case 'DIGITAL':
        return 'DIGITAL_ASSET';
      case 'INTELLECTUAL_PROPERTY':
        return 'INTELLECTUAL_PROPERTY';
      case 'LIVESTOCK':
        return 'LIVESTOCK';
      case 'PERSONAL_EFFECTS':
        return 'PERSONAL_EFFECTS';
      case 'OTHER':
        return 'OTHER';
      default:
        throw new Error(`Unknown asset type: ${assetType.value}`);
    }
  }

  /**
   * Map Prisma asset status to Domain enum
   */
  private mapToDomainAssetStatus(prismaStatus: string): AssetStatus {
    switch (prismaStatus) {
      case 'ACTIVE':
        return AssetStatus.ACTIVE;
      case 'VERIFIED':
        return AssetStatus.VERIFIED;
      case 'FROZEN':
        return AssetStatus.FROZEN;
      case 'LIQUIDATING':
        return AssetStatus.LIQUIDATING;
      case 'LIQUIDATED':
        return AssetStatus.LIQUIDATED;
      case 'TRANSFERRED':
        return AssetStatus.TRANSFERRED;
      case 'DISPUTED':
        return AssetStatus.DISPUTED;
      default:
        throw new Error(`Unknown asset status: ${prismaStatus}`);
    }
  }

  /**
   * Map Domain asset status to Prisma enum
   */
  private mapToPrismaAssetStatus(domainStatus: AssetStatus): string {
    switch (domainStatus) {
      case AssetStatus.ACTIVE:
        return 'ACTIVE';
      case AssetStatus.VERIFIED:
        return 'VERIFIED';
      case AssetStatus.FROZEN:
        return 'FROZEN';
      case AssetStatus.LIQUIDATING:
        return 'LIQUIDATING';
      case AssetStatus.LIQUIDATED:
        return 'LIQUIDATED';
      case AssetStatus.TRANSFERRED:
        return 'TRANSFERRED';
      case AssetStatus.DISPUTED:
        return 'DISPUTED';
      default:
        throw new Error(`Unknown asset status: ${domainStatus}`);
    }
  }

  /**
   * Map Prisma co-ownership type to Domain enum
   */
  private mapToDomainCoOwnershipType(prismaType: string): CoOwnershipType {
    switch (prismaType) {
      case 'JOINT_TENANCY':
        return CoOwnershipType.JOINT_TENANCY;
      case 'TENANCY_IN_COMMON':
        return CoOwnershipType.TENANCY_IN_COMMON;
      default:
        throw new Error(`Unknown co-ownership type: ${prismaType}`);
    }
  }

  /**
   * Map Domain co-ownership type to Prisma enum
   */
  private mapToPrismaCoOwnershipType(domainType: CoOwnershipType): string {
    switch (domainType) {
      case CoOwnershipType.JOINT_TENANCY:
        return 'JOINT_TENANCY';
      case CoOwnershipType.TENANCY_IN_COMMON:
        return 'TENANCY_IN_COMMON';
      default:
        throw new Error(`Unknown co-ownership type: ${domainType}`);
    }
  }

  /**
   * Prepare asset details for persistence based on asset type
   */
  prepareAssetDetailsForPersistence(asset: Asset): {
    landDetails?: any;
    vehicleDetails?: any;
    financialDetails?: any;
    businessDetails?: any;
  } {
    const props = asset.getProps();
    const details: any = {};

    switch (props.type.value) {
      case 'LAND':
        if (props.landDetails) {
          details.landDetails = {
            create: {
              titleDeedNumber: props.landDetails.titleDeedNumber,
              parcelNumber: props.landDetails.parcelNumber,
              county: props.landDetails.county,
              subCounty: props.landDetails.subCounty,
              acreage: props.landDetails.acreage,
              landUse: props.landDetails.landUse,
            },
          };
        }
        break;

      case 'VEHICLE':
        if (props.vehicleDetails) {
          details.vehicleDetails = {
            create: {
              registrationNumber: props.vehicleDetails.registrationNumber,
              make: props.vehicleDetails.make,
              model: props.vehicleDetails.model,
              chassisNumber: props.vehicleDetails.chassisNumber,
            },
          };
        }
        break;

      case 'FINANCIAL':
        if (props.financialDetails) {
          details.financialDetails = {
            create: {
              institutionName: props.financialDetails.institutionName,
              accountNumber: props.financialDetails.accountNumber,
              accountType: props.financialDetails.accountType,
              branchName: props.financialDetails.branchName,
            },
          };
        }
        break;

      case 'BUSINESS':
        if (props.businessDetails) {
          details.businessDetails = {
            create: {
              businessName: props.businessDetails.businessName,
              registrationNumber: props.businessDetails.registrationNumber,
              sharePercentage: props.businessDetails.sharePercentage,
            },
          };
        }
        break;
    }

    return details;
  }

  /**
   * Prepare co-owners for persistence
   */
  prepareCoOwnersForPersistence(asset: Asset): any {
    const props = asset.getProps();

    if (!props.coOwnership || props.coOwnership.coOwners.length === 0) {
      return {};
    }

    return {
      coOwners: {
        create: props.coOwnership.coOwners.map((coOwner) =>
          this.coOwnerMapper.toPersistence(coOwner),
        ),
      },
    };
  }

  /**
   * Prepare valuations for persistence
   */
  prepareValuationsForPersistence(asset: Asset): any {
    const props = asset.getProps();

    if (props.valuations.length === 0) {
      return {};
    }

    return {
      valuations: {
        create: props.valuations.map((valuation) => this.valuationMapper.toPersistence(valuation)),
      },
    };
  }

  /**
   * Get asset summary for reporting
   */
  getAssetSummary(asset: Asset): {
    id: string;
    name: string;
    type: string;
    currentValue: number;
    distributableValue: number;
    isTransferable: boolean;
    requiresRegistryTransfer: boolean;
    status: string;
  } {
    const props = asset.getProps();

    return {
      id: asset.id.toString(),
      name: props.name,
      type: props.type.value,
      currentValue: props.currentValue.amount,
      distributableValue: asset.getDistributableValue().amount,
      isTransferable: asset.isTransferable(),
      requiresRegistryTransfer: asset.requiresRegistryTransfer(),
      status: props.status,
    };
  }

  /**
   * Filter assets by transferability
   */
  filterTransferableAssets(assets: Asset[]): Asset[] {
    return assets.filter((asset) => asset.isTransferable());
  }

  /**
   * Get total value of assets
   */
  getTotalValue(assets: Asset[], includeOnlyTransferable: boolean = false): MoneyVO {
    const filteredAssets = includeOnlyTransferable ? this.filterTransferableAssets(assets) : assets;

    if (filteredAssets.length === 0) {
      return MoneyVO.zero('KES');
    }

    return filteredAssets.reduce((total, asset) => {
      const props = asset.getProps();
      return total.add(props.currentValue);
    }, MoneyVO.zero('KES'));
  }

  /**
   * Get total distributable value of assets
   */
  getTotalDistributableValue(assets: Asset[]): MoneyVO {
    if (assets.length === 0) {
      return MoneyVO.zero('KES');
    }

    return assets.reduce((total, asset) => {
      return total.add(asset.getDistributableValue());
    }, MoneyVO.zero('KES'));
  }
}
