// src/estate-service/src/domain/enums/asset-type.enum.ts

/**
 * Asset Type Enum
 *
 * Used for categorization of assets and gifts.
 * This is a simplified version for entities that don't need the full AssetTypeVO logic.
 *
 * Legal Context:
 * - Different asset types have different legal treatment
 * - Land and vehicles require registry transfers
 * - Financial assets are liquid
 * - Businesses require professional valuation
 */
export enum AssetType {
  // Primary types
  LAND = 'LAND',
  VEHICLE = 'VEHICLE',
  FINANCIAL = 'FINANCIAL',
  BUSINESS = 'BUSINESS',

  // Secondary types
  DIGITAL = 'DIGITAL',
  PERSONAL_EFFECTS = 'PERSONAL_EFFECTS',
  LIVESTOCK = 'LIVESTOCK',
  OTHER = 'OTHER',
}

/**
 * Asset Type Helper Methods
 */
export class AssetTypeHelper {
  /**
   * Check if asset type requires registry transfer
   */
  static requiresRegistryTransfer(type: AssetType): boolean {
    return [AssetType.LAND, AssetType.VEHICLE, AssetType.BUSINESS].includes(type);
  }

  /**
   * Check if asset type is liquid (easily convertible to cash)
   */
  static isLiquid(type: AssetType): boolean {
    return [AssetType.FINANCIAL, AssetType.DIGITAL].includes(type);
  }

  /**
   * Check if asset type requires professional valuation
   */
  static requiresProfessionalValuation(type: AssetType): boolean {
    return [AssetType.LAND, AssetType.BUSINESS].includes(type);
  }

  /**
   * Check if asset type has physical form
   */
  static isTangible(type: AssetType): boolean {
    return ![
      AssetType.FINANCIAL,
      AssetType.DIGITAL,
      AssetType.OTHER, // Some other assets might be intangible
    ].includes(type);
  }

  /**
   * Get human-readable description
   */
  static getDescription(type: AssetType): string {
    const descriptions: Record<AssetType, string> = {
      [AssetType.LAND]: 'Real estate, land, or property',
      [AssetType.VEHICLE]: 'Cars, motorcycles, boats, or other vehicles',
      [AssetType.FINANCIAL]: 'Bank accounts, stocks, bonds, or investments',
      [AssetType.BUSINESS]: 'Business interests, shares, or commercial ventures',
      [AssetType.DIGITAL]: 'Digital assets, cryptocurrency, or online accounts',
      [AssetType.PERSONAL_EFFECTS]: 'Personal belongings, jewelry, or household items',
      [AssetType.LIVESTOCK]: 'Animals, livestock, or agricultural assets',
      [AssetType.OTHER]: 'Other miscellaneous assets',
    };
    return descriptions[type] || 'Unknown asset type';
  }

  /**
   * Get typical valuation method for asset type
   */
  static getValuationMethod(type: AssetType): string {
    const methods: Record<AssetType, string> = {
      [AssetType.LAND]: 'Comparative Market Analysis or Registered Valuer',
      [AssetType.VEHICLE]: 'Market value or professional appraisal',
      [AssetType.FINANCIAL]: 'Current market value or statement value',
      [AssetType.BUSINESS]: 'Business valuation by certified professional',
      [AssetType.DIGITAL]: 'Market price or expert assessment',
      [AssetType.PERSONAL_EFFECTS]: 'Replacement value or auction estimate',
      [AssetType.LIVESTOCK]: 'Market price per head or expert assessment',
      [AssetType.OTHER]: 'Professional appraisal or expert opinion',
    };
    return methods[type] || 'Professional valuation required';
  }

  /**
   * Check if asset type typically has co-owners
   */
  static typicallyHasCoOwners(type: AssetType): boolean {
    return [AssetType.LAND, AssetType.BUSINESS, AssetType.FINANCIAL].includes(type);
  }

  /**
   * Get typical documentation required for transfer
   */
  static getTransferDocumentation(type: AssetType): string[] {
    const docs: Record<AssetType, string[]> = {
      [AssetType.LAND]: ['Title Deed', 'Transfer Documents', 'Consent from Land Board'],
      [AssetType.VEHICLE]: ['Logbook', 'Transfer Forms', 'Insurance Documents'],
      [AssetType.FINANCIAL]: ['Account Statements', 'Transfer Forms', 'Beneficiary Declarations'],
      [AssetType.BUSINESS]: ['Share Certificates', 'Board Resolutions', 'Transfer Agreements'],
      [AssetType.DIGITAL]: ['Account Access', 'Transfer Agreements', 'Security Protocols'],
      [AssetType.PERSONAL_EFFECTS]: [
        'Inventory List',
        'Valuation Certificates',
        'Transfer Receipts',
      ],
      [AssetType.LIVESTOCK]: [
        'Ownership Certificates',
        'Health Certificates',
        'Transfer Documents',
      ],
      [AssetType.OTHER]: ['Proof of Ownership', 'Transfer Agreement', 'Valuation Certificate'],
    };
    return docs[type] || ['Proof of Ownership', 'Transfer Agreement'];
  }

  /**
   * Check if asset type is subject to special taxes or duties
   */
  static hasSpecialTaxes(type: AssetType): boolean {
    return [AssetType.LAND, AssetType.BUSINESS, AssetType.VEHICLE].includes(type);
  }

  /**
   * Get all valid asset types
   */
  static getAllTypes(): AssetType[] {
    return Object.values(AssetType);
  }

  /**
   * Validate if a string is a valid AssetType
   */
  static isValid(type: string): type is AssetType {
    return Object.values(AssetType).includes(type as AssetType);
  }
}
