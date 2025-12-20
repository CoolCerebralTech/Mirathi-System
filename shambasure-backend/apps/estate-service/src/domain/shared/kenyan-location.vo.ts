// src/shared/domain/value-objects/kenyan-location.vo.ts
import { ValueObject } from '../base/value-object';
import { InvalidLocationException } from '../exceptions/location.exception';

// Enum for the 47 Counties of Kenya
export enum KenyanCounty {
  MOMBASA = 'MOMBASA',
  KWALE = 'KWALE',
  KILIFI = 'KILIFI',
  TANA_RIVER = 'TANA_RIVER',
  LAMU = 'LAMU',
  TAITA_TAVETA = 'TAITA_TAVETA',
  GARISSA = 'GARISSA',
  WAJIR = 'WAJIR',
  MANDERA = 'MANDERA',
  MARSABIT = 'MARSABIT',
  ISIOLO = 'ISIOLO',
  MERU = 'MERU',
  THARAKA_NITHI = 'THARAKA_NITHI',
  EMBU = 'EMBU',
  KITUI = 'KITUI',
  MACHAKOS = 'MACHAKOS',
  MAKUENI = 'MAKUENI',
  NYANDARUA = 'NYANDARUA',
  NYERI = 'NYERI',
  KIRINYAGA = 'KIRINYAGA',
  MURANGA = 'MURANGA',
  KIAMBU = 'KIAMBU',
  TURKANA = 'TURKANA',
  WEST_POKOT = 'WEST_POKOT',
  SAMBURU = 'SAMBURU',
  TRANS_NZOIA = 'TRANS_NZOIA',
  UASIN_GISHU = 'UASIN_GISHU',
  ELGEYO_MARAKWET = 'ELGEYO_MARAKWET',
  NANDI = 'NANDI',
  BARINGO = 'BARINGO',
  LAIKIPIA = 'LAIKIPIA',
  NAKURU = 'NAKURU',
  NAROK = 'NAROK',
  KAJIADO = 'KAJIADO',
  KERICHO = 'KERICHO',
  BOMET = 'BOMET',
  KAKAMEGA = 'KAKAMEGA',
  VIHIGA = 'VIHIGA',
  BUNGOMA = 'BUNGOMA',
  BUSIA = 'BUSIA',
  SIAYA = 'SIAYA',
  KISUMU = 'KISUMU',
  HOMA_BAY = 'HOMA_BAY',
  MIGORI = 'MIGORI',
  KISII = 'KISII',
  NYAMIRA = 'NYAMIRA',
  NAIROBI = 'NAIROBI',
}

// Customary law types for inheritance determination
export enum CustomaryLawType {
  KIKUYU = 'KIKUYU',
  LUO = 'LUO',
  LUHYA = 'LUHYA',
  KALENJIN = 'KALENJIN',
  KAMBA = 'KAMBA',
  MERU = 'MERU',
  KISII = 'KISII',
  MAASAI = 'MAASAI',
  TURKANA = 'TURKANA',
  SOMALI = 'SOMALI',
  MIIKENDA = 'MIIKENDA',
  SWAHILI = 'SWAHILI',
  ISLAMIC = 'ISLAMIC',
  HINDU = 'HINDU',
  STATUTORY = 'STATUTORY', // For urban/educated families
  GENERAL = 'GENERAL',
}

export enum InheritancePattern {
  PRIMOGENITURE = 'PRIMOGENITURE', // First son inherits (Luo, Maasai)
  ULTIMOGENITURE = 'ULTIMOGENITURE', // Last son inherits (Kikuyu)
  EQUAL_DISTRIBUTION = 'EQUAL_DISTRIBUTION', // Equal shares (Statutory)
  HOUSE_SYSTEM = 'HOUSE_SYSTEM', // Polygamous families (S.40 LSA)
  MATRILINEAL = 'MATRILINEAL', // Through mother's line (some coastal communities)
  NONE = 'NONE',
  ISLAMIC = 'ISLAMIC',
  STATUTORY = 'STATUTORY', // No fixed pattern
}

interface KenyanLocationProps {
  county: KenyanCounty;
  subCounty?: string;
  ward?: string;
  village?: string;
  location?: string; // Administrative location (for rural areas)
  subLocation?: string;
  constituency?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export class KenyanLocation extends ValueObject<KenyanLocationProps> {
  // Complete Kenyan administrative hierarchy cache for all 47 counties
  private static readonly COUNTY_DATA: Map<
    KenyanCounty,
    {
      capital: string;
      region: string;
      customaryLaw: CustomaryLawType[];
      isFormallyUrban: boolean;
    }
  > = new Map([
    // COAST REGION
    [
      KenyanCounty.MOMBASA,
      {
        capital: 'Mombasa',
        region: 'Coast',
        customaryLaw: [
          CustomaryLawType.SWAHILI,
          CustomaryLawType.ISLAMIC,
          CustomaryLawType.MIIKENDA,
        ],
        isFormallyUrban: true,
      },
    ],
    [
      KenyanCounty.KWALE,
      {
        capital: 'Kwale',
        region: 'Coast',
        customaryLaw: [CustomaryLawType.MIIKENDA, CustomaryLawType.ISLAMIC],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.KILIFI,
      {
        capital: 'Kilifi',
        region: 'Coast',
        customaryLaw: [CustomaryLawType.MIIKENDA, CustomaryLawType.ISLAMIC],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.TANA_RIVER,
      {
        capital: 'Hola',
        region: 'Coast',
        customaryLaw: [CustomaryLawType.SOMALI, CustomaryLawType.ISLAMIC],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.LAMU,
      {
        capital: 'Lamu',
        region: 'Coast',
        customaryLaw: [CustomaryLawType.SWAHILI, CustomaryLawType.ISLAMIC],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.TAITA_TAVETA,
      {
        capital: 'Mwatate',
        region: 'Coast',
        customaryLaw: [CustomaryLawType.GENERAL],
        isFormallyUrban: false,
      },
    ],

    // NORTH EASTERN REGION
    [
      KenyanCounty.GARISSA,
      {
        capital: 'Garissa',
        region: 'North Eastern',
        customaryLaw: [CustomaryLawType.SOMALI, CustomaryLawType.ISLAMIC],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.WAJIR,
      {
        capital: 'Wajir',
        region: 'North Eastern',
        customaryLaw: [CustomaryLawType.SOMALI, CustomaryLawType.ISLAMIC],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.MANDERA,
      {
        capital: 'Mandera',
        region: 'North Eastern',
        customaryLaw: [CustomaryLawType.SOMALI, CustomaryLawType.ISLAMIC],
        isFormallyUrban: false,
      },
    ],

    // EASTERN REGION
    [
      KenyanCounty.MARSABIT,
      {
        capital: 'Marsabit',
        region: 'Eastern',
        customaryLaw: [CustomaryLawType.SOMALI, CustomaryLawType.TURKANA],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.ISIOLO,
      {
        capital: 'Isiolo',
        region: 'Eastern',
        customaryLaw: [CustomaryLawType.SOMALI, CustomaryLawType.ISLAMIC],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.MERU,
      {
        capital: 'Meru',
        region: 'Eastern',
        customaryLaw: [CustomaryLawType.MERU],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.THARAKA_NITHI,
      {
        capital: 'Kathwana',
        region: 'Eastern',
        customaryLaw: [CustomaryLawType.MERU],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.EMBU,
      {
        capital: 'Embu',
        region: 'Eastern',
        customaryLaw: [CustomaryLawType.MERU],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.KITUI,
      {
        capital: 'Kitui',
        region: 'Eastern',
        customaryLaw: [CustomaryLawType.KAMBA],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.MACHAKOS,
      {
        capital: 'Machakos',
        region: 'Eastern',
        customaryLaw: [CustomaryLawType.KAMBA],
        isFormallyUrban: true,
      },
    ],
    [
      KenyanCounty.MAKUENI,
      {
        capital: 'Wote',
        region: 'Eastern',
        customaryLaw: [CustomaryLawType.KAMBA],
        isFormallyUrban: false,
      },
    ],

    // CENTRAL REGION
    [
      KenyanCounty.NYANDARUA,
      {
        capital: 'Ol Kalou',
        region: 'Central',
        customaryLaw: [CustomaryLawType.KIKUYU],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.NYERI,
      {
        capital: 'Nyeri',
        region: 'Central',
        customaryLaw: [CustomaryLawType.KIKUYU],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.KIRINYAGA,
      {
        capital: 'Kerugoya',
        region: 'Central',
        customaryLaw: [CustomaryLawType.KIKUYU],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.MURANGA,
      {
        capital: "Murang'a",
        region: 'Central',
        customaryLaw: [CustomaryLawType.KIKUYU],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.KIAMBU,
      {
        capital: 'Kiambu',
        region: 'Central',
        customaryLaw: [CustomaryLawType.KIKUYU],
        isFormallyUrban: true,
      },
    ],

    // RIFT VALLEY REGION
    [
      KenyanCounty.TURKANA,
      {
        capital: 'Lodwar',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.TURKANA],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.WEST_POKOT,
      {
        capital: 'Kapenguria',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.KALENJIN],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.SAMBURU,
      {
        capital: 'Maralal',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.MAASAI],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.TRANS_NZOIA,
      {
        capital: 'Kitale',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.KALENJIN, CustomaryLawType.LUHYA],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.UASIN_GISHU,
      {
        capital: 'Eldoret',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.KALENJIN],
        isFormallyUrban: true,
      },
    ],
    [
      KenyanCounty.ELGEYO_MARAKWET,
      {
        capital: 'Iten',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.KALENJIN],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.NANDI,
      {
        capital: 'Kapsabet',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.KALENJIN],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.BARINGO,
      {
        capital: 'Kabarnet',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.KALENJIN],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.LAIKIPIA,
      {
        capital: 'Rumuruti',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.KIKUYU, CustomaryLawType.MAASAI],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.NAKURU,
      {
        capital: 'Nakuru',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.KIKUYU, CustomaryLawType.KALENJIN],
        isFormallyUrban: true,
      },
    ],
    [
      KenyanCounty.NAROK,
      {
        capital: 'Narok',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.MAASAI],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.KAJIADO,
      {
        capital: 'Kajiado',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.MAASAI],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.KERICHO,
      {
        capital: 'Kericho',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.KALENJIN],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.BOMET,
      {
        capital: 'Bomet',
        region: 'Rift Valley',
        customaryLaw: [CustomaryLawType.KALENJIN],
        isFormallyUrban: false,
      },
    ],

    // WESTERN REGION
    [
      KenyanCounty.KAKAMEGA,
      {
        capital: 'Kakamega',
        region: 'Western',
        customaryLaw: [CustomaryLawType.LUHYA],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.VIHIGA,
      {
        capital: 'Mbale',
        region: 'Western',
        customaryLaw: [CustomaryLawType.LUHYA],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.BUNGOMA,
      {
        capital: 'Bungoma',
        region: 'Western',
        customaryLaw: [CustomaryLawType.LUHYA],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.BUSIA,
      {
        capital: 'Busia',
        region: 'Western',
        customaryLaw: [CustomaryLawType.LUHYA],
        isFormallyUrban: false,
      },
    ],

    // NYANZA REGION
    [
      KenyanCounty.SIAYA,
      {
        capital: 'Siaya',
        region: 'Nyanza',
        customaryLaw: [CustomaryLawType.LUO],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.KISUMU,
      {
        capital: 'Kisumu',
        region: 'Nyanza',
        customaryLaw: [CustomaryLawType.LUO],
        isFormallyUrban: true,
      },
    ],
    [
      KenyanCounty.HOMA_BAY,
      {
        capital: 'Homa Bay',
        region: 'Nyanza',
        customaryLaw: [CustomaryLawType.LUO],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.MIGORI,
      {
        capital: 'Migori',
        region: 'Nyanza',
        customaryLaw: [CustomaryLawType.LUO],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.KISII,
      {
        capital: 'Kisii',
        region: 'Nyanza',
        customaryLaw: [CustomaryLawType.KISII],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.NYAMIRA,
      {
        capital: 'Nyamira',
        region: 'Nyanza',
        customaryLaw: [CustomaryLawType.KISII],
        isFormallyUrban: false,
      },
    ],

    // NAIROBI REGION
    [
      KenyanCounty.NAIROBI,
      {
        capital: 'Nairobi',
        region: 'Nairobi',
        customaryLaw: [CustomaryLawType.STATUTORY],
        isFormallyUrban: true,
      },
    ],
  ]);

  // Customary law inheritance patterns
  private static readonly CUSTOMARY_INHERITANCE_PATTERNS: Record<
    CustomaryLawType,
    InheritancePattern
  > = {
    [CustomaryLawType.KIKUYU]: InheritancePattern.ULTIMOGENITURE, // Last son (mûramati)
    [CustomaryLawType.LUO]: InheritancePattern.PRIMOGENITURE, // First son (wuon lowo)
    [CustomaryLawType.LUHYA]: InheritancePattern.EQUAL_DISTRIBUTION, // More egalitarian
    [CustomaryLawType.KALENJIN]: InheritancePattern.PRIMOGENITURE,
    [CustomaryLawType.KAMBA]: InheritancePattern.ULTIMOGENITURE,
    [CustomaryLawType.MERU]: InheritancePattern.PRIMOGENITURE,
    [CustomaryLawType.KISII]: InheritancePattern.PRIMOGENITURE,
    [CustomaryLawType.MAASAI]: InheritancePattern.PRIMOGENITURE,
    [CustomaryLawType.TURKANA]: InheritancePattern.PRIMOGENITURE,
    [CustomaryLawType.SOMALI]: InheritancePattern.ISLAMIC,
    [CustomaryLawType.MIIKENDA]: InheritancePattern.MATRILINEAL,
    [CustomaryLawType.SWAHILI]: InheritancePattern.ISLAMIC,
    [CustomaryLawType.ISLAMIC]: InheritancePattern.ISLAMIC,
    [CustomaryLawType.HINDU]: InheritancePattern.STATUTORY,
    [CustomaryLawType.STATUTORY]: InheritancePattern.EQUAL_DISTRIBUTION,
    [CustomaryLawType.GENERAL]: InheritancePattern.EQUAL_DISTRIBUTION,
  };

  constructor(props: KenyanLocationProps) {
    super(props);
  }

  protected validate(): void {
    // County validation
    if (!Object.values(KenyanCounty).includes(this._value.county)) {
      throw new InvalidLocationException(`Invalid Kenyan county: ${this._value.county}`);
    }

    // Note: Sub-county validation against hardcoded lists has been removed to reduce maintenance overhead.
    // In a real system, this should optionally validate against a database of administrative units.

    // GPS coordinates validation
    if (this._value.gpsCoordinates) {
      const { latitude, longitude } = this._value.gpsCoordinates;
      this.validateCoordinates(latitude, longitude);
    }
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    // Kenya's geographical bounds (approximate)
    const KENYA_BOUNDS = {
      minLat: -4.9, // South
      maxLat: 5.0, // North
      minLng: 33.9, // West
      maxLng: 42.0, // East
    };

    if (latitude < KENYA_BOUNDS.minLat || latitude > KENYA_BOUNDS.maxLat) {
      throw new InvalidLocationException(
        `Latitude ${latitude}° is outside Kenya's bounds (${KENYA_BOUNDS.minLat}° to ${KENYA_BOUNDS.maxLat}°)`,
      );
    }

    if (longitude < KENYA_BOUNDS.minLng || longitude > KENYA_BOUNDS.maxLng) {
      throw new InvalidLocationException(
        `Longitude ${longitude}° is outside Kenya's bounds (${KENYA_BOUNDS.minLng}° to ${KENYA_BOUNDS.maxLng}°)`,
      );
    }
  }

  // Factory methods
  static fromCounty(county: KenyanCounty): KenyanLocation {
    return new KenyanLocation({ county });
  }

  static fromCoordinates(lat: number, lng: number): KenyanLocation {
    // In production, this would use a reverse geocoding service
    const detectedCounty = this.detectCountyFromCoordinates(lat, lng);
    return new KenyanLocation({
      county: detectedCounty,
      gpsCoordinates: { latitude: lat, longitude: lng },
    });
  }

  // Business logic methods
  getCustomaryLawType(): CustomaryLawType[] {
    const countyData = KenyanLocation.COUNTY_DATA.get(this._value.county);
    return countyData?.customaryLaw || [CustomaryLawType.GENERAL];
  }

  getInheritancePattern(): InheritancePattern {
    // Urban areas generally follow statutory law
    if (this.isUrbanArea()) {
      return InheritancePattern.EQUAL_DISTRIBUTION; // S.35 LSA
    }

    // Rural areas follow customary law
    const customaryLaws = this.getCustomaryLawType();
    if (customaryLaws.length === 1) {
      return KenyanLocation.CUSTOMARY_INHERITANCE_PATTERNS[customaryLaws[0]];
    }

    // Mixed customary law areas - use most common pattern
    const patterns = customaryLaws.map((law) => KenyanLocation.CUSTOMARY_INHERITANCE_PATTERNS[law]);
    return patterns[0] || InheritancePattern.EQUAL_DISTRIBUTION;
  }

  isUrbanArea(): boolean {
    // Check county-level urban status
    const countyData = KenyanLocation.COUNTY_DATA.get(this._value.county);
    if (countyData?.isFormallyUrban) {
      return true;
    }

    // Fallback: Check if sub-county string contains urban indicators if provided
    if (this._value.subCounty) {
      const urbanIndicators = ['Town', 'Municipality', 'City', 'Metro'];
      return urbanIndicators.some((indicator) =>
        this._value.subCounty!.toLowerCase().includes(indicator.toLowerCase()),
      );
    }

    return false;
  }

  isAgriculturalArea(): boolean {
    const agriculturalCounties = [
      KenyanCounty.TRANS_NZOIA,
      KenyanCounty.UASIN_GISHU,
      KenyanCounty.NANDI,
      KenyanCounty.KERICHO,
      KenyanCounty.BOMET,
      KenyanCounty.NAROK,
      KenyanCounty.LAIKIPIA,
      KenyanCounty.NYANDARUA,
      KenyanCounty.NYERI,
      KenyanCounty.MURANGA,
      KenyanCounty.KIRINYAGA,
      KenyanCounty.EMBU,
      KenyanCounty.MERU,
      KenyanCounty.TAITA_TAVETA,
      KenyanCounty.HOMA_BAY,
    ];
    return agriculturalCounties.includes(this._value.county);
  }

  isAridOrSemiAridLand(): boolean {
    const asalCounties = [
      KenyanCounty.GARISSA,
      KenyanCounty.WAJIR,
      KenyanCounty.MANDERA,
      KenyanCounty.MARSABIT,
      KenyanCounty.ISIOLO,
      KenyanCounty.TURKANA,
      KenyanCounty.SAMBURU,
      KenyanCounty.BARINGO,
      KenyanCounty.WEST_POKOT,
      KenyanCounty.KAJIADO,
      KenyanCounty.KITUI,
      KenyanCounty.MAKUENI,
      KenyanCounty.TANA_RIVER,
      KenyanCounty.LAMU,
      KenyanCounty.KILIFI,
    ];
    return asalCounties.includes(this._value.county);
  }

  // For succession court jurisdiction
  getCourtJurisdiction(): string {
    const countyName = this.getCountyDisplayName();
    return `High Court of Kenya at ${countyName}`;
  }

  getProbateRegistry(): string {
    // Major counties have resident probate registries
    const probateRegistryCounties = [
      KenyanCounty.NAIROBI,
      KenyanCounty.MOMBASA,
      KenyanCounty.KISUMU,
      KenyanCounty.NAKURU,
      KenyanCounty.UASIN_GISHU, // Eldoret is in Uasin Gishu
      KenyanCounty.KAKAMEGA,
      KenyanCounty.EMBU,
      KenyanCounty.MERU,
      KenyanCounty.NYERI,
      KenyanCounty.MACHAKOS,
    ];

    if (probateRegistryCounties.includes(this._value.county)) {
      return `Probate Registry at ${this.getCountyDisplayName()}`;
    }

    // Use nearest registry
    return `Probate Registry at Nairobi (nearest to ${this.getCountyDisplayName()})`;
  }

  // Formatting methods
  getFullAddress(): string {
    const parts = [
      this._value.village,
      this._value.location,
      this._value.subLocation,
      this._value.ward,
      this._value.subCounty,
      `${this.getCountyDisplayName()} County`,
      'Kenya',
    ].filter(Boolean);

    return parts.join(', ');
  }

  getLegalDescription(): string {
    if (this._value.village && this._value.location) {
      return `of ${this._value.village} Village, ${this._value.location} Location, ${this.getCountyDisplayName()} County`;
    }
    if (this._value.subCounty) {
      return `of ${this._value.subCounty} Sub-County, ${this.getCountyDisplayName()} County`;
    }
    return `of ${this.getCountyDisplayName()} County`;
  }

  getCountyDisplayName(): string {
    // Convert enum to display name (e.g., "NAIROBI" -> "Nairobi")
    return this._value.county
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Helper method for coordinate detection (simplified)
  private static detectCountyFromCoordinates(lat: number, lng: number): KenyanCounty {
    // Simplified county detection based on coordinates
    // In production, use a proper geocoding service

    // Nairobi area
    if (lat > -1.4 && lat < -1.1 && lng > 36.6 && lng < 37.0) {
      return KenyanCounty.NAIROBI;
    }
    // Mombasa area
    if (lat > -4.1 && lat < -3.9 && lng > 39.5 && lng < 39.8) {
      return KenyanCounty.MOMBASA;
    }
    // Kisumu area
    if (lat > -0.2 && lat < 0.2 && lng > 34.6 && lng < 35.0) {
      return KenyanCounty.KISUMU;
    }
    // Nakuru area
    if (lat > -0.5 && lat < -0.1 && lng > 35.9 && lng < 36.3) {
      return KenyanCounty.NAKURU;
    }
    // Default to Nairobi for unknown coordinates
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

  get location(): string | undefined {
    return this._value.location;
  }

  get coordinates(): { latitude: number; longitude: number } | undefined {
    return this._value.gpsCoordinates;
  }

  get region(): string {
    const countyData = KenyanLocation.COUNTY_DATA.get(this._value.county);
    return countyData?.region || 'Unknown';
  }

  get capital(): string {
    const countyData = KenyanLocation.COUNTY_DATA.get(this._value.county);
    return countyData?.capital || this.getCountyDisplayName();
  }

  // For API responses
  toJSON() {
    return {
      county: this._value.county,
      countyDisplayName: this.getCountyDisplayName(),
      subCounty: this._value.subCounty,
      ward: this._value.ward,
      village: this._value.village,
      location: this._value.location,
      region: this.region,
      capital: this.capital,
      isUrban: this.isUrbanArea(),
      isAgricultural: this.isAgriculturalArea(),
      isASAL: this.isAridOrSemiAridLand(),
      customaryLaw: this.getCustomaryLawType(),
      inheritancePattern: this.getInheritancePattern(),
      courtJurisdiction: this.getCourtJurisdiction(),
      probateRegistry: this.getProbateRegistry(),
      coordinates: this._value.gpsCoordinates,
    };
  }
}
