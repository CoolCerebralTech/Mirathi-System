import { ValueObject } from '../base/value-object';
import {
  InvalidAlienCardException,
  InvalidBirthCertificateException,
  InvalidKenyanIdException,
  InvalidKraPinException,
  InvalidNationalIdChecksumException,
  InvalidNationalIdException,
  InvalidPassportException,
} from '../exceptions/kenyan-id.exception';

export enum KenyanIdType {
  NATIONAL_ID = 'NATIONAL_ID',
  KRA_PIN = 'KRA_PIN',
  PASSPORT = 'PASSPORT',
  ALIEN_CARD = 'ALIEN_CARD',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  MILITARY_ID = 'MILITARY_ID',
  REFUGEE_ID = 'REFUGEE_ID',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
}

export enum Gender {
  MALE = 'M',
  FEMALE = 'F',
}

export interface KenyanIdProps {
  value: string;
  type: KenyanIdType;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  verified?: boolean;
  verificationDate?: Date;
}

export class KenyanId extends ValueObject<KenyanIdProps> {
  // Used in extractCounty() and extractGender() logic
  private static readonly COUNTY_CODES: Record<string, string> = {
    '01': 'MOMBASA',
    '02': 'KWALE',
    '03': 'KILIFI',
    '04': 'TANA_RIVER',
    '05': 'LAMU',
    '06': 'TAITA_TAVETA',
    '07': 'GARISSA',
    '08': 'WAJIR',
    '09': 'MANDERA',
    '10': 'MARSABIT',
    '11': 'ISIOLO',
    '12': 'MERU',
    '13': 'THARAKA_NITHI',
    '14': 'EMBU',
    '15': 'KITUI',
    '16': 'MACHAKOS',
    '17': 'MAKUENI',
    '18': 'NYANDARUA',
    '19': 'NYERI',
    '20': 'KIRINYAGA',
    '21': 'MURANGA',
    '22': 'KIAMBU',
    '23': 'TURKANA',
    '24': 'WEST_POKOT',
    '25': 'SAMBURU',
    '26': 'TRANS_NZOIA',
    '27': 'UASIN_GISHU',
    '28': 'ELGEYO_MARAKWET',
    '29': 'NANDI',
    '30': 'BARINGO',
    '31': 'LAIKIPIA',
    '32': 'NAKURU',
    '33': 'NAROK',
    '34': 'KAJIADO',
    '35': 'KERICHO',
    '36': 'BOMET',
    '37': 'KAKAMEGA',
    '38': 'VIHIGA',
    '39': 'BUNGOMA',
    '40': 'BUSIA',
    '41': 'SIAYA',
    '42': 'KISUMU',
    '43': 'HOMA_BAY',
    '44': 'MIGORI',
    '45': 'KISII',
    '46': 'NYAMIRA',
    '47': 'NAIROBI',
  };

  constructor(props: KenyanIdProps) {
    super(props);
  }

  protected validate(): void {
    const value = this.props.value;

    if (!value || value.trim().length === 0) {
      throw new InvalidKenyanIdException('ID value cannot be empty', this.props.type);
    }

    switch (this.props.type) {
      case KenyanIdType.NATIONAL_ID:
        this.validateNationalId(value);
        break;
      case KenyanIdType.KRA_PIN:
        this.validateKraPin(value);
        break;
      case KenyanIdType.PASSPORT:
        this.validatePassport(value);
        break;
      case KenyanIdType.ALIEN_CARD:
        this.validateAlienCard(value);
        break;
      case KenyanIdType.BIRTH_CERTIFICATE:
        this.validateBirthCertificate(value);
        break;
      default:
        // Generic length check for less strict ID types
        if (value.length < 4 || value.length > 50) {
          throw new InvalidKenyanIdException(
            `Invalid ${this.props.type} length: ${value}`,
            this.props.type,
            { length: value.length },
          );
        }
    }
  }

  private validateNationalId(id: string): void {
    // 1. Old Format: 7 digits + Letter (e.g., 1234567A)
    // 2. Standard Format: 8 digits (e.g., 12345678)
    const standardRegex = /^\d{8}$/;
    const oldFormatRegex = /^\d{7}[A-Z]$/;
    // 7 digit numeric IDs exist for older generations
    const oldNumericRegex = /^\d{7}$/;

    if (!standardRegex.test(id) && !oldFormatRegex.test(id) && !oldNumericRegex.test(id)) {
      throw new InvalidNationalIdException(id, {
        reason: 'Format mismatch',
        supportedFormats: ['8 Digits', '7 Digits', '7 Digits + Suffix'],
      });
    }

    // Validate checksum ONLY for 8-digit standard IDs
    if (standardRegex.test(id)) {
      this.validateNewNationalIdChecksum(id);
    }
  }

  private validateNewNationalIdChecksum(id: string): void {
    const digits = id.split('').map(Number);
    const checksumDigit = digits[7]; // The last digit is the check digit

    let sum = 0;
    // Iterate over the first 7 digits
    for (let i = 0; i < 7; i++) {
      let digit = digits[i];

      // Double every other digit starting from the right-most payload digit (index 6, 4, 2, 0)
      // Since array is 0-indexed:
      // Index 6 (2nd from last): Double
      // Index 5: Keep
      // Index 4: Double...
      // Logic: If (7 - i) is odd (1st from right, 3rd, etc), we keep. If even, we double.
      // Wait, standard Luhn doubles every second digit from the right.
      // Payload is indices 0-6. Rightmost is 6.
      // 6 is "first from right".
      // Implementation: Double at indices 0, 2, 4, 6.
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
    }

    const calculatedChecksum = (10 - (sum % 10)) % 10;

    if (calculatedChecksum !== checksumDigit) {
      throw new InvalidNationalIdChecksumException(id, {
        calculated: calculatedChecksum,
        actual: checksumDigit,
      });
    }
  }

  private validateKraPin(pin: string): void {
    // Correct KRA Format: [A,P] + 9 Digits + [A-Z] = 11 Characters Total.
    const correctKraRegex = /^[A-Z]\d{9}[A-Z]$/;

    if (!correctKraRegex.test(pin)) {
      throw new InvalidKraPinException(pin, {
        reason: 'Invalid format. Must be Letter + 9 Digits + Letter (11 chars)',
      });
    }
  }

  private validatePassport(passport: string): void {
    // A1234567 (Old) or AK1234567 (New)
    const passportRegex = /^[A-Z]{1,2}\d{7}$/;
    if (!passportRegex.test(passport)) {
      throw new InvalidPassportException(passport);
    }
  }

  private validateAlienCard(card: string): void {
    // Starts with A, followed by 6-9 digits
    const alienRegex = /^A\d{6,9}$/;
    if (!alienRegex.test(card)) {
      throw new InvalidAlienCardException(card);
    }
  }

  private validateBirthCertificate(cert: string): void {
    // Must contain alphanumeric characters, slashes or hyphens, length 4-20
    const certRegex = /^[A-Z0-9\-\\/]{4,20}$/;
    if (!certRegex.test(cert)) {
      throw new InvalidBirthCertificateException(cert);
    }
  }

  // --- Factory Methods ---

  public static createNationalId(raw: string, issueDate?: Date): KenyanId {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return new KenyanId({ value: clean, type: KenyanIdType.NATIONAL_ID, issueDate });
  }

  public static createKraPin(raw: string): KenyanId {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return new KenyanId({ value: clean, type: KenyanIdType.KRA_PIN });
  }

  // --- Public Methods (Utilizing defined constants) ---

  public extractCounty(): string | null {
    if (this.props.type !== KenyanIdType.NATIONAL_ID) {
      return null;
    }

    // Heuristic: First 2 digits of ID *often* correspond to district/county of issuance in older batches
    const code = this.props.value.slice(0, 2);
    return KenyanId.COUNTY_CODES[code] || null;
  }

  public getPinCategory(): 'PERSONAL' | 'COMPANY' | 'UNKNOWN' {
    if (this.props.type !== KenyanIdType.KRA_PIN) return 'UNKNOWN';
    if (this.props.value.startsWith('P')) return 'PERSONAL';
    if (this.props.value.startsWith('A')) return 'COMPANY';
    return 'UNKNOWN';
  }

  public toJSON(): Record<string, any> {
    const len = this.props.value.length;
    return {
      type: this.props.type,
      // Mask logic: Show first 2, mask middle, show last 2
      masked:
        len > 4
          ? `${this.props.value.substring(0, 2)}******${this.props.value.substring(len - 2)}`
          : '****',
      // Only expose full value if verified
      idValue: this.props.verified ? this.props.value : undefined,
      issueDate: this.props.issueDate,
      verified: !!this.props.verified,
      county: this.extractCounty(),
      category: this.props.type === KenyanIdType.KRA_PIN ? this.getPinCategory() : undefined,
    };
  }
}
