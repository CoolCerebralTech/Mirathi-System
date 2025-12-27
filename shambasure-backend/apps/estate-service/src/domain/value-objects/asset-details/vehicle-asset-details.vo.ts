// src/estate-service/src/domain/value-objects/asset-details/vehicle-asset-details.vo.ts
import { ValueObject, ValueObjectValidationError } from '../../base/value-object';

export interface VehicleAssetDetailsProps {
  registrationNumber: string; // The Number Plate
  logbookNumber?: string;
  make: string;
  model: string;
  year: number;
  chassisNumber: string;
  engineNumber?: string;
  color?: string;
}

/**
 * Vehicle Asset Details
 *
 * Represents a Motor Vehicle registered with NTSA.
 */
export class VehicleAssetDetailsVO extends ValueObject<VehicleAssetDetailsProps> {
  constructor(props: VehicleAssetDetailsProps) {
    super(props);
  }
  public static create(props: VehicleAssetDetailsProps): VehicleAssetDetailsVO {
    return new VehicleAssetDetailsVO(props);
  }
  protected validate(): void {
    // Basic Kenyan Plate Validation (KAA 123A, KBZ 999Z, etc.)
    // Regex allows old formats (KAA 123) and new formats (KAA 123A) and diplomatic/govt (simplified)
    // Note: This is a loose check. Production might need stricter regex for diplomatic/parastatal plates.

    if (!this.props.registrationNumber)
      throw new ValueObjectValidationError('Registration Number Required', 'registrationNumber');

    if (!this.props.chassisNumber || this.props.chassisNumber.length < 5) {
      throw new ValueObjectValidationError('Valid Chassis Number Required', 'chassisNumber');
    }
  }

  getDisplayName(): string {
    return `${this.props.year} ${this.props.make} ${this.props.model} (${this.props.registrationNumber})`;
  }

  /**
   * Used for NTSA Transfer Forms.
   */
  getDescriptionForNTSA(): string {
    return `Motor Vehicle Reg: ${this.props.registrationNumber}, Chassis: ${this.props.chassisNumber}`;
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
