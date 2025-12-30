// src/estate-service/src/domain/value-objects/kenyan-county.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

export class KenyanCountyVO extends SimpleValueObject<string> {
  static readonly COUNTIES = [
    'NAIROBI',
    'MOMBASA',
    'KISUMU',
    'NAKURU',
    'UASIN_GISHU',
    'KIAMBU',
    'MACHAKOS',
    'KAJIADO',
    'MERU',
    'NYERI',
    'KILIFI',
    'KWALE',
    'LAMU',
    'TAITA_TAVETA',
    'GARISSA',
    'WAJIR',
    'MANDERA',
    'MARSABIT',
    'ISIOLO',
    'THARAKA_NITHI',
    'EMBU',
    'KITUI',
    'MAKUENI',
    'NYANDARUA',
    'KIRINYAGA',
    'MURANGA',
    'TURKANA',
    'WEST_POKOT',
    'SAMBURU',
    'TRANS_NZOIA',
    'ELGEYO_MARAKWET',
    'NANDI',
    'BARINGO',
    'LAIKIPIA',
    'NAROK',
    'BOMET',
    'KAKAMEGA',
    'VIHIGA',
    'BUNGOMA',
    'BUSIA',
    'SIAYA',
    'HOMA_BAY',
    'MIGORI',
    'KISII',
    'NYAMIRA',
    'KERUCHO',
  ];

  constructor(value: string) {
    super(value.toUpperCase().replace(/\s+/g, '_'));
  }

  protected validate(): void {
    // Basic validation (can be expanded to full list in prod)
    if (this.props.value.length < 3) {
      throw new ValueObjectValidationError('Invalid County Name', 'county');
    }
  }

  /**
   * Returns the likely location of the Land Registry for this county.
   * Essential for LandAssetDetails.
   */
  getLandRegistryLocation(): string {
    return `${this.getDisplayName()} District Land Registry`;
  }

  getHighCourtStation(): string {
    // Simplified logic: Main towns have High Courts
    if (this.isUrban()) return `${this.getDisplayName()} High Court`;
    return `${this.getDisplayName()} Law Courts`;
  }

  isUrban(): boolean {
    return ['NAIROBI', 'MOMBASA', 'NAKURU', 'KISUMU', 'KIAMBU'].includes(this.props.value);
  }

  getDisplayName(): string {
    return this.props.value
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}
