// src/estate-service/src/domain/entities/factories/asset.factory.ts
import { UniqueEntityID } from '../../base/unique-entity-id';
import {
  FinancialAssetDetailsVO,
  LandAssetDetailsVO,
  VehicleAssetDetailsVO,
} from '../../value-objects/asset-details';
import { Asset } from '../asset.entity';
import { AssetStatus } from '../enums/asset-status.enum';
import { AssetCreatedEvent } from '../events/asset.event';
import { AssetTypeVO } from '../value-objects/asset-type.vo';
import { MoneyVO } from '../value-objects/money.vo';

/**
 * Asset Factory for creating different types of assets
 *
 * Design Pattern: Factory Method
 * Purpose: Centralize asset creation logic, ensure invariants
 */
export class AssetFactory {
  /**
   * Create a new generic asset
   */
  static createGenericAsset(params: {
    assetId: UniqueEntityID;
    estateId: string;
    ownerId: string;
    name: string;
    type: AssetTypeVO;
    value: MoneyVO;
    description?: string;
    createdBy: string;
  }): Asset {
    const asset = new Asset(params.assetId, {
      estateId: params.estateId,
      ownerId: params.ownerId,
      name: params.name,
      type: params.type,
      currentValue: params.value,
      description: params.description,
      status: AssetStatus.PENDING_VERIFICATION,
      isEncumbered: false,
      isActive: true,
      version: 1,
    });

    // Add creation event
    asset.addDomainEvent(
      new AssetCreatedEvent(
        params.assetId.toString(),
        params.estateId,
        params.ownerId,
        params.name,
        params.type,
        params.value,
        params.description,
        params.createdBy,
        1,
      ),
    );

    return asset;
  }

  /**
   * Create a land asset with details
   */
  static createLandAsset(params: {
    assetId: UniqueEntityID;
    estateId: string;
    ownerId: string;
    name: string;
    value: MoneyVO;
    description?: string;
    titleDeedNumber: string;
    landReferenceNumber: string;
    county: string;
    subCounty?: string;
    acreage: number;
    landUse: string;
    registeredOwner: string;
    registrationDate: Date;
    createdBy: string;
  }): Asset {
    const asset = this.createGenericAsset({
      assetId: params.assetId,
      estateId: params.estateId,
      ownerId: params.ownerId,
      name: params.name,
      type: AssetTypeVO.createLand(),
      value: params.value,
      description: params.description,
      createdBy: params.createdBy,
    });

    // Add land details
    const landDetails = new LandAssetDetailsVO({
      titleDeedNumber: params.titleDeedNumber,
      landReferenceNumber: params.landReferenceNumber,
      county: new KenyanCountyVO(params.county),
      subCounty: params.subCounty,
      acreage: params.acreage,
      landUse: params.landUse,
      registeredOwner: params.registeredOwner,
      registrationDate: params.registrationDate,
    });

    // Set details (we'll need to modify Asset entity to accept details)
    // This is a placeholder - we'll implement the actual attachment in Asset entity
    (asset as any).landDetails = landDetails;

    return asset;
  }

  /**
   * Create a vehicle asset with details
   */
  static createVehicleAsset(params: {
    assetId: UniqueEntityID;
    estateId: string;
    ownerId: string;
    name: string;
    value: MoneyVO;
    description?: string;
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    chassisNumber: string;
    engineNumber: string;
    bodyType: string;
    color: string;
    fuelType: string;
    ccRating: number;
    registeredOwner: string;
    registrationDate: Date;
    createdBy: string;
  }): Asset {
    const asset = this.createGenericAsset({
      assetId: params.assetId,
      estateId: params.estateId,
      ownerId: params.ownerId,
      name: params.name,
      type: AssetTypeVO.createVehicle(),
      value: params.value,
      description: params.description,
      createdBy: params.createdBy,
    });

    // Add vehicle details
    const vehicleDetails = new VehicleAssetDetailsVO({
      registrationNumber: params.registrationNumber,
      make: params.make,
      model: params.model,
      year: params.year,
      chassisNumber: params.chassisNumber,
      engineNumber: params.engineNumber,
      bodyType: params.bodyType,
      color: params.color,
      fuelType: params.fuelType,
      ccRating: params.ccRating,
      registeredOwner: params.registeredOwner,
      registrationDate: params.registrationDate,
    });

    (asset as any).vehicleDetails = vehicleDetails;

    return asset;
  }

  /**
   * Create a financial asset with details
   */
  static createFinancialAsset(params: {
    assetId: UniqueEntityID;
    estateId: string;
    ownerId: string;
    name: string;
    value: MoneyVO;
    description?: string;
    institutionName: string;
    accountNumber: string;
    accountType: string;
    branchName?: string;
    accountHolderName: string;
    currency: string;
    interestRate?: number;
    maturityDate?: Date;
    isJointAccount: boolean;
    jointAccountHolders?: string[];
    createdBy: string;
  }): Asset {
    const asset = this.createGenericAsset({
      assetId: params.assetId,
      estateId: params.estateId,
      ownerId: params.ownerId,
      name: params.name,
      type: AssetTypeVO.createFinancial(),
      value: params.value,
      description: params.description,
      createdBy: params.createdBy,
    });

    // Add financial details
    const financialDetails = new FinancialAssetDetailsVO({
      institutionName: params.institutionName,
      accountNumber: params.accountNumber,
      accountType: params.accountType,
      branchName: params.branchName,
      accountHolderName: params.accountHolderName,
      currency: params.currency,
      interestRate: params.interestRate,
      maturityDate: params.maturityDate,
      isJointAccount: params.isJointAccount,
      jointAccountHolders: params.jointAccountHolders,
    });

    (asset as any).financialDetails = financialDetails;

    return asset;
  }

  /**
   * Reconstruct asset from persistence
   */
  static reconstruct(params: {
    assetId: UniqueEntityID;
    estateId: string;
    ownerId: string;
    name: string;
    type: AssetTypeVO;
    currentValue: MoneyVO;
    description?: string;
    status: AssetStatus;
    isEncumbered: boolean;
    encumbranceDetails?: string;
    isActive: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    landDetails?: LandAssetDetailsVO;
    vehicleDetails?: VehicleAssetDetailsVO;
    financialDetails?: FinancialAssetDetailsVO;
  }): Asset {
    return new Asset(params.assetId, {
      estateId: params.estateId,
      ownerId: params.ownerId,
      name: params.name,
      type: params.type,
      currentValue: params.currentValue,
      description: params.description,
      status: params.status,
      isEncumbered: params.isEncumbered,
      encumbranceDetails: params.encumbranceDetails,
      isActive: params.isActive,
      version: params.version,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      deletedAt: params.deletedAt,
      landDetails: params.landDetails,
      vehicleDetails: params.vehicleDetails,
      financialDetails: params.financialDetails,
    });
  }
}
