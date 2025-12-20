// src/domain/value-objects/asset-details.vo.ts
import { ValueObject } from '../../../base/value-object';
import { Guard } from '../../../core/guard';
import { Result } from '../../../core/result';
import { KenyanId } from '../../../shared/kenyan-id.vo';
import { KenyanLocation } from '../../../shared/kenyan-location.vo';

// Enums
export enum AssetType {
  LAND_PARCEL = 'LAND_PARCEL',
  PROPERTY = 'PROPERTY',
  FINANCIAL_ASSET = 'FINANCIAL_ASSET',
  DIGITAL_ASSET = 'DIGITAL_ASSET',
  BUSINESS_INTEREST = 'BUSINESS_INTEREST',
  VEHICLE = 'VEHICLE',
  INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY',
  LIVESTOCK = 'LIVESTOCK',
  PERSONAL_EFFECTS = 'PERSONAL_EFFECTS',
  OTHER = 'OTHER',
}

export enum LandUseType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  AGRICULTURAL = 'AGRICULTURAL',
  INDUSTRIAL = 'INDUSTRIAL',
  MIXED_USE = 'MIXED_USE',
  CONSERVATION = 'CONSERVATION',
}

export enum FinancialAccountType {
  SAVINGS = 'SAVINGS',
  CURRENT = 'CURRENT',
  FIXED_DEPOSIT = 'FIXED_DEPOSIT',
  SACCO_SHARES = 'SACCO_SHARES',
  INVESTMENT = 'INVESTMENT',
  PENSION = 'PENSION',
}

// Base polymorphic asset details
export interface BaseAssetProps {
  type: AssetType;
}

export abstract class AssetDetails extends ValueObject<BaseAssetProps> {
  protected constructor(props: BaseAssetProps) {
    super(props);
  }

  // ValueObject base class calls this automatically in constructor
  protected validate(): void {
    if (!this._value.type) {
      throw new Error('Asset type is required');
    }
  }

  // Abstract method for specific result-based validation called by factories/services
  abstract validateBusinessRules(): Result<void>;

  get type(): AssetType {
    return this._value.type;
  }
}

// --- Land Asset Details ---

export interface LandAssetProps extends BaseAssetProps {
  titleDeedNumber: string;
  parcelNumber: string;
  landReferenceNumber: string | null;
  acreage: number;
  location: KenyanLocation;
  landUse: LandUseType;
}

export class LandAssetDetails extends AssetDetails {
  // Use 'declare' to narrow the type of _value from the base class
  declare protected readonly _value: LandAssetProps;

  private constructor(props: LandAssetProps) {
    super(props);
  }

  public static create(props: {
    titleDeedNumber: string;
    parcelNumber: string;
    landReferenceNumber?: string;
    acreage: number;
    location: KenyanLocation;
    landUse: LandUseType;
  }): Result<LandAssetDetails> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.titleDeedNumber, argumentName: 'titleDeedNumber' },
      { argument: props.parcelNumber, argumentName: 'parcelNumber' },
      { argument: props.acreage, argumentName: 'acreage' },
      { argument: props.location, argumentName: 'location' },
      { argument: props.landUse, argumentName: 'landUse' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message || 'Validation failed');
    }

    if (props.acreage <= 0) {
      return Result.fail('Acreage must be positive');
    }

    // Validate Kenyan title deed format (Standard regex for LR/IR numbers)
    const titleRegex = /^(IR|CR|L\.?R\.?|Title|Cert|Grant|Block)\s?[\w\\/\\.\s-]+$/i;
    if (!titleRegex.test(props.titleDeedNumber)) {
      return Result.fail(`Invalid title deed number format: ${props.titleDeedNumber}`);
    }

    return Result.ok(
      new LandAssetDetails({
        type: AssetType.LAND_PARCEL,
        titleDeedNumber: props.titleDeedNumber,
        parcelNumber: props.parcelNumber,
        landReferenceNumber: props.landReferenceNumber || null,
        acreage: props.acreage,
        location: props.location,
        landUse: props.landUse,
      }),
    );
  }

  validateBusinessRules(): Result<void> {
    if (this._value.acreage > 100000) {
      return Result.fail('Acreage exceeds reasonable limits (100,000 acres)');
    }
    return Result.ok();
  }

  // Business logic for land valuation
  public estimatedMarketValuePerAcre(): number {
    const baseValuePerAcre = 1_000_000; // 1M KES base

    let multiplier = 1.0;
    if (this._value.location.isUrbanArea()) {
      multiplier *= 5.0;
    }
    if (this._value.landUse === LandUseType.COMMERCIAL) {
      multiplier *= 2.0;
    }
    if (this._value.landUse === LandUseType.AGRICULTURAL) {
      multiplier *= 0.5;
    }

    return baseValuePerAcre * multiplier;
  }

  public getKenyanRegistrationRequirements(): string[] {
    const requirements = [
      'Title deed must be registered with Ministry of Lands',
      'Land rates clearance certificate required',
      'Survey map from Survey of Kenya',
    ];

    if (this._value.acreage > 50) {
      requirements.push('Requires subdivision approval from County Government');
    }

    if (this._value.location.isAridOrSemiAridLand()) {
      requirements.push('Must comply with ASAL land use regulations');
    }

    return requirements;
  }

  // Getters
  get titleDeedNumber(): string {
    return this._value.titleDeedNumber;
  }
  get parcelNumber(): string {
    return this._value.parcelNumber;
  }
  get acreage(): number {
    return this._value.acreage;
  }
  get location(): KenyanLocation {
    return this._value.location;
  }
  get landUse(): LandUseType {
    return this._value.landUse;
  }
}

// --- Financial Asset Details ---

export interface FinancialAssetProps extends BaseAssetProps {
  institutionName: string;
  accountNumber: string;
  accountType: FinancialAccountType;
  branchName: string | null;
  kraPin: KenyanId | null;
}

export class FinancialAssetDetails extends AssetDetails {
  declare protected readonly _value: FinancialAssetProps;

  private constructor(props: FinancialAssetProps) {
    super(props);
  }

  public static create(props: {
    institutionName: string;
    accountNumber: string;
    accountType: FinancialAccountType;
    branchName?: string;
    kraPin?: KenyanId;
  }): Result<FinancialAssetDetails> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.institutionName, argumentName: 'institutionName' },
      { argument: props.accountNumber, argumentName: 'accountNumber' },
      { argument: props.accountType, argumentName: 'accountType' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message || 'Validation failed');
    }

    // Validate account number format (8-20 digits typically)
    if (!/^\d{8,20}$/.test(props.accountNumber)) {
      return Result.fail('Invalid account number format');
    }

    return Result.ok(
      new FinancialAssetDetails({
        type: AssetType.FINANCIAL_ASSET,
        institutionName: props.institutionName,
        accountNumber: props.accountNumber,
        accountType: props.accountType,
        branchName: props.branchName || null,
        kraPin: props.kraPin || null,
      }),
    );
  }

  validateBusinessRules(): Result<void> {
    const validBanks = [
      'KCB',
      'Equity',
      'Cooperative',
      'Standard Chartered',
      'Absa',
      'NCBA',
      'Stanbic',
      'Diamond Trust',
      'Bank of Africa',
      'Family Bank',
      'I&M',
      'Safaricom', // For M-Pesa
      'Airtel', // For Airtel Money
    ];

    const isRecognizedBank = validBanks.some((bank) =>
      this._value.institutionName.toUpperCase().includes(bank.toUpperCase()),
    );

    if (!isRecognizedBank) {
      // Warning log
    }

    return Result.ok();
  }

  public getFreezeInstructions(): string[] {
    const instructions = [
      'Notify bank of account holder death',
      'Submit death certificate and grant of representation',
      'Freeze account transactions',
      'Request account statement as at date of death',
    ];

    if (this._value.accountType === FinancialAccountType.SACCO_SHARES) {
      instructions.push('Request SACCO share certificate');
      instructions.push('Check for outstanding SACCO loans');
    }

    if (this._value.accountType === FinancialAccountType.PENSION) {
      instructions.push('Contact retirement benefits authority');
      instructions.push('Submit benefit claim forms');
    }

    return instructions;
  }

  // Getters
  get institutionName(): string {
    return this._value.institutionName;
  }
  get accountNumber(): string {
    return this._value.accountNumber;
  }
  get accountType(): FinancialAccountType {
    return this._value.accountType;
  }
}

// --- Vehicle Asset Details ---

export interface VehicleAssetProps extends BaseAssetProps {
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  chassisNumber: string | null;
  engineNumber: string | null;
  color: string | null;
}

export class VehicleAssetDetails extends AssetDetails {
  declare protected readonly _value: VehicleAssetProps;

  private constructor(props: VehicleAssetProps) {
    super(props);
  }

  public static create(props: {
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    chassisNumber?: string;
    engineNumber?: string;
    color?: string;
  }): Result<VehicleAssetDetails> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.registrationNumber, argumentName: 'registrationNumber' },
      { argument: props.make, argumentName: 'make' },
      { argument: props.model, argumentName: 'model' },
      { argument: props.year, argumentName: 'year' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message || 'Validation failed');
    }

    // Validate Kenyan registration format (e.g., KAA 123A, KBC 123)
    if (!/^K[A-Z]{2}\s?\d{3}[A-Z]?$/i.test(props.registrationNumber)) {
      // Allow for now but warn/log in production
    }

    const currentYear = new Date().getFullYear();
    if (props.year < 1900 || props.year > currentYear + 1) {
      return Result.fail(`Invalid vehicle year: ${props.year}`);
    }

    return Result.ok(
      new VehicleAssetDetails({
        type: AssetType.VEHICLE,
        registrationNumber: props.registrationNumber.toUpperCase(),
        make: props.make,
        model: props.model,
        year: props.year,
        chassisNumber: props.chassisNumber || null,
        engineNumber: props.engineNumber || null,
        color: props.color || null,
      }),
    );
  }

  validateBusinessRules(): Result<void> {
    return Result.ok();
  }

  public getNTSARequirements(): string[] {
    return [
      'Original logbook required for transfer',
      'Death certificate of registered owner',
      'Grant of representation',
      'NTSA transfer forms (Form NTSA 17)',
      'KRA PIN of deceased and beneficiary',
      'Clearance from Kenya Revenue Authority',
    ];
  }

  public estimateCurrentValue(): number {
    const age = new Date().getFullYear() - this._value.year;
    const depreciationRate = 0.15; // 15% per year
    const baseValue = 1_000_000; // 1M KES base
    const currentValue = baseValue * Math.pow(1 - depreciationRate, age);
    return Math.max(currentValue, 50_000);
  }

  // Getters
  get registrationNumber(): string {
    return this._value.registrationNumber;
  }
}

// --- Business Interest Details ---

export interface BusinessAssetProps extends BaseAssetProps {
  businessName: string;
  registrationNumber: string | null;
  kraPin: KenyanId | null;
  sharePercentage: number;
  numberOfShares: number | null;
}

export class BusinessAssetDetails extends AssetDetails {
  declare protected readonly _value: BusinessAssetProps;

  private constructor(props: BusinessAssetProps) {
    super(props);
  }

  public static create(props: {
    businessName: string;
    registrationNumber?: string;
    kraPin?: KenyanId;
    sharePercentage: number;
    numberOfShares?: number;
  }): Result<BusinessAssetDetails> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.businessName, argumentName: 'businessName' },
      { argument: props.sharePercentage, argumentName: 'sharePercentage' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message || 'Validation failed');
    }

    if (props.sharePercentage < 0 || props.sharePercentage > 100) {
      return Result.fail('Share percentage must be between 0 and 100');
    }

    return Result.ok(
      new BusinessAssetDetails({
        type: AssetType.BUSINESS_INTEREST,
        businessName: props.businessName,
        registrationNumber: props.registrationNumber || null,
        kraPin: props.kraPin || null,
        sharePercentage: props.sharePercentage,
        numberOfShares: props.numberOfShares || null,
      }),
    );
  }

  validateBusinessRules(): Result<void> {
    if (this._value.sharePercentage > 100) {
      return Result.fail('Share percentage cannot exceed 100%');
    }
    return Result.ok();
  }

  public getSuccessionRequirements(): string[] {
    const requirements = [
      'Company registry search certificate',
      'Memorandum and Articles of Association',
      'Board resolution approving transfer',
      'Share transfer forms',
      'Updated register of members',
    ];

    if (this._value.sharePercentage >= 10) {
      requirements.push('Competition Authority approval may be required');
    }

    if (this._value.sharePercentage >= 51) {
      requirements.push('Change of directorship forms required');
    }

    return requirements;
  }

  get businessName(): string {
    return this._value.businessName;
  }
}

// --- Type Guards ---

export function isLandAssetDetails(details: AssetDetails): details is LandAssetDetails {
  return details.type === AssetType.LAND_PARCEL;
}

export function isFinancialAssetDetails(details: AssetDetails): details is FinancialAssetDetails {
  return details.type === AssetType.FINANCIAL_ASSET;
}

export function isVehicleAssetDetails(details: AssetDetails): details is VehicleAssetDetails {
  return details.type === AssetType.VEHICLE;
}

export function isBusinessAssetDetails(details: AssetDetails): details is BusinessAssetDetails {
  return details.type === AssetType.BUSINESS_INTEREST;
}
