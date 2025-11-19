import { KENYAN_COUNTIES_LIST } from '../../../common/constants/kenyan-law.constants';

interface Location {
  county: string;
  subCounty?: string;
  ward?: string;
  division?: string;
  location?: string;
  subLocation?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export class LandParcel {
  private readonly titleNumber: string;
  private readonly location: Location;
  private readonly size: number; // in hectares
  private readonly landReference: string;

  constructor(titleNumber: string, location: Location, size: number, landReference?: string) {
    if (!titleNumber?.trim()) {
      throw new Error('Title number is required');
    }

    // --- REFACTORED: Use the centralized validation method ---
    if (!LandParcel.isValidCounty(location.county)) {
      throw new Error(`Invalid Kenyan county: ${location.county}`);
    }

    if (size <= 0) {
      throw new Error('Land size must be positive');
    }

    this.titleNumber = titleNumber.trim();
    this.location = { ...location };
    this.size = size;
    this.landReference = landReference?.trim() || this.generateLandReference();
  }

  // ... (Getters remain unchanged) ...

  getTitleNumber(): string {
    return this.titleNumber;
  }
  getLocation(): Readonly<Location> {
    return { ...this.location };
  }
  getSize(): number {
    return this.size;
  }
  getLandReference(): string {
    return this.landReference;
  }

  equals(other: LandParcel): boolean {
    return this.titleNumber === other.getTitleNumber();
  }

  toString(): string {
    return `Title: ${this.titleNumber}, ${this.location.county} County, ${this.size}ha`;
  }

  private generateLandReference(): string {
    const countyCode = this.location.county.toUpperCase().substring(0, 3);
    // A real land reference has a specific format, but this random generation is fine for a placeholder
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(6, '0');
    return `LR/${countyCode}/${this.titleNumber.substring(0, 6)}/${random}`;
  }

  // --- REFACTORED: Consume Single Source of Truth ---
  static isValidCounty(county: string): boolean {
    // Use the constant list from our common module
    return (KENYAN_COUNTIES_LIST as readonly string[]).includes(county.toUpperCase());
  }

  getCounty(): string {
    return this.location.county;
  }

  getApproximateValue(pricePerHectare: number): number {
    return this.size * pricePerHectare;
  }
}
