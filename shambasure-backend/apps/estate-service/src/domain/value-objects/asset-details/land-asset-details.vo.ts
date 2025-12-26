// src/estate-service/src/domain/value-objects/asset-details/land-asset-details.vo.ts
import { ValueObject } from '../../base/value-object';
import { ValueObjectValidationError } from '../../base/value-object';
import { KenyanCountyVO } from '../kenyan-county.vo';

/**
 * Land Asset Details Value Object
 *
 * Kenyan Legal Context:
 * - Title Deed is the primary ownership document
 * - Land Reference (LR) number is unique identifier
 * - County determines jurisdiction and Lands Registry
 * - Acreage determines land rates and transfer fees
 */
export interface LandAssetDetailsProps {
  titleDeedNumber: string;
  landReferenceNumber: string;
  county: KenyanCountyVO;
  subCounty?: string;
  locationDescription?: string;
  acreage: number;
  landUse: string;
  registeredOwner: string;
  registrationDate: Date;
}

export class LandAssetDetailsVO extends ValueObject<LandAssetDetailsProps> {
  constructor(props: LandAssetDetailsProps) {
    super(props);
  }

  protected validate(): void {
    // Title Deed Number validation (Kenyan format)
    if (!this.props.titleDeedNumber || this.props.titleDeedNumber.trim().length === 0) {
      throw new ValueObjectValidationError('Title Deed Number is required', 'titleDeedNumber');
    }

    // Land Reference Number validation
    if (!this.props.landReferenceNumber || this.props.landReferenceNumber.trim().length === 0) {
      throw new ValueObjectValidationError(
        'Land Reference Number is required',
        'landReferenceNumber',
      );
    }

    // Acreage validation
    if (this.props.acreage <= 0) {
      throw new ValueObjectValidationError('Acreage must be positive', 'acreage');
    }

    if (this.props.acreage > 10000) {
      throw new ValueObjectValidationError(
        'Acreage exceeds reasonable maximum (10,000 acres)',
        'acreage',
      );
    }

    // Land Use validation
    if (!this.props.landUse || this.props.landUse.trim().length === 0) {
      throw new ValueObjectValidationError('Land use is required', 'landUse');
    }

    // Registered Owner validation
    if (!this.props.registeredOwner || this.props.registeredOwner.trim().length === 0) {
      throw new ValueObjectValidationError('Registered owner is required', 'registeredOwner');
    }
  }

  /**
   * Check if land is in an urban county
   */
  isUrbanLand(): boolean {
    return this.props.county.isUrban();
  }

  /**
   * Get land rates category based on acreage
   */
  getLandRatesCategory(): string {
    if (this.props.acreage <= 0.25) return 'RESIDENTIAL_SMALL';
    if (this.props.acreage <= 1) return 'RESIDENTIAL_MEDIUM';
    if (this.props.acreage <= 5) return 'RESIDENTIAL_LARGE';
    if (this.props.acreage <= 50) return 'COMMERCIAL';
    return 'AGRICULTURAL';
  }

  /**
   * Check if land is agricultural
   */
  isAgricultural(): boolean {
    const agriculturalUses = ['AGRICULTURE', 'FARMING', 'RANCHING', 'GRAZING'];
    return agriculturalUses.some((use) => this.props.landUse.toUpperCase().includes(use));
  }

  /**
   * Get transfer complexity score (1-10)
   */
  getTransferComplexity(): number {
    let complexity = 5; // Base complexity

    if (this.isUrbanLand()) complexity += 2;
    if (this.props.acreage > 10) complexity += 1;
    if (this.isAgricultural()) complexity += 1;

    return Math.min(complexity, 10);
  }

  /**
   * Get display string
   */
  getDisplayString(): string {
    return `${this.props.titleDeedNumber} - ${this.props.acreage} acres in ${this.props.county.getDisplayName()}`;
  }

  toJSON(): Record<string, any> {
    return {
      titleDeedNumber: this.props.titleDeedNumber,
      landReferenceNumber: this.props.landReferenceNumber,
      county: this.props.county.toJSON(),
      subCounty: this.props.subCounty,
      locationDescription: this.props.locationDescription,
      acreage: this.props.acreage,
      landUse: this.props.landUse,
      registeredOwner: this.props.registeredOwner,
      registrationDate: this.props.registrationDate,
      isUrban: this.isUrbanLand(),
      landRatesCategory: this.getLandRatesCategory(),
      transferComplexity: this.getTransferComplexity(),
    };
  }
}
