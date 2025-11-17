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

    if (!location?.county?.trim()) {
      throw new Error('County is required');
    }

    if (size <= 0) {
      throw new Error('Land size must be positive');
    }

    this.titleNumber = titleNumber.trim();
    this.location = { ...location };
    this.size = size;
    this.landReference = landReference?.trim() || this.generateLandReference();
  }

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
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `LR/${countyCode}/${this.titleNumber.substring(0, 6)}/${random}`;
  }

  // Kenyan county validation
  static isValidCounty(county: string): boolean {
    const kenyanCounties = [
      'Mombasa',
      'Kwale',
      'Kilifi',
      'Tana River',
      'Lamu',
      'Taita Taveta',
      'Garissa',
      'Wajir',
      'Mandera',
      'Marsabit',
      'Isiolo',
      'Meru',
      'Tharaka Nithi',
      'Embu',
      'Kitui',
      'Machakos',
      'Makueni',
      'Nyandarua',
      'Nyeri',
      'Kirinyaga',
      'Muranga',
      'Kiambu',
      'Turkana',
      'West Pokot',
      'Samburu',
      'Trans Nzoia',
      'Uasin Gishu',
      'Elgeyo Marakwet',
      'Nandi',
      'Baringo',
      'Laikipia',
      'Nakuru',
      'Narok',
      'Kajiado',
      'Kericho',
      'Bomet',
      'Kakamega',
      'Vihiga',
      'Bungoma',
      'Busia',
      'Siaya',
      'Kisumu',
      'Homa Bay',
      'Migori',
      'Kisii',
      'Nyamira',
      'Nairobi',
    ];
    return kenyanCounties.includes(county);
  }

  getCounty(): string {
    return this.location.county;
  }

  getApproximateValue(pricePerHectare: number): number {
    return this.size * pricePerHectare;
  }
}
