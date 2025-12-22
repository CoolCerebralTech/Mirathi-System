import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';
import { KenyanId } from '../../../shared/kenyan-id.vo';
import { KenyanLocation } from '../../../shared/kenyan-location.vo';

// --- Exceptions ---
export class InvalidAssetDetailsException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_ASSET_DETAILS');
  }
}

// --- Enums ---
export enum AssetType {
  LAND_PARCEL = 'LAND_PARCEL',
  PROPERTY = 'PROPERTY',
  FINANCIAL_ASSET = 'FINANCIAL_ASSET',
  DIGITAL_ASSET = 'DIGITAL_ASSET',
  BUSINESS_INTEREST = 'BUSINESS_INTEREST',
  VEHICLE = 'VEHICLE',
}

export enum LandUseType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  AGRICULTURAL = 'AGRICULTURAL',
  INDUSTRIAL = 'INDUSTRIAL',
  MIXED_USE = 'MIXED_USE',
}

export enum FinancialAccountType {
  SAVINGS = 'SAVINGS',
  CURRENT = 'CURRENT',
  FIXED_DEPOSIT = 'FIXED_DEPOSIT',
  SACCO_SHARES = 'SACCO_SHARES',
  PENSION = 'PENSION',
}

// --- Abstract Base ---
export interface BaseAssetProps {
  type: AssetType;
}

export abstract class AssetDetails<T extends BaseAssetProps> extends ValueObject<T> {
  protected constructor(props: T) {
    super(props);
  }

  protected validate(): void {
    if (!this.props.type) {
      throw new InvalidAssetDetailsException('Asset type is required');
    }
    this.validateSpecific();
  }

  protected abstract validateSpecific(): void;

  get type(): AssetType {
    return this.props.type;
  }
}

// --- Land Asset ---
export interface LandAssetProps extends BaseAssetProps {
  titleDeedNumber: string;
  parcelNumber: string;
  acreage: number;
  location: KenyanLocation;
  landUse: LandUseType;
}

export class LandAssetDetails extends AssetDetails<LandAssetProps> {
  private constructor(props: LandAssetProps) {
    super(props);
  }

  protected validateSpecific(): void {
    if (this.props.acreage <= 0) {
      throw new InvalidAssetDetailsException('Acreage must be positive');
    }

    const titleRegex = /^(IR|CR|L\.?R\.?|Title|Cert|Grant|Block)\s?[\w\\/\\.\s-]+$/i;
    if (!titleRegex.test(this.props.titleDeedNumber)) {
      throw new InvalidAssetDetailsException(
        `Invalid title deed format: ${this.props.titleDeedNumber}`,
      );
    }
  }

  static create(
    titleDeedNumber: string,
    parcelNumber: string,
    acreage: number,
    location: KenyanLocation,
    landUse: LandUseType,
  ): LandAssetDetails {
    return new LandAssetDetails({
      type: AssetType.LAND_PARCEL,
      titleDeedNumber,
      parcelNumber,
      acreage,
      location,
      landUse,
    });
  }

  get titleDeedNumber(): string {
    return this.props.titleDeedNumber;
  }
  get parcelNumber(): string {
    return this.props.parcelNumber;
  }
  get acreage(): number {
    return this.props.acreage;
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.props.type,
      titleDeedNumber: this.props.titleDeedNumber,
      parcelNumber: this.props.parcelNumber,
      acreage: this.props.acreage,
      landUse: this.props.landUse,
      // Serialize nested Value Object
      location: this.props.location.toJSON(),
    };
  }
}

// --- Financial Asset ---
export interface FinancialAssetProps extends BaseAssetProps {
  institutionName: string;
  accountNumber: string;
  accountType: FinancialAccountType;
  kraPin?: KenyanId;
}

export class FinancialAssetDetails extends AssetDetails<FinancialAssetProps> {
  private constructor(props: FinancialAssetProps) {
    super(props);
  }

  protected validateSpecific(): void {
    if (!/^\d{8,20}$/.test(this.props.accountNumber)) {
      throw new InvalidAssetDetailsException(
        'Invalid account number format (8-20 digits required)',
      );
    }
  }

  static create(
    institutionName: string,
    accountNumber: string,
    accountType: FinancialAccountType,
    kraPin?: KenyanId,
  ): FinancialAssetDetails {
    return new FinancialAssetDetails({
      type: AssetType.FINANCIAL_ASSET,
      institutionName,
      accountNumber,
      accountType,
      kraPin,
    });
  }

  get institutionName(): string {
    return this.props.institutionName;
  }
  get accountNumber(): string {
    return this.props.accountNumber;
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.props.type,
      institution: this.props.institutionName,
      // Mask account number for safety in logs/responses (Show last 4)
      accountNumberMasked: `****${this.props.accountNumber.slice(-4)}`,
      accountType: this.props.accountType,
      kraPin: this.props.kraPin ? this.props.kraPin.toJSON() : null,
    };
  }
}

// --- Vehicle Asset ---
export interface VehicleAssetProps extends BaseAssetProps {
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  chassisNumber?: string;
  engineNumber?: string;
}

export class VehicleAssetDetails extends AssetDetails<VehicleAssetProps> {
  private constructor(props: VehicleAssetProps) {
    super(props);
  }

  protected validateSpecific(): void {
    // Basic check for length, detailed regex was removed for No-MVP simplicity unless strict
    if (this.props.registrationNumber.length < 5) {
      throw new InvalidAssetDetailsException('Invalid vehicle registration number length');
    }

    const currentYear = new Date().getFullYear();
    if (this.props.year < 1900 || this.props.year > currentYear + 1) {
      throw new InvalidAssetDetailsException(`Invalid vehicle year: ${this.props.year}`);
    }
  }

  static create(
    registrationNumber: string,
    make: string,
    model: string,
    year: number,
    chassisNumber?: string,
    engineNumber?: string,
  ): VehicleAssetDetails {
    return new VehicleAssetDetails({
      type: AssetType.VEHICLE,
      registrationNumber: registrationNumber.toUpperCase(),
      make,
      model,
      year,
      chassisNumber,
      engineNumber,
    });
  }

  get registrationNumber(): string {
    return this.props.registrationNumber;
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.props.type,
      registrationNumber: this.props.registrationNumber,
      make: this.props.make,
      model: this.props.model,
      year: this.props.year,
      chassisNumber: this.props.chassisNumber,
      engineNumber: this.props.engineNumber,
    };
  }
}

// --- Business Asset ---
export interface BusinessAssetProps extends BaseAssetProps {
  businessName: string;
  sharePercentage: number;
  registrationNumber?: string;
}

export class BusinessAssetDetails extends AssetDetails<BusinessAssetProps> {
  private constructor(props: BusinessAssetProps) {
    super(props);
  }

  protected validateSpecific(): void {
    if (this.props.sharePercentage < 0 || this.props.sharePercentage > 100) {
      throw new InvalidAssetDetailsException('Share percentage must be between 0 and 100');
    }
  }

  static create(
    businessName: string,
    sharePercentage: number,
    registrationNumber?: string,
  ): BusinessAssetDetails {
    return new BusinessAssetDetails({
      type: AssetType.BUSINESS_INTEREST,
      businessName,
      sharePercentage,
      registrationNumber,
    });
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.props.type,
      businessName: this.props.businessName,
      sharePercentage: this.props.sharePercentage,
      registrationNumber: this.props.registrationNumber,
    };
  }
}
