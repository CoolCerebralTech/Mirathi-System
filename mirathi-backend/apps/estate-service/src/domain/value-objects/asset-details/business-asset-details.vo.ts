// src/estate-service/src/domain/value-objects/asset-details/business-asset-details.vo.ts
import { ValueObject, ValueObjectValidationError } from '../../base/value-object';

export interface BusinessAssetDetailsProps {
  businessName: string;
  registrationNumber: string; // PVT/XYZ/2023
  businessType: 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LIMITED_COMPANY' | 'LLP';
  shareholdingPercentage: number; // 0-100
  numberOfShares?: number;
  registeredAddress?: string;
}

/**
 * Business Asset Details
 *
 * Represents ownership in a business entity.
 * Critical for S.35 distribution (Business shares are often indivisible without sale).
 */
export class BusinessAssetDetailsVO extends ValueObject<BusinessAssetDetailsProps> {
  constructor(props: BusinessAssetDetailsProps) {
    super(props);
  }
  public static create(props: BusinessAssetDetailsProps): BusinessAssetDetailsVO {
    return new BusinessAssetDetailsVO(props);
  }
  protected validate(): void {
    if (!this.props.businessName?.trim())
      throw new ValueObjectValidationError('Business Name Required', 'businessName');
    if (!this.props.registrationNumber?.trim())
      throw new ValueObjectValidationError('Registration Number Required', 'registrationNumber');

    if (this.props.shareholdingPercentage < 0 || this.props.shareholdingPercentage > 100) {
      throw new ValueObjectValidationError(
        'Shareholding must be between 0% and 100%',
        'shareholdingPercentage',
      );
    }
  }

  isMajorityShareholder(): boolean {
    return this.props.shareholdingPercentage > 50;
  }

  /**
   * Sole Proprietorships die with the owner unless transferred.
   * Companies continue to exist.
   */
  survivesDeath(): boolean {
    return this.props.businessType !== 'SOLE_PROPRIETORSHIP';
  }

  toJSON(): Record<string, any> {
    return {
      ...this.props,
      isMajority: this.isMajorityShareholder(),
      survivesDeath: this.survivesDeath(),
    };
  }
}
