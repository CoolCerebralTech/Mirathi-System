// domain/value-objects/asset-type.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Asset Type Value Object
 *
 * Kenyan Legal Context:
 * - Different asset types have different transfer procedures
 * - Land requires Lands Registry transfer (Section 27, Land Registration Act)
 * - Vehicles require NTSA transfer
 * - Financial assets require bank succession processes
 *
 * Business Rules:
 * - Asset type determines verification requirements
 * - Asset type affects valuation methods
 * - Asset type influences distribution complexity
 */

export enum AssetTypeEnum {
  LAND_PARCEL = 'LAND_PARCEL', // Title deeds, subdivision plots
  PROPERTY = 'PROPERTY', // Houses, rentals, buildings
  FINANCIAL_ASSET = 'FINANCIAL_ASSET', // Bank accounts, SACCO shares, investments
  DIGITAL_ASSET = 'DIGITAL_ASSET', // Crypto, NFTs, online portfolios
  BUSINESS_INTEREST = 'BUSINESS_INTEREST', // Company shares, partnerships
  VEHICLE = 'VEHICLE', // Cars, motorcycles, tractors
  INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY', // Patents, copyrights, trademarks
  LIVESTOCK = 'LIVESTOCK', // Cattle, goats, poultry (common in rural Kenya)
  PERSONAL_EFFECTS = 'PERSONAL_EFFECTS', // Jewelry, art, family heirlooms
  OTHER = 'OTHER',
}

export class AssetType extends SimpleValueObject<AssetTypeEnum> {
  private constructor(value: AssetTypeEnum) {
    super(value);
  }

  public static create(value: string): AssetType {
    const normalizedValue = value.toUpperCase().replace(/\s+/g, '_');

    if (!Object.values(AssetTypeEnum).includes(normalizedValue as AssetTypeEnum)) {
      throw new ValueObjectValidationError(
        `Invalid asset type: ${value}. Must be one of: ${Object.values(AssetTypeEnum).join(', ')}`,
        'assetType',
      );
    }

    return new AssetType(normalizedValue as AssetTypeEnum);
  }

  // Factory methods for type safety
  public static landParcel(): AssetType {
    return new AssetType(AssetTypeEnum.LAND_PARCEL);
  }

  public static property(): AssetType {
    return new AssetType(AssetTypeEnum.PROPERTY);
  }

  public static financialAsset(): AssetType {
    return new AssetType(AssetTypeEnum.FINANCIAL_ASSET);
  }

  public static digitalAsset(): AssetType {
    return new AssetType(AssetTypeEnum.DIGITAL_ASSET);
  }

  public static businessInterest(): AssetType {
    return new AssetType(AssetTypeEnum.BUSINESS_INTEREST);
  }

  public static vehicle(): AssetType {
    return new AssetType(AssetTypeEnum.VEHICLE);
  }

  public static intellectualProperty(): AssetType {
    return new AssetType(AssetTypeEnum.INTELLECTUAL_PROPERTY);
  }

  public static livestock(): AssetType {
    return new AssetType(AssetTypeEnum.LIVESTOCK);
  }

  public static personalEffects(): AssetType {
    return new AssetType(AssetTypeEnum.PERSONAL_EFFECTS);
  }

  public static other(): AssetType {
    return new AssetType(AssetTypeEnum.OTHER);
  }

  protected validate(): void {
    if (!this.props.value) {
      throw new ValueObjectValidationError('Asset type cannot be empty');
    }

    if (!Object.values(AssetTypeEnum).includes(this.props.value)) {
      throw new ValueObjectValidationError(`Invalid asset type: ${this.props.value}`);
    }
  }

  /**
   * Check if asset requires physical transfer (land, vehicle)
   */
  public requiresPhysicalTransfer(): boolean {
    return [AssetTypeEnum.LAND_PARCEL, AssetTypeEnum.PROPERTY, AssetTypeEnum.VEHICLE].includes(
      this.value,
    );
  }

  /**
   * Check if asset requires government registry update
   */
  public requiresRegistryTransfer(): boolean {
    return [
      AssetTypeEnum.LAND_PARCEL,
      AssetTypeEnum.VEHICLE,
      AssetTypeEnum.BUSINESS_INTEREST,
      AssetTypeEnum.INTELLECTUAL_PROPERTY,
    ].includes(this.value);
  }

  /**
   * Check if asset is liquid (easily converted to cash)
   */
  public isLiquid(): boolean {
    return [AssetTypeEnum.FINANCIAL_ASSET, AssetTypeEnum.DIGITAL_ASSET].includes(this.value);
  }

  /**
   * Check if asset requires professional valuation
   */
  public requiresProfessionalValuation(): boolean {
    return [
      AssetTypeEnum.LAND_PARCEL,
      AssetTypeEnum.PROPERTY,
      AssetTypeEnum.BUSINESS_INTEREST,
      AssetTypeEnum.INTELLECTUAL_PROPERTY,
    ].includes(this.value);
  }

  /**
   * Check if asset can be divided (for multiple beneficiaries)
   */
  public isDivisible(): boolean {
    return [
      AssetTypeEnum.FINANCIAL_ASSET,
      AssetTypeEnum.DIGITAL_ASSET,
      AssetTypeEnum.BUSINESS_INTEREST,
      AssetTypeEnum.LIVESTOCK,
    ].includes(this.value);
  }

  /**
   * Get verification document requirements
   */
  public getRequiredDocuments(): string[] {
    switch (this.value) {
      case AssetTypeEnum.LAND_PARCEL:
        return ['Title Deed', 'Land Registry Search', 'Valuation Report'];
      case AssetTypeEnum.PROPERTY:
        return ['Title Deed', 'Valuation Report', 'Rate Clearance Certificate'];
      case AssetTypeEnum.VEHICLE:
        return ['Logbook', 'NTSA Search', 'Valuation Report'];
      case AssetTypeEnum.FINANCIAL_ASSET:
        return ['Bank Statement', 'Account Closure Letter'];
      case AssetTypeEnum.BUSINESS_INTEREST:
        return ['Share Certificate', 'Company CR12', 'Business Valuation'];
      case AssetTypeEnum.INTELLECTUAL_PROPERTY:
        return ['Registration Certificate', 'KIPI Search', 'Valuation Report'];
      case AssetTypeEnum.DIGITAL_ASSET:
        return ['Wallet Address', 'Access Credentials', 'Valuation Statement'];
      case AssetTypeEnum.LIVESTOCK:
        return ['Livestock Census', 'Veterinary Certificate', 'Valuation Report'];
      case AssetTypeEnum.PERSONAL_EFFECTS:
        return ['Inventory List', 'Photographs', 'Valuation (if >100k KES)'];
      default:
        return ['Description', 'Proof of Ownership'];
    }
  }

  /**
   * Get typical transfer authority
   */
  public getTransferAuthority(): string {
    switch (this.value) {
      case AssetTypeEnum.LAND_PARCEL:
      case AssetTypeEnum.PROPERTY:
        return 'Lands Registry';
      case AssetTypeEnum.VEHICLE:
        return 'NTSA (National Transport and Safety Authority)';
      case AssetTypeEnum.BUSINESS_INTEREST:
        return 'Companies Registry (eCitizen)';
      case AssetTypeEnum.INTELLECTUAL_PROPERTY:
        return 'KIPI (Kenya Industrial Property Institute)';
      case AssetTypeEnum.FINANCIAL_ASSET:
        return 'Financial Institution';
      default:
        return 'Court-Supervised Transfer';
    }
  }

  public getDisplayName(): string {
    return this.value
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}
