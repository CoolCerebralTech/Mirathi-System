import { ValueObject } from '../base/value-object';
import {
  InvalidKenyanPhoneNumberException,
  InvalidPhoneNumberException,
} from '../exceptions/phone-number.exception';

export enum PhoneNumberType {
  MOBILE = 'MOBILE',
  LANDLINE = 'LANDLINE',
  TOLL_FREE = 'TOLL_FREE',
  PREMIUM = 'PREMIUM',
}

export enum MobileOperator {
  SAFARICOM = 'SAFARICOM',
  AIRTEL = 'AIRTEL',
  TELKOM = 'TELKOM',
  EQUITEL = 'EQUITEL',
  FAIBA = 'FAIBA',
}

export interface PhoneNumberProps {
  number: string;
  countryCode: string;
  type: PhoneNumberType;
  operator?: MobileOperator;
  isVerified: boolean;
  isPrimary: boolean;
}

export class PhoneNumber extends ValueObject<PhoneNumberProps> {
  // Normalized Kenyan prefixes (without leading zero)
  private static readonly KENYAN_MOBILE_PREFIXES: Readonly<Record<MobileOperator, string[]>> = {
    [MobileOperator.SAFARICOM]: [
      '70',
      '71',
      '72',
      '74',
      '79',
      '110',
      '111',
      '112',
      '113',
      '114',
      '115',
    ],
    [MobileOperator.AIRTEL]: ['73', '75', '78', '100', '101', '102', '103', '104', '105', '106'],
    [MobileOperator.TELKOM]: ['77'],
    [MobileOperator.EQUITEL]: ['76'],
    [MobileOperator.FAIBA]: ['747'],
  };

  constructor(props: PhoneNumberProps) {
    super(props);
    this.normalizeNumber();
    if (this.isKenyan() && !this.props.operator) {
      this.detectOperator();
    }
  }

  protected validate(): void {
    this.validateCountryCode();
    this.validateNumberFormat();

    if (this.isKenyan()) {
      this.validateKenyanPhoneNumber();
    }
  }

  private normalizeNumber(): void {
    // Remove all non-digits
    let clean = this.props.number.replace(/[^\d]/g, '');

    // Normalize Kenyan local format (07...) to international format (7...)
    if (this.props.countryCode === '+254' && clean.startsWith('0')) {
      clean = clean.substring(1);
    }

    // We modify the internal props directly in constructor/init phase
    // but in a strict immutable VO, we should perhaps do this in a factory.
    // However, since we are extending a base class that freezes props,
    // we assume props passed to super are final, or we handle it before super.
    // Since super freezes, we can't mutate this.props.
    // FIX: Normalization logic must happen in Factory methods or passed corrected to super.
    // Ideally: Factory handles normalization. Validator just checks.
  }

  private validateCountryCode(): void {
    if (!/^\+\d{1,3}$/.test(this.props.countryCode)) {
      throw new InvalidPhoneNumberException(
        `Invalid country code: ${this.props.countryCode}`,
        'countryCode',
      );
    }
  }

  private validateNumberFormat(): void {
    if (!/^\d{4,15}$/.test(this.props.number)) {
      throw new InvalidPhoneNumberException(
        `Invalid phone number length/format: ${this.props.number}`,
        'number',
      );
    }
  }

  private validateKenyanPhoneNumber(): void {
    const num = this.props.number;

    if (this.props.type === PhoneNumberType.MOBILE) {
      if (num.length !== 9) {
        throw new InvalidKenyanPhoneNumberException(num, 'MOBILE', {
          reason: 'Must be 9 digits (excluding 0)',
        });
      }
      if (!this.getMobilePrefix(num)) {
        throw new InvalidKenyanPhoneNumberException(num, 'MOBILE', { reason: 'Unknown Prefix' });
      }
    }

    if (this.props.type === PhoneNumberType.LANDLINE) {
      // 7-9 digits depending on area code
      if (num.length < 7 || num.length > 9) {
        throw new InvalidKenyanPhoneNumberException(num, 'LANDLINE');
      }
    }
  }

  private getMobilePrefix(num: string): string | null {
    // Check 3 chars then 2 chars
    const p3 = num.substring(0, 3);
    if (this.isValidPrefix(p3)) return p3;
    const p2 = num.substring(0, 2);
    if (this.isValidPrefix(p2)) return p2;
    return null;
  }

  private isValidPrefix(prefix: string): boolean {
    return Object.values(PhoneNumber.KENYAN_MOBILE_PREFIXES).some((list) => list.includes(prefix));
  }

  private detectOperator(): void {
    // In a strict VO, we can't mutate props after construction.
    // Operator detection should be done in Factory.
  }

  // --- Factory Methods ---

  static createKenyanMobile(number: string, isVerified: boolean = false): PhoneNumber {
    // Normalize
    let clean = number.replace(/[^\d]/g, '');
    if (clean.startsWith('254')) clean = clean.substring(3);
    else if (clean.startsWith('0')) clean = clean.substring(1);

    // Detect Operator
    let operator: MobileOperator | undefined;
    for (const [op, prefixes] of Object.entries(PhoneNumber.KENYAN_MOBILE_PREFIXES)) {
      if (prefixes.some((p) => clean.startsWith(p))) {
        operator = op as MobileOperator;
        break;
      }
    }

    return new PhoneNumber({
      number: clean,
      countryCode: '+254',
      type: PhoneNumberType.MOBILE,
      operator,
      isVerified,
      isPrimary: false,
    });
  }

  // --- Business Logic ---

  isKenyan(): boolean {
    return this.props.countryCode === '+254';
  }

  formatInternational(): string {
    return `${this.props.countryCode}${this.props.number}`;
  }

  formatLocal(): string {
    if (this.isKenyan()) {
      return `0${this.props.number}`;
    }
    return this.props.number;
  }

  getMasked(): string {
    const len = this.props.number.length;
    const visible = 3;
    if (len <= visible) return '***';
    return `${this.props.countryCode} ... ${this.props.number.substring(len - 4)}`;
  }

  // --- Getters ---
  get number(): string {
    return this.props.number;
  }
  get countryCode(): string {
    return this.props.countryCode;
  }
  get operator(): MobileOperator | undefined {
    return this.props.operator;
  }

  public toJSON(): Record<string, any> {
    return {
      formatted: this.formatInternational(),
      local: this.formatLocal(),
      type: this.props.type,
      operator: this.props.operator,
      verified: this.props.isVerified,
    };
  }
}
