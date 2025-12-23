// domain/value-objects/asset-ownership-type.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Asset Ownership Type Value Object
 *
 * Kenyan Legal Context:
 * - SOLE: Single owner (most common in estates)
 * - JOINT_TENANCY: Co-owners with right of survivorship (property bypasses estate)
 * - TENANCY_IN_COMMON: Co-owners with separate shares (share goes to estate)
 * - COMMUNITY_PROPERTY: Marital property (50/50 presumption)
 *
 * Critical for Distribution:
 * - Joint tenancy assets DON'T go to estate (pass to survivor automatically)
 * - Only deceased's share of tenancy-in-common enters estate
 * - Community property splits 50/50 (S.35 LSA considers spouse's share)
 *
 * Business Rules:
 * - Ownership type determines if asset is distributable
 * - Affects valuation (full value vs. percentage)
 * - Influences beneficiary rights
 */

export enum AssetOwnershipTypeEnum {
  SOLE = 'SOLE', // 100% single owner
  JOINT_TENANCY = 'JOINT_TENANCY', // Right of survivorship
  TENANCY_IN_COMMON = 'TENANCY_IN_COMMON', // Separate shares
  COMMUNITY_PROPERTY = 'COMMUNITY_PROPERTY', // Marital property
}

export class AssetOwnershipType extends SimpleValueObject<AssetOwnershipTypeEnum> {
  private constructor(value: AssetOwnershipTypeEnum) {
    super(value);
  }

  public static create(value: string): AssetOwnershipType {
    const normalized = value.toUpperCase().replace(/\s+/g, '_');

    if (!Object.values(AssetOwnershipTypeEnum).includes(normalized as AssetOwnershipTypeEnum)) {
      throw new ValueObjectValidationError(`Invalid ownership type: ${value}`, 'ownershipType');
    }

    return new AssetOwnershipType(normalized as AssetOwnershipTypeEnum);
  }

  // Factory methods
  public static sole(): AssetOwnershipType {
    return new AssetOwnershipType(AssetOwnershipTypeEnum.SOLE);
  }

  public static jointTenancy(): AssetOwnershipType {
    return new AssetOwnershipType(AssetOwnershipTypeEnum.JOINT_TENANCY);
  }

  public static tenancyInCommon(): AssetOwnershipType {
    return new AssetOwnershipType(AssetOwnershipTypeEnum.TENANCY_IN_COMMON);
  }

  public static communityProperty(): AssetOwnershipType {
    return new AssetOwnershipType(AssetOwnershipTypeEnum.COMMUNITY_PROPERTY);
  }

  protected validate(): void {
    if (!this.props.value) {
      throw new ValueObjectValidationError('Ownership type cannot be empty');
    }

    if (!Object.values(AssetOwnershipTypeEnum).includes(this.props.value)) {
      throw new ValueObjectValidationError(`Invalid ownership type: ${this.props.value}`);
    }
  }

  /**
   * Check if asset is solely owned
   */
  public isSole(): boolean {
    return this.value === AssetOwnershipTypeEnum.SOLE;
  }

  /**
   * Check if asset has co-owners
   */
  public hasCoOwners(): boolean {
    return !this.isSole();
  }

  /**
   * Check if asset bypasses estate (joint tenancy with survivorship)
   */
  public bypassesEstate(): boolean {
    return this.value === AssetOwnershipTypeEnum.JOINT_TENANCY;
  }

  /**
   * Check if deceased's share enters estate
   */
  public entersEstate(): boolean {
    return !this.bypassesEstate();
  }

  /**
   * Check if requires co-owner consent for distribution
   */
  public requiresCoOwnerConsent(): boolean {
    return this.hasCoOwners();
  }

  /**
   * Get default share for deceased in co-owned assets
   */
  public getDefaultDeceasedShare(): number {
    switch (this.value) {
      case AssetOwnershipTypeEnum.SOLE:
        return 100; // Full ownership
      case AssetOwnershipTypeEnum.JOINT_TENANCY:
        return 0; // Doesn't enter estate (goes to survivor)
      case AssetOwnershipTypeEnum.TENANCY_IN_COMMON:
        return 50; // Default 50% if not specified (subject to actual shares)
      case AssetOwnershipTypeEnum.COMMUNITY_PROPERTY:
        return 50; // Marital property presumes 50/50
    }
  }

  /**
   * Check if asset can be distributed without additional legal steps
   */
  public isReadilyDistributable(): boolean {
    return this.value === AssetOwnershipTypeEnum.SOLE;
  }

  /**
   * Get description for legal documents
   */
  public getDescription(): string {
    switch (this.value) {
      case AssetOwnershipTypeEnum.SOLE:
        return 'Sole ownership - Asset fully owned by deceased';
      case AssetOwnershipTypeEnum.JOINT_TENANCY:
        return 'Joint tenancy with right of survivorship - Asset passes to surviving co-owner(s)';
      case AssetOwnershipTypeEnum.TENANCY_IN_COMMON:
        return "Tenancy in common - Deceased's share enters estate for distribution";
      case AssetOwnershipTypeEnum.COMMUNITY_PROPERTY:
        return 'Community property - Marital property subject to 50/50 presumption';
    }
  }

  /**
   * Get required actions for distribution
   */
  public getDistributionRequirements(): string[] {
    switch (this.value) {
      case AssetOwnershipTypeEnum.SOLE:
        return ['Grant of representation required'];
      case AssetOwnershipTypeEnum.JOINT_TENANCY:
        return ['Death certificate to registry', 'Survivorship affidavit'];
      case AssetOwnershipTypeEnum.TENANCY_IN_COMMON:
        return [
          "Determine deceased's share percentage",
          "Grant of representation for deceased's share",
          'Co-owner notification required',
        ];
      case AssetOwnershipTypeEnum.COMMUNITY_PROPERTY:
        return [
          'Determine marital vs. separate property',
          'Spouse consent for distribution',
          "Grant of representation for deceased's 50%",
        ];
    }
  }

  /**
   * Get legal warning/notice
   */
  public getLegalNotice(): string | null {
    switch (this.value) {
      case AssetOwnershipTypeEnum.JOINT_TENANCY:
        return 'WARNING: This asset may not form part of the distributable estate due to right of survivorship.';
      case AssetOwnershipTypeEnum.COMMUNITY_PROPERTY:
        return "NOTICE: Surviving spouse retains 50% ownership. Only deceased's 50% is distributable.";
      case AssetOwnershipTypeEnum.TENANCY_IN_COMMON:
        return "NOTICE: Only the deceased's specified share is distributable. Co-owner rights remain intact.";
      default:
        return null;
    }
  }

  public getDisplayName(): string {
    return this.value
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}
