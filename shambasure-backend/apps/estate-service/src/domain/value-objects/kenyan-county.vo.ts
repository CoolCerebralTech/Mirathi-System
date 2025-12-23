// domain/value-objects/kenyan-county.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Kenyan County Value Object
 *
 * Legal Context:
 * - Land Registry is county-based (Land Registration Act, 2012)
 * - Probate jurisdiction determined by county of death
 * - Stamp duty rates vary by county
 * - Court stations are county-based
 *
 * Business Rules:
 * - Assets must specify county for valuation
 * - Probate application filed in county where deceased lived/died
 * - Land transfers require county lands office
 */

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

export class KenyanCountyVO extends SimpleValueObject<KenyanCounty> {
  private constructor(value: KenyanCounty) {
    super(value);
  }

  public static create(value: string): KenyanCountyVO {
    const normalized = value.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');

    if (!Object.values(KenyanCounty).includes(normalized as KenyanCounty)) {
      throw new ValueObjectValidationError(
        `Invalid Kenyan county: ${value}. Must be one of the 47 counties.`,
        'county',
      );
    }

    return new KenyanCountyVO(normalized as KenyanCounty);
  }

  // Factory methods for major counties
  public static nairobi(): KenyanCountyVO {
    return new KenyanCountyVO(KenyanCounty.NAIROBI);
  }

  public static mombasa(): KenyanCountyVO {
    return new KenyanCountyVO(KenyanCounty.MOMBASA);
  }

  public static kisumu(): KenyanCountyVO {
    return new KenyanCountyVO(KenyanCounty.KISUMU);
  }

  public static nakuru(): KenyanCountyVO {
    return new KenyanCountyVO(KenyanCounty.NAKURU);
  }

  protected validate(): void {
    if (!this.props.value) {
      throw new ValueObjectValidationError('County cannot be empty');
    }

    if (!Object.values(KenyanCounty).includes(this.props.value)) {
      throw new ValueObjectValidationError(`Invalid county: ${this.props.value}`);
    }
  }

  /**
   * Get display name (e.g., "Elgeyo Marakwet")
   */
  public getDisplayName(): string {
    return this.value
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get county code (for government systems)
   */
  public getCountyCode(): string {
    const index = Object.values(KenyanCounty).indexOf(this.value);
    return (index + 1).toString().padStart(2, '0'); // 01-47
  }

  /**
   * Get main court station
   */
  public getMainCourtStation(): string {
    // Major court stations by county
    const stations: Record<KenyanCounty, string> = {
      [KenyanCounty.NAIROBI]: 'Milimani Law Courts',
      [KenyanCounty.MOMBASA]: 'Mombasa Law Courts',
      [KenyanCounty.KISUMU]: 'Kisumu Law Courts',
      [KenyanCounty.NAKURU]: 'Nakuru Law Courts',
      [KenyanCounty.KIAMBU]: 'Kiambu Law Courts',
      [KenyanCounty.MACHAKOS]: 'Machakos Law Courts',
      [KenyanCounty.KAKAMEGA]: 'Kakamega Law Courts',
      [KenyanCounty.NYERI]: 'Nyeri Law Courts',
      [KenyanCounty.MERU]: 'Meru Law Courts',
      [KenyanCounty.UASIN_GISHU]: 'Eldoret Law Courts',
      // Default for others
    } as Record<KenyanCounty, string>;

    return stations[this.value] || `${this.getDisplayName()} Law Courts`;
  }

  /**
   * Get lands registry office
   */
  public getLandsRegistryOffice(): string {
    return `${this.getDisplayName()} Lands Registry`;
  }

  /**
   * Check if coastal county (affects customary law)
   */
  public isCoastalCounty(): boolean {
    return [
      KenyanCounty.MOMBASA,
      KenyanCounty.KILIFI,
      KenyanCounty.KWALE,
      KenyanCounty.LAMU,
      KenyanCounty.TANA_RIVER,
      KenyanCounty.TAITA_TAVETA,
    ].includes(this.value);
  }

  /**
   * Check if pastoral county (livestock common)
   */
  public isPastoralCounty(): boolean {
    return [
      KenyanCounty.TURKANA,
      KenyanCounty.MARSABIT,
      KenyanCounty.SAMBURU,
      KenyanCounty.WAJIR,
      KenyanCounty.MANDERA,
      KenyanCounty.ISIOLO,
      KenyanCounty.GARISSA,
      KenyanCounty.WEST_POKOT,
      KenyanCounty.BARINGO,
    ].includes(this.value);
  }

  /**
   * Check if metropolitan county
   */
  public isMetropolitan(): boolean {
    return [KenyanCounty.NAIROBI, KenyanCounty.MOMBASA, KenyanCounty.KISUMU].includes(this.value);
  }

  /**
   * Get region
   */
  public getRegion():
    | 'CENTRAL'
    | 'COAST'
    | 'EASTERN'
    | 'NAIROBI'
    | 'NORTH_EASTERN'
    | 'NYANZA'
    | 'RIFT_VALLEY'
    | 'WESTERN' {
    const regionMap: Record<KenyanCounty, string> = {
      [KenyanCounty.NAIROBI]: 'NAIROBI',
      [KenyanCounty.MOMBASA]: 'COAST',
      [KenyanCounty.KILIFI]: 'COAST',
      [KenyanCounty.KWALE]: 'COAST',
      [KenyanCounty.LAMU]: 'COAST',
      [KenyanCounty.TANA_RIVER]: 'COAST',
      [KenyanCounty.TAITA_TAVETA]: 'COAST',
      [KenyanCounty.KIAMBU]: 'CENTRAL',
      [KenyanCounty.MURANGA]: 'CENTRAL',
      [KenyanCounty.NYERI]: 'CENTRAL',
      [KenyanCounty.NYANDARUA]: 'CENTRAL',
      [KenyanCounty.KIRINYAGA]: 'CENTRAL',
      [KenyanCounty.EMBU]: 'EASTERN',
      [KenyanCounty.THARAKA_NITHI]: 'EASTERN',
      [KenyanCounty.MERU]: 'EASTERN',
      [KenyanCounty.KITUI]: 'EASTERN',
      [KenyanCounty.MACHAKOS]: 'EASTERN',
      [KenyanCounty.MAKUENI]: 'EASTERN',
      [KenyanCounty.GARISSA]: 'NORTH_EASTERN',
      [KenyanCounty.WAJIR]: 'NORTH_EASTERN',
      [KenyanCounty.MANDERA]: 'NORTH_EASTERN',
      [KenyanCounty.KISUMU]: 'NYANZA',
      [KenyanCounty.SIAYA]: 'NYANZA',
      [KenyanCounty.HOMA_BAY]: 'NYANZA',
      [KenyanCounty.MIGORI]: 'NYANZA',
      [KenyanCounty.KISII]: 'NYANZA',
      [KenyanCounty.NYAMIRA]: 'NYANZA',
      [KenyanCounty.NAKURU]: 'RIFT_VALLEY',
      [KenyanCounty.NAROK]: 'RIFT_VALLEY',
      [KenyanCounty.KAJIADO]: 'RIFT_VALLEY',
      [KenyanCounty.KERICHO]: 'RIFT_VALLEY',
      [KenyanCounty.BOMET]: 'RIFT_VALLEY',
      [KenyanCounty.UASIN_GISHU]: 'RIFT_VALLEY',
      [KenyanCounty.ELGEYO_MARAKWET]: 'RIFT_VALLEY',
      [KenyanCounty.NANDI]: 'RIFT_VALLEY',
      [KenyanCounty.BARINGO]: 'RIFT_VALLEY',
      [KenyanCounty.LAIKIPIA]: 'RIFT_VALLEY',
      [KenyanCounty.TURKANA]: 'RIFT_VALLEY',
      [KenyanCounty.WEST_POKOT]: 'RIFT_VALLEY',
      [KenyanCounty.SAMBURU]: 'RIFT_VALLEY',
      [KenyanCounty.TRANS_NZOIA]: 'RIFT_VALLEY',
      [KenyanCounty.MARSABIT]: 'RIFT_VALLEY',
      [KenyanCounty.ISIOLO]: 'RIFT_VALLEY',
      [KenyanCounty.KAKAMEGA]: 'WESTERN',
      [KenyanCounty.VIHIGA]: 'WESTERN',
      [KenyanCounty.BUNGOMA]: 'WESTERN',
      [KenyanCounty.BUSIA]: 'WESTERN',
    };

    return regionMap[this.value] as any;
  }
}
