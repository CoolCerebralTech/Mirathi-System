// src/estate-service/src/domain/value-objects/asset-type.vo.ts
import { SimpleValueObject } from '../base/value-object';

/**
 * Asset Type Value Object
 *
 * Kenyan Legal Context:
 * - Different asset types have different transfer procedures
 * - Land assets require Lands Registry involvement
 * - Vehicles require NTSA transfer
 * - Financial assets require bank compliance
 */
export class AssetTypeVO extends SimpleValueObject<string> {
  static readonly LAND = 'LAND_PARCEL';
  static readonly PROPERTY = 'PROPERTY';
  static readonly FINANCIAL = 'FINANCIAL_ASSET';
  static readonly DIGITAL = 'DIGITAL_ASSET';
  static readonly BUSINESS = 'BUSINESS_INTEREST';
  static readonly VEHICLE = 'VEHICLE';
  static readonly LIVESTOCK = 'LIVESTOCK';
  static readonly PERSONAL_EFFECTS = 'PERSONAL_EFFECTS';
  static readonly OTHER = 'OTHER';

  private static readonly ALLOWED_TYPES = [
    AssetTypeVO.LAND,
    AssetTypeVO.PROPERTY,
    AssetTypeVO.FINANCIAL,
    AssetTypeVO.DIGITAL,
    AssetTypeVO.BUSINESS,
    AssetTypeVO.VEHICLE,
    AssetTypeVO.LIVESTOCK,
    AssetTypeVO.PERSONAL_EFFECTS,
    AssetTypeVO.OTHER,
  ];

  private static readonly REQUIRES_REGISTRY = [
    AssetTypeVO.LAND,
    AssetTypeVO.PROPERTY,
    AssetTypeVO.VEHICLE,
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
   * Check if this asset type requires government registry transfer
   */
  requiresRegistryTransfer(): boolean {
    return AssetTypeVO.REQUIRES_REGISTRY.includes(this.props.value);
  }

  /**
   * Check if this asset type is liquid (easily convertible to cash)
   */
  isLiquid(): boolean {
    return [AssetTypeVO.FINANCIAL, AssetTypeVO.DIGITAL].includes(this.props.value);
  }

  /**
   * Check if this asset type has physical presence
   */
  isPhysical(): boolean {
    return [
      AssetTypeVO.LAND,
      AssetTypeVO.PROPERTY,
      AssetTypeVO.VEHICLE,
      AssetTypeVO.LIVESTOCK,
      AssetTypeVO.PERSONAL_EFFECTS,
    ].includes(this.props.value);
  }

  /**
   * Get transfer complexity level (1-10)
   */
  getTransferComplexity(): number {
    const complexityMap: Record<string, number> = {
      [AssetTypeVO.LAND]: 9,
      [AssetTypeVO.PROPERTY]: 8,
      [AssetTypeVO.BUSINESS]: 7,
      [AssetTypeVO.VEHICLE]: 6,
      [AssetTypeVO.FINANCIAL]: 5,
      [AssetTypeVO.DIGITAL]: 4,
      [AssetTypeVO.LIVESTOCK]: 3,
      [AssetTypeVO.PERSONAL_EFFECTS]: 2,
      [AssetTypeVO.OTHER]: 1,
    };
    return complexityMap[this.props.value] || 1;
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
}
