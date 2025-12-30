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
import { KenyanCountyVO } from '../../../domain/value-objects/kenyan-county.vo';
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
    if (!prismaAsset) throw new Error('Cannot map null Prisma Asset to Domain');

    const {
      id,
      estateId,
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

    const currentValue = MoneyVO.create({
      amount: Number(currentValueAmount),
      currency: currentValueCurrency || 'KES',
    });

    const assetType = this.mapToDomainAssetType(type);

    // Map details
    const assetDetails = this.mapAssetDetails(assetType, {
      landDetails,
      vehicleDetails,
      financialDetails,
      businessDetails,
    });

    const coOwnership = this.mapCoOwnershipStructure(
      coOwners,
      coOwnershipType,
      totalSharePercentage,
    );

    const mappedValuations = this.valuationMapper.toDomainList(valuations);
    const liquidation = this.mapActiveLiquidation(assetLiquidations);

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
    return {
      id: asset.id.toString(),
      estateId: asset.estateId,
      ownerId: asset.estateId,
      name: asset.name,
      description: asset.description || null,
      location: asset.location || null,
      type: this.mapToPrismaAssetType(asset.type),
      status: this.mapToPrismaAssetStatus(asset.status),
      currentValueAmount: asset.currentValue.amount,
      currentValueCurrency: asset.currentValue.currency,
      isEncumbered: asset.isEncumbered,
      encumbranceDetails: asset.encumbranceDetails || null,
      coOwnershipType: asset.coOwnership?.ownershipType
        ? this.mapToPrismaCoOwnershipType(asset.coOwnership.ownershipType)
        : null,
      totalSharePercentage: asset.coOwnership?.totalSharePercentage || null,
      purchaseDate: asset.purchaseDate || null,
      sourceOfFunds: asset.sourceOfFunds || null,
      isVerified: asset.isVerified,
    };
  }

  /**
   * [ADDED] Convert List of Prisma Objects to Domain Entities
   * This fixes the "Property 'toDomainList' does not exist" error in EstateMapper
   */
  toDomainList(prismaAssets: any[]): Asset[] {
    if (!prismaAssets) return [];
    return prismaAssets
      .map((asset) => {
        try {
          return this.toDomain(asset);
        } catch (e) {
          console.error(`Failed to map asset ${asset.id}:`, e);
          return null;
        }
      })
      .filter((asset): asset is Asset => asset !== null);
  }

  /**
   * [ADDED] Convert List of Domain Entities to Persistence Objects
   */
  toPersistenceList(assets: Asset[]): any[] {
    return assets.map((a) => this.toPersistence(a));
  }

  // --- MAPPING HELPERS ---

  private mapAssetDetails(assetType: AssetTypeVO, details: any): any {
    switch (assetType.value) {
      case 'LAND':
        if (details.landDetails) {
          return {
            landDetails: LandAssetDetailsVO.create({
              titleDeedNumber: details.landDetails.titleDeedNumber,
              landReferenceNumber: details.landDetails.landReferenceNumber || 'UNKNOWN',
              county: new KenyanCountyVO(details.landDetails.county),
              subCounty: details.landDetails.subCounty,
              locationDescription: details.landDetails.locationDescription,
              acreage: Number(details.landDetails.acreage),
              landUse: details.landDetails.landUse || 'RESIDENTIAL',
              registeredOwner: details.landDetails.registeredOwner || 'UNKNOWN',
              registrationDate: details.landDetails.registrationDate
                ? new Date(details.landDetails.registrationDate)
                : undefined,
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
              year: Number(details.vehicleDetails.year),
              chassisNumber: details.vehicleDetails.chassisNumber,
              engineNumber: details.vehicleDetails.engineNumber,
              color: details.vehicleDetails.color,
              logbookNumber: details.vehicleDetails.logbookNumber,
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
              branchName: details.financialDetails.branchName,
              accountHolderName: details.financialDetails.accountHolderName || 'Unknown',
              currency: details.financialDetails.currency || 'KES',
              interestRate: details.financialDetails.interestRate
                ? Number(details.financialDetails.interestRate)
                : undefined,
              isJointAccount: !!details.financialDetails.isJointAccount,
              jointAccountHolders: details.financialDetails.jointAccountHolders || [],
            }),
          };
        }
        break;

      case 'BUSINESS':
        if (details.businessDetails) {
          return {
            businessDetails: BusinessAssetDetailsVO.create({
              businessName: details.businessDetails.businessName,
              registrationNumber: details.businessDetails.registrationNumber,
              shareholdingPercentage: Number(
                details.businessDetails.sharePercentage ||
                  details.businessDetails.shareholdingPercentage,
              ),
              businessType: details.businessDetails.businessType || 'LIMITED_COMPANY',
              numberOfShares: details.businessDetails.numberOfShares,
              registeredAddress: details.businessDetails.registeredAddress,
            }),
          };
        }
        break;
    }
    return {};
  }

  private mapToDomainAssetType(prismaType: string): AssetTypeVO {
    try {
      return new AssetTypeVO(prismaType);
    } catch {
      return AssetTypeVO.createOther();
    }
  }

  private mapToDomainAssetStatus(status: string): AssetStatus {
    return status as AssetStatus;
  }

  private mapToPrismaAssetStatus(status: AssetStatus): string {
    return status;
  }

  private mapToPrismaCoOwnershipType(type: CoOwnershipType): string {
    return type;
  }

  private mapToPrismaAssetType(type: AssetTypeVO): string {
    const mapping: any = {
      LAND: 'LAND_PARCEL',
      FINANCIAL: 'FINANCIAL_ASSET',
      BUSINESS: 'BUSINESS_INTEREST',
      DIGITAL: 'DIGITAL_ASSET',
      VEHICLE: 'VEHICLE',
      INTELLECTUAL_PROPERTY: 'INTELLECTUAL_PROPERTY',
      LIVESTOCK: 'LIVESTOCK',
      PERSONAL_EFFECTS: 'PERSONAL_EFFECTS',
      OTHER: 'OTHER',
    };
    return mapping[type.value] || type.value;
  }

  private mapActiveLiquidation(liquidations: any[]) {
    if (!liquidations || liquidations.length === 0) return undefined;
    const active = liquidations.filter((l) =>
      ['IN_PROGRESS', 'PENDING', 'APPROVED', 'LISTED_FOR_SALE', 'AUCTION_SCHEDULED'].includes(
        l.status,
      ),
    );
    if (active.length === 0) return undefined;

    active.sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime());

    return this.liquidationMapper.toDomain(active[0]);
  }

  private mapCoOwnershipStructure(coOwners: any[], type: string | null, total: number | null) {
    if (!coOwners || coOwners.length === 0) return undefined;
    const mapped = this.coOwnerMapper.toDomainList(coOwners);
    return {
      coOwners: mapped,
      ownershipType: type ? (type as CoOwnershipType) : CoOwnershipType.TENANCY_IN_COMMON,
      totalSharePercentage:
        total !== null ? Number(total) : mapped.reduce((s, c) => s + c.sharePercentage, 0),
    };
  }
  /**
   * Prepare polymorphic asset details for Prisma create/update
   */
  prepareAssetDetailsForPersistence(asset: Asset): {
    landDetails?: any;
    vehicleDetails?: any;
    financialDetails?: any;
    businessDetails?: any;
  } {
    const details: any = {};

    switch (asset.type.value) {
      case 'LAND':
        if (asset.landDetails) {
          // Prisma syntax for nested create
          details.landDetails = {
            create: {
              titleDeedNumber: asset.landDetails.toJSON().titleDeedNumber,
              landReferenceNumber: asset.landDetails.toJSON().landReferenceNumber,
              parcelNumber: asset.landDetails.toJSON().parcelNumber,
              county: asset.landDetails.toJSON().county?.name || 'NAIROBI', // Extract primitive
              subCounty: asset.landDetails.toJSON().subCounty,
              locationDescription: asset.landDetails.toJSON().locationDescription,
              acreage: asset.landDetails.toJSON().acreage,
              landUse: asset.landDetails.toJSON().landUse,
              registeredOwner: asset.landDetails.toJSON().registeredOwner,
              registrationDate: asset.landDetails.toJSON().registrationDate,
            },
          };
        }
        break;

      case 'VEHICLE':
        if (asset.vehicleDetails) {
          details.vehicleDetails = {
            create: asset.vehicleDetails.toJSON(),
          };
        }
        break;

      case 'FINANCIAL':
        if (asset.financialDetails) {
          details.financialDetails = {
            create: asset.financialDetails.toJSON(),
          };
        }
        break;

      case 'BUSINESS':
        if (asset.businessDetails) {
          const bizJson = asset.businessDetails.toJSON();
          details.businessDetails = {
            create: {
              businessName: bizJson.businessName,
              registrationNumber: bizJson.registrationNumber,
              sharePercentage: bizJson.shareholdingPercentage, // Map name difference
              businessType: bizJson.businessType,
              numberOfShares: bizJson.numberOfShares,
              registeredAddress: bizJson.registeredAddress,
            },
          };
        }
        break;
    }

    return details;
  }

  /**
   * Prepare co-owners list for Prisma
   */
  prepareCoOwnersForPersistence(asset: Asset): any {
    if (!asset.coOwnership || asset.coOwnership.coOwners.length === 0) {
      return {};
    }

    return {
      coOwners: {
        create: asset.coOwnership.coOwners.map((coOwner) =>
          this.coOwnerMapper.toPersistence(coOwner),
        ),
      },
    };
  }

  /**
   * Prepare valuations history for Prisma
   */
  prepareValuationsForPersistence(asset: Asset): any {
    if (asset.valuations.length === 0) {
      return {};
    }

    return {
      valuations: {
        create: asset.valuations.map((valuation) => this.valuationMapper.toPersistence(valuation)),
      },
    };
  }
}
