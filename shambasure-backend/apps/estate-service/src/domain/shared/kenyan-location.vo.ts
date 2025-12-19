// src/shared/domain/value-objects/kenyan-location.vo.ts
import { ValueObject } from '../base/value-object';
import { InvalidLocationException } from '../exceptions/location.exception';

// Enum from Prisma - we'll recreate it for domain independence
export enum KenyanCounty {
  BARINGO = 'BARINGO',
  BOMET = 'BOMET',
  BUNGOMA = 'BUNGOMA',
  BUSIA = 'BUSIA',
  ELGEYO_MARAKWET = 'ELGEYO_MARAKWET',
  EMBU = 'EMBU',
  GARISSA = 'GARISSA',
  HOMA_BAY = 'HOMA_BAY',
  ISIOLO = 'ISIOLO',
  KAJIADO = 'KAJIADO',
  KAKAMEGA = 'KAKAMEGA',
  KERICHO = 'KERICHO',
  KIAMBU = 'KIAMBU',
  KILIFI = 'KILIFI',
  KIRINYAGA = 'KIRINYAGA',
  KISII = 'KISII',
  KISUMU = 'KISUMU',
  KITUI = 'KITUI',
  KWALE = 'KWALE',
  LAIKIPIA = 'LAIKIPIA',
  LAMU = 'LAMU',
  MACHAKOS = 'MACHAKOS',
  MAKUENI = 'MAKUENI',
  MANDERA = 'MANDERA',
  MARSABIT = 'MARSABIT',
  MERU = 'MERU',
  MIGORI = 'MIGORI',
  MOMBASA = 'MOMBASA',
  MURANGA = 'MURANGA',
  NAIROBI = 'NAIROBI',
  NAKURU = 'NAKURU',
  NANDI = 'NANDI',
  NAROK = 'NAROK',
  NYAMIRA = 'NYAMIRA',
  NYANDARUA = 'NYANDARUA',
  NYERI = 'NYERI',
  SAMBURU = 'SAMBURU',
  SIAYA = 'SIAYA',
  TAITA_TAVETA = 'TAITA_TAVETA',
  TANA_RIVER = 'TANA_RIVER',
  THARAKA_NITHI = 'THARAKA_NITHI',
  TRANS_NZOIA = 'TRANS_NZOIA',
  TURKANA = 'TURKANA',
  UASIN_GISHU = 'UASIN_GISHU',
  VIHIGA = 'VIHIGA',
  WAJIR = 'WAJIR',
  WEST_POKOT = 'WEST_POKOT',
}

interface KenyanLocationProps {
  county: KenyanCounty;
  subCounty?: string;
  ward?: string;
  village?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export class KenyanLocation extends ValueObject<KenyanLocationProps> {
  // Cache for subcounty validation per county
  private static readonly COUNTY_SUBCOUNTIES: Map<KenyanCounty, string[]> = new Map([
    [
      KenyanCounty.NAIROBI,
      [
        'Westlands',
        'Dagoretti',
        'Langata',
        'Kibra',
        'Kasarani',
        'Ruaraka',
        'Embakasi',
        'Kamukunji',
        'Starehe',
        'Mathare',
        'Makadara',
      ],
    ],
    [KenyanCounty.MOMBASA, ['Changamwe', 'Jomvu', 'Kisauni', 'Likoni', 'Mvita', 'Nyali']],
    // ... other counties
  ]);

  constructor(props: KenyanLocationProps) {
    super(props);
  }

  protected validate(): void {
    // County validation
    if (!Object.values(KenyanCounty).includes(this._value.county)) {
      throw new InvalidLocationException(`Invalid Kenyan county: ${this._value.county}`);
    }

    // Sub-county validation if provided
    if (this._value.subCounty) {
      const validSubCounties = KenyanLocation.COUNTY_SUBCOUNTIES.get(this._value.county);
      if (validSubCounties && !validSubCounties.includes(this._value.subCounty)) {
        throw new InvalidLocationException(
          `Invalid sub-county '${this._value.subCounty}' for county ${this._value.county}`,
        );
      }
    }

    // GPS coordinates validation
    if (this._value.gpsCoordinates) {
      const { latitude, longitude } = this._value.gpsCoordinates;

      // Kenya bounding box approximately:
      // Latitude: -4.9°S to 5.0°N (actually 4.9°S to 4.9°N)
      // Longitude: 33.9°E to 41.9°E
      if (latitude < -4.9 || latitude > 4.9) {
        throw new InvalidLocationException(
          `Latitude ${latitude}° is outside Kenya's bounds (-4.9° to 4.9°)`,
        );
      }

      if (longitude < 33.9 || longitude > 41.9) {
        throw new InvalidLocationException(
          `Longitude ${longitude}° is outside Kenya's bounds (33.9° to 41.9°)`,
        );
      }
    }
  }

  // Factory methods
  static fromCounty(county: KenyanCounty): KenyanLocation {
    return new KenyanLocation({ county });
  }

  static fromCoordinates(lat: number, lng: number): KenyanLocation {
    // Reverse geocoding would happen here in production
    // For now, we create with just coordinates
    return new KenyanLocation({
      county: this.detectCountyFromCoordinates(lat, lng),
      gpsCoordinates: { latitude: lat, longitude: lng },
    });
  }

  // Business logic methods
  getCustomaryLawType(): CustomaryLawType {
    // Map counties to customary law types
    const customaryLawMap: Record<KenyanCounty, CustomaryLawType> = {
      [KenyanCounty.KIKUYU]: CustomaryLawType.KIKUYU,
      [KenyanCounty.NAKURU]: CustomaryLawType.KIKUYU,
      [KenyanCounty.NYERI]: CustomaryLawType.KIKUYU,
      [KenyanCounty.MURANGA]: CustomaryLawType.KIKUYU,
      [KenyanCounty.KIAMBU]: CustomaryLawType.KIKUYU,

      [KenyanCounty.SIAYA]: CustomaryLawType.LUO,
      [KenyanCounty.KISUMU]: CustomaryLawType.LUO,
      [KenyanCounty.HOMA_BAY]: CustomaryLawType.LUO,
      [KenyanCounty.MIGORI]: CustomaryLawType.LUO,

      [KenyanCounty.KALENJIN]: CustomaryLawType.KALENJIN,
      [KenyanCounty.UASIN_GISHU]: CustomaryLawType.KALENJIN,
      [KenyanCounty.NANDI]: CustomaryLawType.KALENJIN,
      [KenyanCounty.KERICHO]: CustomaryLawType.KALENJIN,
      [KenyanCounty.BOMET]: CustomaryLawType.KALENJIN,

      [KenyanCounty.MOMBASA]: CustomaryLawType.SWAHILI,
      [KenyanCounty.KILIFI]: CustomaryLawType.SWAHILI,
      [KenyanCounty.KWALE]: CustomaryLawType.SWAHILI,
      [KenyanCounty.LAMU]: CustomaryLawType.SWAHILI,

      // ... other mappings
    };

    return customaryLawMap[this._value.county] || CustomaryLawType.GENERAL;
  }

  isUrbanArea(): boolean {
    const urbanCounties = [
      KenyanCounty.NAIROBI,
      KenyanCounty.MOMBASA,
      KenyanCounty.KISUMU,
      KenyanCounty.NAKURU,
      KenyanCounty.ELDORET, // Note: UASIN_GISHU
    ];

    return urbanCounties.includes(this._value.county);
  }

  // For land succession - different counties have different inheritance patterns
  getInheritancePattern(): InheritancePattern {
    if (this.isUrbanArea()) {
      return InheritancePattern.STATUTORY; // Urban areas follow statutory law
    }

    // Rural areas may follow customary law
    return this.getCustomaryLawType().inheritancePattern;
  }

  // Formatting methods
  getFullAddress(): string {
    const parts = [
      this._value.village,
      this._value.ward,
      this._value.subCounty,
      this._value.county,
      'Kenya',
    ].filter(Boolean);

    return parts.join(', ');
  }

  getShortAddress(): string {
    if (this._value.subCounty && this._value.county === KenyanCounty.NAIROBI) {
      return `${this._value.subCounty}, ${this._value.county}`;
    }
    return this._value.county.toString();
  }

  // Helper method (simplified)
  private static detectCountyFromCoordinates(lat: number, lng: number): KenyanCounty {
    // In production, this would use a geocoding service
    // Simplified version for demonstration
    if (lat > -1.3 && lat < -1.2 && lng > 36.7 && lng < 36.9) {
      return KenyanCounty.NAIROBI;
    }
    if (lat > -4.0 && lat < -3.9 && lng > 39.6 && lng < 39.7) {
      return KenyanCounty.MOMBASA;
    }
    // Default to Nairobi
    return KenyanCounty.NAIROBI;
  }

  // Getters
  get county(): KenyanCounty {
    return this._value.county;
  }

  get subCounty(): string | undefined {
    return this._value.subCounty;
  }

  get ward(): string | undefined {
    return this._value.ward;
  }

  get village(): string | undefined {
    return this._value.village;
  }

  get coordinates(): { latitude: number; longitude: number } | undefined {
    return this._value.gpsCoordinates;
  }

  // For legal documents
  get legalDescription(): string {
    if (this._value.village && this._value.ward) {
      return `Village of ${this._value.village}, Ward of ${this._value.ward}, ${this._value.county} County`;
    }
    return `${this._value.county} County`;
  }
}
