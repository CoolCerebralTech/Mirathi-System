import { ValueObject } from '../base/value-object';
import {
  InvalidCountyException,
  LocationOutOfBoundsException,
} from '../exceptions/location.exception';

// Enum for the 47 Counties of Kenya (Constitutional Schedule 1)
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

// Dominant customary law types for inheritance determination
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
  ISLAMIC = 'ISLAMIC', // Not strictly customary, but behaves similarly in succession jurisdiction
  HINDU = 'HINDU',
  STATUTORY = 'STATUTORY', // For cosmopolitan/urban areas
  GENERAL = 'GENERAL',
}

export enum InheritancePattern {
  PRIMOGENITURE = 'PRIMOGENITURE', // First son inherits (Luo, Maasai)
  ULTIMOGENITURE = 'ULTIMOGENITURE', // Last son inherits (Kikuyu - 'Muramati')
  EQUAL_DISTRIBUTION = 'EQUAL_DISTRIBUTION', // Equal shares (Statutory / Luhya)
  MATRILINEAL = 'MATRILINEAL', // Through mother's line (some coastal communities)
  ISLAMIC = 'ISLAMIC', // Quranic shares
}

interface KenyanLocationProps {
  county: KenyanCounty;
  subCounty?: string;
  ward?: string;
  village?: string;
  location?: string; // Administrative location
  subLocation?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export class KenyanLocation extends ValueObject<KenyanLocationProps> {
  // Static Data: Mapping Counties to Customary Law & Urban Status
  // This helps determine if S.35 (Statutory) or Customary Law likely applies
  private static readonly COUNTY_DATA: ReadonlyMap<
    KenyanCounty,
    {
      capital: string;
      customaryLaw: CustomaryLawType[];
      isFormallyUrban: boolean;
    }
  > = new Map([
    // COAST
    [
      KenyanCounty.MOMBASA,
      {
        capital: 'Mombasa',
        customaryLaw: [CustomaryLawType.SWAHILI, CustomaryLawType.ISLAMIC],
        isFormallyUrban: true,
      },
    ],
    [
      KenyanCounty.KWALE,
      {
        capital: 'Kwale',
        customaryLaw: [CustomaryLawType.MIIKENDA, CustomaryLawType.ISLAMIC],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.KILIFI,
      { capital: 'Kilifi', customaryLaw: [CustomaryLawType.MIIKENDA], isFormallyUrban: false },
    ],
    [
      KenyanCounty.TANA_RIVER,
      { capital: 'Hola', customaryLaw: [CustomaryLawType.SOMALI], isFormallyUrban: false },
    ],
    [
      KenyanCounty.LAMU,
      { capital: 'Lamu', customaryLaw: [CustomaryLawType.SWAHILI], isFormallyUrban: false },
    ],
    [
      KenyanCounty.TAITA_TAVETA,
      { capital: 'Mwatate', customaryLaw: [CustomaryLawType.GENERAL], isFormallyUrban: false },
    ],
    // NORTH EASTERN
    [
      KenyanCounty.GARISSA,
      { capital: 'Garissa', customaryLaw: [CustomaryLawType.SOMALI], isFormallyUrban: false },
    ],
    [
      KenyanCounty.WAJIR,
      { capital: 'Wajir', customaryLaw: [CustomaryLawType.SOMALI], isFormallyUrban: false },
    ],
    [
      KenyanCounty.MANDERA,
      { capital: 'Mandera', customaryLaw: [CustomaryLawType.SOMALI], isFormallyUrban: false },
    ],
    // EASTERN
    [
      KenyanCounty.MARSABIT,
      {
        capital: 'Marsabit',
        customaryLaw: [CustomaryLawType.SOMALI, CustomaryLawType.TURKANA],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.ISIOLO,
      { capital: 'Isiolo', customaryLaw: [CustomaryLawType.SOMALI], isFormallyUrban: false },
    ],
    [
      KenyanCounty.MERU,
      { capital: 'Meru', customaryLaw: [CustomaryLawType.MERU], isFormallyUrban: false },
    ],
    [
      KenyanCounty.THARAKA_NITHI,
      { capital: 'Kathwana', customaryLaw: [CustomaryLawType.MERU], isFormallyUrban: false },
    ],
    [
      KenyanCounty.EMBU,
      { capital: 'Embu', customaryLaw: [CustomaryLawType.MERU], isFormallyUrban: false },
    ],
    [
      KenyanCounty.KITUI,
      { capital: 'Kitui', customaryLaw: [CustomaryLawType.KAMBA], isFormallyUrban: false },
    ],
    [
      KenyanCounty.MACHAKOS,
      { capital: 'Machakos', customaryLaw: [CustomaryLawType.KAMBA], isFormallyUrban: true },
    ],
    [
      KenyanCounty.MAKUENI,
      { capital: 'Wote', customaryLaw: [CustomaryLawType.KAMBA], isFormallyUrban: false },
    ],
    // CENTRAL
    [
      KenyanCounty.NYANDARUA,
      { capital: 'Ol Kalou', customaryLaw: [CustomaryLawType.KIKUYU], isFormallyUrban: false },
    ],
    [
      KenyanCounty.NYERI,
      { capital: 'Nyeri', customaryLaw: [CustomaryLawType.KIKUYU], isFormallyUrban: false },
    ],
    [
      KenyanCounty.KIRINYAGA,
      { capital: 'Kerugoya', customaryLaw: [CustomaryLawType.KIKUYU], isFormallyUrban: false },
    ],
    [
      KenyanCounty.MURANGA,
      { capital: "Murang'a", customaryLaw: [CustomaryLawType.KIKUYU], isFormallyUrban: false },
    ],
    [
      KenyanCounty.KIAMBU,
      { capital: 'Kiambu', customaryLaw: [CustomaryLawType.KIKUYU], isFormallyUrban: true },
    ],
    // RIFT VALLEY
    [
      KenyanCounty.TURKANA,
      { capital: 'Lodwar', customaryLaw: [CustomaryLawType.TURKANA], isFormallyUrban: false },
    ],
    [
      KenyanCounty.WEST_POKOT,
      { capital: 'Kapenguria', customaryLaw: [CustomaryLawType.KALENJIN], isFormallyUrban: false },
    ],
    [
      KenyanCounty.SAMBURU,
      { capital: 'Maralal', customaryLaw: [CustomaryLawType.MAASAI], isFormallyUrban: false },
    ],
    [
      KenyanCounty.TRANS_NZOIA,
      {
        capital: 'Kitale',
        customaryLaw: [CustomaryLawType.LUHYA, CustomaryLawType.KALENJIN],
        isFormallyUrban: false,
      },
    ],
    [
      KenyanCounty.UASIN_GISHU,
      { capital: 'Eldoret', customaryLaw: [CustomaryLawType.KALENJIN], isFormallyUrban: true },
    ],
    [
      KenyanCounty.ELGEYO_MARAKWET,
      { capital: 'Iten', customaryLaw: [CustomaryLawType.KALENJIN], isFormallyUrban: false },
    ],
    [
      KenyanCounty.NANDI,
      { capital: 'Kapsabet', customaryLaw: [CustomaryLawType.KALENJIN], isFormallyUrban: false },
    ],
    [
      KenyanCounty.BARINGO,
      { capital: 'Kabarnet', customaryLaw: [CustomaryLawType.KALENJIN], isFormallyUrban: false },
    ],
    [
      KenyanCounty.LAIKIPIA,
      { capital: 'Rumuruti', customaryLaw: [CustomaryLawType.KIKUYU], isFormallyUrban: false },
    ],
    [
      KenyanCounty.NAKURU,
      {
        capital: 'Nakuru',
        customaryLaw: [CustomaryLawType.KIKUYU, CustomaryLawType.KALENJIN],
        isFormallyUrban: true,
      },
    ],
    [
      KenyanCounty.NAROK,
      { capital: 'Narok', customaryLaw: [CustomaryLawType.MAASAI], isFormallyUrban: false },
    ],
    [
      KenyanCounty.KAJIADO,
      { capital: 'Kajiado', customaryLaw: [CustomaryLawType.MAASAI], isFormallyUrban: false },
    ],
    [
      KenyanCounty.KERICHO,
      { capital: 'Kericho', customaryLaw: [CustomaryLawType.KALENJIN], isFormallyUrban: false },
    ],
    [
      KenyanCounty.BOMET,
      { capital: 'Bomet', customaryLaw: [CustomaryLawType.KALENJIN], isFormallyUrban: false },
    ],
    // WESTERN
    [
      KenyanCounty.KAKAMEGA,
      { capital: 'Kakamega', customaryLaw: [CustomaryLawType.LUHYA], isFormallyUrban: false },
    ],
    [
      KenyanCounty.VIHIGA,
      { capital: 'Mbale', customaryLaw: [CustomaryLawType.LUHYA], isFormallyUrban: false },
    ],
    [
      KenyanCounty.BUNGOMA,
      { capital: 'Bungoma', customaryLaw: [CustomaryLawType.LUHYA], isFormallyUrban: false },
    ],
    [
      KenyanCounty.BUSIA,
      { capital: 'Busia', customaryLaw: [CustomaryLawType.LUHYA], isFormallyUrban: false },
    ],
    // NYANZA
    [
      KenyanCounty.SIAYA,
      { capital: 'Siaya', customaryLaw: [CustomaryLawType.LUO], isFormallyUrban: false },
    ],
    [
      KenyanCounty.KISUMU,
      { capital: 'Kisumu', customaryLaw: [CustomaryLawType.LUO], isFormallyUrban: true },
    ],
    [
      KenyanCounty.HOMA_BAY,
      { capital: 'Homa Bay', customaryLaw: [CustomaryLawType.LUO], isFormallyUrban: false },
    ],
    [
      KenyanCounty.MIGORI,
      { capital: 'Migori', customaryLaw: [CustomaryLawType.LUO], isFormallyUrban: false },
    ],
    [
      KenyanCounty.KISII,
      { capital: 'Kisii', customaryLaw: [CustomaryLawType.KISII], isFormallyUrban: false },
    ],
    [
      KenyanCounty.NYAMIRA,
      { capital: 'Nyamira', customaryLaw: [CustomaryLawType.KISII], isFormallyUrban: false },
    ],
    // NAIROBI
    [
      KenyanCounty.NAIROBI,
      { capital: 'Nairobi', customaryLaw: [CustomaryLawType.STATUTORY], isFormallyUrban: true },
    ],
  ]);

  private static readonly CUSTOMARY_INHERITANCE_PATTERNS: Readonly<
    Record<CustomaryLawType, InheritancePattern>
  > = {
    [CustomaryLawType.KIKUYU]: InheritancePattern.ULTIMOGENITURE,
    [CustomaryLawType.LUO]: InheritancePattern.PRIMOGENITURE,
    [CustomaryLawType.LUHYA]: InheritancePattern.EQUAL_DISTRIBUTION,
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
    [CustomaryLawType.HINDU]: InheritancePattern.EQUAL_DISTRIBUTION, // Via Hindu Succession Act
    [CustomaryLawType.STATUTORY]: InheritancePattern.EQUAL_DISTRIBUTION,
    [CustomaryLawType.GENERAL]: InheritancePattern.EQUAL_DISTRIBUTION,
  };

  constructor(props: KenyanLocationProps) {
    super(props);
  }

  protected validate(): void {
    // 1. Validate County
    if (!Object.values(KenyanCounty).includes(this.props.county)) {
      throw new InvalidCountyException(this.props.county, {
        provided: this.props.county,
      });
    }

    // 2. Validate GPS Coordinates
    if (this.props.gpsCoordinates) {
      const { latitude, longitude } = this.props.gpsCoordinates;
      this.validateCoordinates(latitude, longitude);
    }
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    // Kenya's Bounding Box (Approximate but inclusive)
    const MIN_LAT = -4.9; // South
    const MAX_LAT = 5.0; // North
    const MIN_LNG = 33.9; // West
    const MAX_LNG = 42.0; // East

    if (latitude < MIN_LAT || latitude > MAX_LAT) {
      throw new LocationOutOfBoundsException('latitude', latitude, MIN_LAT, MAX_LAT);
    }

    if (longitude < MIN_LNG || longitude > MAX_LNG) {
      throw new LocationOutOfBoundsException('longitude', longitude, MIN_LNG, MAX_LNG);
    }
  }

  // --- Factory Methods ---

  static fromCounty(county: KenyanCounty): KenyanLocation {
    return new KenyanLocation({ county });
  }

  static fromCoordinates(lat: number, lng: number): KenyanLocation {
    // Heuristic: Assign to County based on coordinates.
    // In "No MVP" production, this would call a GIS service, but as a Value Object,
    // we return a valid object with the 'best guess' or require county input.
    // For now, we allow creation with explicit coordinates and "unknown" county if logic permits,
    // but our Props require County. So we default to Nairobi if outside heuristic logic for now.

    // NOTE: In strict domain modeling, guessing the county from lat/long inside the VO
    // is brittle. We should create with known county.
    // However, if we MUST:
    const detected = this.detectCountyFromCoordinates(lat, lng);
    return new KenyanLocation({
      county: detected,
      gpsCoordinates: { latitude: lat, longitude: lng },
    });
  }

  // --- Business Logic ---

  getInheritancePattern(): InheritancePattern {
    // 1. Urban areas generally follow Statutory Law (S.35 LSA)
    if (this.isUrbanArea()) {
      return InheritancePattern.EQUAL_DISTRIBUTION;
    }

    // 2. Rural areas default to Customary Law unless overridden by Will
    const laws = this.getCustomaryLawType();

    // Return the dominant pattern for that county
    return (
      KenyanLocation.CUSTOMARY_INHERITANCE_PATTERNS[laws[0]] ||
      InheritancePattern.EQUAL_DISTRIBUTION
    );
  }

  getCustomaryLawType(): CustomaryLawType[] {
    const data = KenyanLocation.COUNTY_DATA.get(this.props.county);
    return data ? data.customaryLaw : [CustomaryLawType.GENERAL];
  }

  isUrbanArea(): boolean {
    const data = KenyanLocation.COUNTY_DATA.get(this.props.county);
    if (data?.isFormallyUrban) return true;

    // Check sub-county text for urban markers
    if (this.props.subCounty) {
      const markers = ['Town', 'Municipality', 'City', 'Metro'];
      return markers.some((m) => this.props.subCounty!.includes(m));
    }
    return false;
  }

  isAridOrSemiArid(): boolean {
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
    return asalCounties.includes(this.props.county);
  }

  getCourtJurisdiction(): string {
    // In Kenya, Succession causes are filed at the High Court or Magistrate Court
    // within the jurisdiction where the deceased resided or where assets are.
    const name = this.getCountyDisplayName();
    return `High Court of Kenya at ${name}`;
  }

  getCountyDisplayName(): string {
    return this.props.county
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  private static detectCountyFromCoordinates(lat: number, lng: number): KenyanCounty {
    // Very simplified bounding boxes for major centers
    // Nairobi
    if (lat > -1.4 && lat < -1.1 && lng > 36.6 && lng < 37.0) return KenyanCounty.NAIROBI;
    // Mombasa
    if (lat > -4.1 && lat < -3.9 && lng > 39.5 && lng < 39.8) return KenyanCounty.MOMBASA;
    // Kisumu
    if (lat > -0.2 && lat < 0.2 && lng > 34.6 && lng < 35.0) return KenyanCounty.KISUMU;

    // Default fallback
    return KenyanCounty.NAIROBI;
  }

  public toJSON(): Record<string, any> {
    return {
      county: this.props.county,
      countyName: this.getCountyDisplayName(),
      subCounty: this.props.subCounty,
      ward: this.props.ward,
      village: this.props.village,
      isUrban: this.isUrbanArea(),
      inheritancePattern: this.getInheritancePattern(),
      coordinates: this.props.gpsCoordinates,
    };
  }
}
