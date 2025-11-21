import { KENYAN_COUNTIES_LIST } from '../../../common/constants/kenyan-law.constants';

export interface Location {
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

  private constructor(
    titleNumber: string,
    location: Location,
    size: number,
    landReference: string,
  ) {
    this.titleNumber = titleNumber;
    this.location = { ...location }; // Immutable copy
    this.size = size;
    this.landReference = landReference;

    Object.freeze(this); // Ensure immutability
  }

  // -----------------------------------------------------
  // Factory method
  // -----------------------------------------------------
  static create(
    titleNumber: string,
    location: Location,
    size: number,
    landReference?: string,
  ): LandParcel {
    if (!titleNumber?.trim()) {
      throw new Error('Title number is required');
    }

    if (!LandParcel.isValidCounty(location.county)) {
      throw new Error(`Invalid Kenyan county: ${location.county}`);
    }

    if (size <= 0) {
      throw new Error('Land size must be positive');
    }

    const ref =
      landReference?.trim() || LandParcel.generateLandReference(titleNumber, location.county);
    return new LandParcel(titleNumber.trim(), location, size, ref);
  }

  // -----------------------------------------------------
  // Getters
  // -----------------------------------------------------
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

  getCounty(): string {
    return this.location.county;
  }

  // -----------------------------------------------------
  // Business logic
  // -----------------------------------------------------
  equals(other: LandParcel): boolean {
    return this.titleNumber === other.getTitleNumber();
  }

  toString(): string {
    return `Title: ${this.titleNumber}, ${this.location.county} County, ${this.size}ha`;
  }

  getApproximateValue(pricePerHectare: number): number {
    if (pricePerHectare < 0) {
      throw new Error('Price per hectare cannot be negative');
    }
    return this.size * pricePerHectare;
  }

  // -----------------------------------------------------
  // Static helpers
  // -----------------------------------------------------
  static isValidCounty(county: string): boolean {
    return (KENYAN_COUNTIES_LIST as readonly string[]).includes(county.toUpperCase());
  }

  private static generateLandReference(titleNumber: string, county: string): string {
    const countyCode = county.toUpperCase().substring(0, 3);
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(6, '0');
    return `LR/${countyCode}/${titleNumber.substring(0, 6)}/${random}`;
  }
}
