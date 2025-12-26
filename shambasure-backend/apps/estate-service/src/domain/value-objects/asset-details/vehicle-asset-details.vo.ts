// src/estate-service/src/domain/value-objects/asset-details/vehicle-asset-details.vo.ts
import { ValueObject } from '../../base/value-object';
import { ValueObjectValidationError } from '../../base/value-object';

/**
 * Vehicle Asset Details Value Object
 *
 * Kenyan Legal Context:
 * - Logbook is the primary ownership document
 * - Registration number is unique identifier
 * - NTSA (National Transport and Safety Authority) handles transfers
 */
export interface VehicleAssetDetailsProps {
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  chassisNumber: string;
  engineNumber: string;
  bodyType: string;
  color: string;
  fuelType: string;
  ccRating: number;
  registeredOwner: string;
  registrationDate: Date;
}

export class VehicleAssetDetailsVO extends ValueObject<VehicleAssetDetailsProps> {
  constructor(props: VehicleAssetDetailsProps) {
    super(props);
  }

  protected validate(): void {
    // Registration Number validation (Kenyan format: KAA 123A or KBA 456B)
    const regNumberRegex = /^[A-Z]{2,3}\s?\d{3}[A-Z]{0,2}$/;
    if (!regNumberRegex.test(this.props.registrationNumber)) {
      throw new ValueObjectValidationError(
        'Invalid vehicle registration number format',
        'registrationNumber',
      );
    }

    // Chassis Number validation (VIN format)
    if (!this.props.chassisNumber || this.props.chassisNumber.trim().length < 17) {
      throw new ValueObjectValidationError(
        'Chassis number must be at least 17 characters',
        'chassisNumber',
      );
    }

    // Year validation
    const currentYear = new Date().getFullYear();
    if (this.props.year < 1900 || this.props.year > currentYear + 1) {
      throw new ValueObjectValidationError(`Invalid vehicle year: ${this.props.year}`, 'year');
    }

    // CC Rating validation
    if (this.props.ccRating <= 0 || this.props.ccRating > 10000) {
      throw new ValueObjectValidationError(
        `Invalid engine CC rating: ${this.props.ccRating}`,
        'ccRating',
      );
    }
  }

  /**
   * Check if vehicle is commercial
   */
  isCommercial(): boolean {
    const commercialTypes = ['TRUCK', 'BUS', 'VAN', 'LORRY', 'TRAILER'];
    return commercialTypes.some((type) => this.props.bodyType.toUpperCase().includes(type));
  }

  /**
   * Check if vehicle is luxury (for tax purposes)
   */
  isLuxuryVehicle(): boolean {
    const luxuryMakes = ['MERCEDES', 'BMW', 'AUDI', 'LEXUS', 'RANGE ROVER', 'PORSCHE'];
    const isLuxuryMake = luxuryMakes.some((make) => this.props.make.toUpperCase().includes(make));

    const currentYear = new Date().getFullYear();
    const age = currentYear - this.props.year;

    return isLuxuryMake && age <= 5 && this.props.ccRating >= 2000;
  }

  /**
   * Calculate NTSA transfer fees
   */
  getTransferFees(): number {
    let fees = 1000; // Base fee

    if (this.isCommercial()) fees += 2000;
    if (this.isLuxuryVehicle()) fees += 5000;
    if (this.props.ccRating > 3000) fees += 3000;

    return fees;
  }

  /**
   * Get vehicle age
   */
  getAge(): number {
    const currentYear = new Date().getFullYear();
    return currentYear - this.props.year;
  }

  /**
   * Check if vehicle requires inspection
   */
  requiresInspection(): boolean {
    return this.getAge() > 5 || this.isCommercial();
  }

  toJSON(): Record<string, any> {
    return {
      registrationNumber: this.props.registrationNumber,
      make: this.props.make,
      model: this.props.model,
      year: this.props.year,
      chassisNumber: this.props.chassisNumber,
      engineNumber: this.props.engineNumber,
      bodyType: this.props.bodyType,
      color: this.props.color,
      fuelType: this.props.fuelType,
      ccRating: this.props.ccRating,
      registeredOwner: this.props.registeredOwner,
      registrationDate: this.props.registrationDate,
      isCommercial: this.isCommercial(),
      isLuxury: this.isLuxuryVehicle(),
      age: this.getAge(),
      transferFees: this.getTransferFees(),
    };
  }
}
