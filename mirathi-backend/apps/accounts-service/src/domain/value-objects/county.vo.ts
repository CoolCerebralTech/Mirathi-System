// src/domain/value-objects/county.vo.ts
import { SingleValueObject } from './base.vo';

/**
 * Kenyan County Value Object
 *
 * Business Rules:
 * 1. Must be one of the 47 legally recognized Kenyan counties
 * 2. Immutable once created
 */
export class County extends SingleValueObject<string> {
  // All 47 Kenyan counties as per Constitution of Kenya 2010
  private static readonly VALID_COUNTIES = new Set([
    'BARINGO',
    'BOMET',
    'BUNGOMA',
    'BUSIA',
    'ELGEYO_MARAKWET',
    'EMBU',
    'GARISSA',
    'HOMA_BAY',
    'ISIOLO',
    'KAJIADO',
    'KAKAMEGA',
    'KERICHO',
    'KIAMBU',
    'KILIFI',
    'KIRINYAGA',
    'KISII',
    'KISUMU',
    'KITUI',
    'KWALE',
    'LAIKIPIA',
    'LAMU',
    'MACHAKOS',
    'MAKUENI',
    'MANDERA',
    'MARSABIT',
    'MERU',
    'MIGORI',
    'MOMBASA',
    'MURANGA',
    'NAIROBI',
    'NAKURU',
    'NANDI',
    'NAROK',
    'NYAMIRA',
    'NYANDARUA',
    'NYERI',
    'SAMBURU',
    'SIAYA',
    'TAITA_TAVETA',
    'TANA_RIVER',
    'THARAKA_NITHI',
    'TRANS_NZOIA',
    'TURKANA',
    'UASIN_GISHU',
    'VIHIGA',
    'WAJIR',
    'WEST_POKOT',
  ]);

  protected validate(): void {
    if (!this._value) {
      throw new Error('County is required');
    }

    const normalized = this._value.toUpperCase().trim();

    if (!County.VALID_COUNTIES.has(normalized)) {
      throw new Error(`Invalid county: ${this._value}. Must be one of the 47 Kenyan counties`);
    }
  }

  /**
   * Factory method to create County from string
   */
  static create(name: string): County {
    return new County(name.toUpperCase().trim());
  }

  /**
   * Get display name (formatted for UI)
   */
  get displayName(): string {
    return this.value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get county code (first 3 letters)
   */
  get code(): string {
    return this.value.substring(0, 3).toUpperCase();
  }

  /**
   * Check if this is a coastal county
   */
  get isCoastal(): boolean {
    const coastalCounties = new Set(['MOMBASA', 'KWALE', 'KILIFI', 'LAMU', 'TAITA_TAVETA']);
    return coastalCounties.has(this.value);
  }

  /**
   * Check if this is a city county
   */
  get isCityCounty(): boolean {
    const cityCounties = new Set(['NAIROBI', 'MOMBASA']);
    return cityCounties.has(this.value);
  }

  /**
   * Get region (based on geographical location)
   */
  get region(): string {
    const regions: Record<string, string[]> = {
      COAST: ['MOMBASA', 'KWALE', 'KILIFI', 'LAMU', 'TAITA_TAVETA', 'TANA_RIVER'],
      NORTHERN: ['GARISSA', 'WAJIR', 'MANDERA', 'MARSABIT'],
      CENTRAL: ['NYANDARUA', 'NYERI', 'KIRINYAGA', 'MURANGA', 'KIAMBU'],
      RIFT_VALLEY: [
        'BARINGO',
        'BOMET',
        'ELGEYO_MARAKWET',
        'KERICHO',
        'LAIKIPIA',
        'NAKURU',
        'NANDI',
        'NAROK',
        'SAMBURU',
        'TRANS_NZOIA',
        'TURKANA',
        'UASIN_GISHU',
        'WEST_POKOT',
      ],
      WESTERN: ['BUNGOMA', 'BUSIA', 'KAKAMEGA', 'VIHIGA'],
      NYANZA: ['HOMA_BAY', 'KISII', 'KISUMU', 'MIGORI', 'NYAMIRA', 'SIAYA'],
      EASTERN: ['EMBU', 'ISIOLO', 'KITUI', 'MACHAKOS', 'MAKUENI', 'MERU', 'THARAKA_NITHI'],
    };

    for (const [region, counties] of Object.entries(regions)) {
      if (counties.includes(this.value)) {
        return region.toLowerCase().replace('_', ' ');
      }
    }

    return 'other';
  }
}
