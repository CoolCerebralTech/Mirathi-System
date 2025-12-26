// src/estate-service/src/domain/value-objects/asset-details/land-asset-details.vo.ts
import { ValueObject, ValueObjectValidationError } from '../../base/value-object';
import { KenyanCountyVO } from '../kenyan-county.vo';

export interface LandAssetDetailsProps {
  titleDeedNumber: string;
  landReferenceNumber: string; // The LR Number
  county: KenyanCountyVO;
  subCounty?: string;
  locationDescription?: string;
  acreage: number;
  landUse: string; // RESIDENTIAL, AGRICULTURAL, COMMERCIAL
  registeredOwner: string;
  registrationDate?: Date;
}

/**
 * Land Asset Details
 *
 * Represents Real Estate property under the Land Registration Act.
 */
export class LandAssetDetailsVO extends ValueObject<LandAssetDetailsProps> {
  constructor(props: LandAssetDetailsProps) {
    super(props);
  }

  protected validate(): void {
    if (!this.props.titleDeedNumber?.trim())
      throw new ValueObjectValidationError('Title Deed Required', 'titleDeedNumber');
    if (!this.props.landReferenceNumber?.trim())
      throw new ValueObjectValidationError('LR Number Required', 'landReferenceNumber');
    if (!this.props.county) throw new ValueObjectValidationError('County Required', 'county');

    if (this.props.acreage <= 0)
      throw new ValueObjectValidationError('Acreage must be positive', 'acreage');
  }

  isAgricultural(): boolean {
    return ['AGRICULTURAL', 'FARMING'].includes(this.props.landUse.toUpperCase());
  }

  /**
   * Returns the Official Search request description.
   * "Please conduct search for LR No [X] at [County] Registry."
   */
  getOfficialSearchDescription(): string {
    return `Search for Title ${this.props.titleDeedNumber} (LR ${this.props.landReferenceNumber}) at ${this.props.county.getLandRegistryLocation()}`;
  }

  toJSON(): Record<string, any> {
    return {
      ...this.props,
      county: this.props.county.toJSON(),
      searchLocation: this.props.county.getLandRegistryLocation(),
    };
  }
}
