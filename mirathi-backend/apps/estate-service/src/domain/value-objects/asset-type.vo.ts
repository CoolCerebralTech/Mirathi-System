// src/estate-service/src/domain/value-objects/asset-type.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Asset Type Value Object
 *
 * Defines the Polymorphic Strategy for the Estate Aggregate.
 *
 * MAPPING (The Textbook):
 * - LAND -> LandAssetDetails
 * - VEHICLE -> VehicleAssetDetails
 * - FINANCIAL -> FinancialAssetDetails
 * - BUSINESS -> BusinessAssetDetails
 */
export class AssetTypeVO extends SimpleValueObject<string> {
  // Primary types defined in Architectural Blueprint
  static readonly LAND = 'LAND';
  static readonly VEHICLE = 'VEHICLE';
  static readonly FINANCIAL = 'FINANCIAL';
  static readonly BUSINESS = 'BUSINESS';

  // Secondary types
  static readonly DIGITAL = 'DIGITAL';
  static readonly INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY';
  static readonly PERSONAL_EFFECTS = 'PERSONAL_EFFECTS';
  static readonly LIVESTOCK = 'LIVESTOCK';
  static readonly OTHER = 'OTHER';

  private static readonly ALLOWED_TYPES = [
    AssetTypeVO.LAND,
    AssetTypeVO.VEHICLE,
    AssetTypeVO.FINANCIAL,
    AssetTypeVO.BUSINESS,
    AssetTypeVO.DIGITAL,
    AssetTypeVO.INTELLECTUAL_PROPERTY,
    AssetTypeVO.PERSONAL_EFFECTS,
    AssetTypeVO.LIVESTOCK,
    AssetTypeVO.OTHER,
  ];

  constructor(value: string) {
    super(value.toUpperCase());
  }

  protected validate(): void {
    if (!AssetTypeVO.ALLOWED_TYPES.includes(this.props.value)) {
      throw new ValueObjectValidationError(
        `Invalid asset type: ${this.props.value}. Allowed: ${AssetTypeVO.ALLOWED_TYPES.join(', ')}`,
        'assetType',
      );
    }
  }

  /**
   * Returns the exact Class Name of the Details Entity required for this type.
   * Used by the Factory to enforce correct data structure.
   */
  getRequiredDetailsEntityName(): string {
    switch (this.props.value) {
      case AssetTypeVO.LAND:
        return 'LandAssetDetails';
      case AssetTypeVO.VEHICLE:
        return 'VehicleAssetDetails';
      case AssetTypeVO.FINANCIAL:
        return 'FinancialAssetDetails';
      case AssetTypeVO.BUSINESS:
        return 'BusinessAssetDetails';
      default:
        return 'GenericAssetDetails';
    }
  }

  requiresRegistryTransfer(): boolean {
    return [AssetTypeVO.LAND, AssetTypeVO.VEHICLE, AssetTypeVO.BUSINESS].includes(this.props.value);
  }

  isLiquid(): boolean {
    return [AssetTypeVO.FINANCIAL, AssetTypeVO.DIGITAL].includes(this.props.value);
  }
  static create(type: string): AssetTypeVO {
    return new AssetTypeVO(type);
  }
  static createLand(): AssetTypeVO {
    return new AssetTypeVO(AssetTypeVO.LAND);
  }
  static createVehicle(): AssetTypeVO {
    return new AssetTypeVO(AssetTypeVO.VEHICLE);
  }
  static createFinancial(): AssetTypeVO {
    return new AssetTypeVO(AssetTypeVO.FINANCIAL);
  }
  static createBusiness(): AssetTypeVO {
    return new AssetTypeVO(AssetTypeVO.BUSINESS);
  }
  static createDigital(): AssetTypeVO {
    return new AssetTypeVO(AssetTypeVO.DIGITAL);
  }
  static createIntellectualProperty(): AssetTypeVO {
    return new AssetTypeVO(AssetTypeVO.INTELLECTUAL_PROPERTY);
  }
  static createLivestock(): AssetTypeVO {
    return new AssetTypeVO(AssetTypeVO.LIVESTOCK);
  }
  static createPersonalEffects(): AssetTypeVO {
    return new AssetTypeVO(AssetTypeVO.PERSONAL_EFFECTS);
  }
  static createOther(): AssetTypeVO {
    return new AssetTypeVO(AssetTypeVO.OTHER);
  }
}
