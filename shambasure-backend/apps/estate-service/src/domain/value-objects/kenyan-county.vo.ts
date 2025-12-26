// src/estate-service/src/domain/value-objects/kenyan-county.vo.ts
import { SimpleValueObject } from '../base/value-object';

/**
 * Kenyan County Value Object
 *
 * Contains all 47 counties as defined in the Constitution of Kenya 2010
 * Important for:
 * - Jurisdiction determination (which High Court)
 * - Land registration (which Lands Registry)
 * - Cultural considerations (customary law applicability)
 */
export class KenyanCountyVO extends SimpleValueObject<string> {
  // All 47 Kenyan counties
  static readonly COUNTIES = [
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
  ] as const;

  constructor(value: string) {
    super(value.toUpperCase().replace(/\s+/g, '_'));
  }

  protected validate(): void {
    if (!KenyanCountyVO.COUNTIES.includes(this.props.value as any)) {
      throw new ValueObjectValidationError(
        `Invalid Kenyan county: ${this.props.value}. Must be one of: ${KenyanCountyVO.COUNTIES.join(', ')}`,
        'county',
      );
    }
  }

  /**
   * Get county for Nairobi (special case - capital city)
   */
  static nairobi(): KenyanCountyVO {
    return new KenyanCountyVO('NAIROBI');
  }

  /**
   * Get county for Mombasa (coastal region)
   */
  static mombasa(): KenyanCountyVO {
    return new KenyanCountyVO('MOMBASA');
  }

  /**
   * Check if this is an urban county
   */
  isUrban(): boolean {
    return ['NAIROBI', 'MOMBASA', 'NAKURU', 'KISUMU'].includes(this.props.value);
  }

  /**
   * Check if this is a pastoralist county
   */
  isPastoralist(): boolean {
    const pastoralistCounties = [
      'GARISSA',
      'ISIOLO',
      'MANDERA',
      'MARSABIT',
      'SAMBURU',
      'TURKANA',
      'WAJIR',
    ];
    return pastoralistCounties.includes(this.props.value);
  }

  /**
   * Get High Court station for this county
   */
  getHighCourtStation(): string {
    // Map counties to their High Court stations
    const courtMap: Record<string, string> = {
      NAIROBI: 'Nairobi High Court',
      MOMBASA: 'Mombasa High Court',
      NAKURU: 'Nakuru High Court',
      KISUMU: 'Kisumu High Court',
      ELGEYO_MARAKWET: 'Eldoret High Court',
      MERU: 'Meru High Court',
      NYERI: 'Nyeri High Court',
      // Add more mappings as needed
    };

    return courtMap[this.props.value] || `${this.getDisplayName()} High Court`;
  }

  /**
   * Get display name (human readable)
   */
  getDisplayName(): string {
    return this.props.value
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get county code (e.g., 001 for Mombasa)
   */
  getCountyCode(): string {
    const index = KenyanCountyVO.COUNTIES.indexOf(this.props.value as any);
    return (index + 1).toString().padStart(3, '0');
  }
}
