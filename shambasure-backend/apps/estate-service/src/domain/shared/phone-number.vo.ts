// src/shared/domain/value-objects/phone-number.vo.ts
import { ValueObject } from '../base/value-object';
import {
  InvalidKenyanPhoneNumberException,
  InvalidPhoneNumberException,
} from '../exceptions/phone-number.exception';

export enum PhoneNumberType {
  MOBILE = 'MOBILE',
  LANDLINE = 'LANDLINE',
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
  verifiedAt?: Date;
}

export class PhoneNumber extends ValueObject<PhoneNumberProps> {
  constructor(props: PhoneNumberProps) {
    super(props);
  }

  protected validate(): void {
    this.validateCountryCode();
    this.validateNumber();
    this.validateKenyanPhoneNumber();
  }

  private validateCountryCode(): void {
    if (!this._value.countryCode.startsWith('+')) {
      throw new InvalidPhoneNumberException(
        `Country code must start with '+': ${this._value.countryCode}`,
        'countryCode',
        { countryCode: this._value.countryCode },
      );
    }

    if (this._value.countryCode !== '+254') {
      // For Kenyan succession, primary numbers should be Kenyan
      console.warn(`Non-Kenyan phone number: ${this._value.countryCode}`);
    }
  }

  private validateNumber(): void {
    const number = this._value.number.replace(/\D/g, ''); // Remove non-digits

    if (number.length < 4 || number.length > 15) {
      throw new InvalidPhoneNumberException(
        `Phone number must be 4-15 digits: ${number}`,
        'number',
        { number, length: number.length },
      );
    }

    // Store cleaned number
    this._value.number = number;
  }

  private validateKenyanPhoneNumber(): void {
    if (this._value.countryCode !== '+254') return;

    const number = this._value.number;

    // Kenyan mobile: 7XXXXXXXX (9 digits total including 7)
    // Kenyan landline: 2XX XXXXXX or 4XX XXXXXX
    const mobileRegex = /^7\d{8}$/; // 712345678
    const landlineRegex =
      /^(20|40|41|42|43|44|45|46|47|48|49|50|51|52|53|54|55|56|57|58|59)\d{6,7}$/;

    if (this._value.type === PhoneNumberType.MOBILE) {
      if (!mobileRegex.test(number)) {
        throw new InvalidKenyanPhoneNumberException(number, 'MOBILE', { number, type: 'MOBILE' });
      }

      // Detect operator
      this.detectOperator(number);
    } else if (this._value.type === PhoneNumberType.LANDLINE) {
      if (!landlineRegex.test(number)) {
        throw new InvalidKenyanPhoneNumberException(number, 'LANDLINE', {
          number,
          type: 'LANDLINE',
        });
      }
    }
  }

  private detectOperator(number: string): void {
    const prefix = number.substring(0, 3);

    const operatorPrefixes: Record<string, MobileOperator> = {
      '711': MobileOperator.SAFARICOM,
      '712': MobileOperator.SAFARICOM,
      '713': MobileOperator.SAFARICOM,
      '714': MobileOperator.SAFARICOM,
      '715': MobileOperator.SAFARICOM,
      '716': MobileOperator.SAFARICOM,
      '717': MobileOperator.SAFARICOM,
      '718': MobileOperator.SAFARICOM,
      '719': MobileOperator.SAFARICOM,
      '740': MobileOperator.SAFARICOM, // LTE
      '741': MobileOperator.SAFARICOM, // LTE
      '742': MobileOperator.SAFARICOM, // LTE
      '743': MobileOperator.SAFARICOM, // LTE
      '744': MobileOperator.SAFARICOM, // LTE
      '745': MobileOperator.SAFARICOM, // LTE
      '746': MobileOperator.SAFARICOM, // LTE
      '747': MobileOperator.SAFARICOM, // LTE
      '748': MobileOperator.SAFARICOM, // LTE
      '749': MobileOperator.SAFARICOM, // LTE
      '770': MobileOperator.AIRTEL,
      '771': MobileOperator.AIRTEL,
      '772': MobileOperator.AIRTEL,
      '773': MobileOperator.AIRTEL,
      '774': MobileOperator.AIRTEL,
      '775': MobileOperator.AIRTEL,
      '776': MobileOperator.AIRTEL,
      '777': MobileOperator.AIRTEL,
      '778': MobileOperator.AIRTEL,
      '779': MobileOperator.AIRTEL,
      '780': MobileOperator.AIRTEL, // LTE
      '781': MobileOperator.AIRTEL, // LTE
      '782': MobileOperator.AIRTEL, // LTE
      '783': MobileOperator.AIRTEL, // LTE
      '784': MobileOperator.AIRTEL, // LTE
      '785': MobileOperator.AIRTEL, // LTE
      '786': MobileOperator.AIRTEL, // LTE
      '787': MobileOperator.AIRTEL, // LTE
      '788': MobileOperator.AIRTEL, // LTE
      '789': MobileOperator.AIRTEL, // LTE
      '790': MobileOperator.TELKOM,
      '791': MobileOperator.TELKOM,
      '792': MobileOperator.TELKOM,
      '793': MobileOperator.TELKOM,
      '794': MobileOperator.TELKOM,
      '795': MobileOperator.TELKOM,
      '796': MobileOperator.TELKOM,
      '797': MobileOperator.TELKOM,
      '798': MobileOperator.TELKOM,
      '799': MobileOperator.TELKOM,
      '760': MobileOperator.EQUITEL,
      '761': MobileOperator.EQUITEL,
      '762': MobileOperator.EQUITEL,
      '763': MobileOperator.EQUITEL,
      '764': MobileOperator.EQUITEL,
      '765': MobileOperator.EQUITEL,
      '766': MobileOperator.EQUITEL,
      '767': MobileOperator.EQUITEL,
      '768': MobileOperator.EQUITEL,
      '769': MobileOperator.EQUITEL,
      '747': MobileOperator.FAIBA,
      '748': MobileOperator.FAIBA,
      '749': MobileOperator.FAIBA,
    };

    this._value.operator = operatorPrefixes[prefix] || undefined;
  }

  // Factory methods
  static createKenyanMobile(number: string, isVerified: boolean = false): PhoneNumber {
    // Accept formats: 712345678, 0712345678, +254712345678
    let cleanNumber = number.replace(/\D/g, '');

    if (cleanNumber.startsWith('254')) {
      cleanNumber = cleanNumber.substring(3);
    } else if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }

    return new PhoneNumber({
      number: cleanNumber,
      countryCode: '+254',
      type: PhoneNumberType.MOBILE,
      isVerified,
    });
  }

  static createKenyanLandline(number: string, isVerified: boolean = false): PhoneNumber {
    // Accept formats: 0201234567, +254201234567
    let cleanNumber = number.replace(/\D/g, '');

    if (cleanNumber.startsWith('254')) {
      cleanNumber = cleanNumber.substring(3);
    } else if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }

    return new PhoneNumber({
      number: cleanNumber,
      countryCode: '+254',
      type: PhoneNumberType.LANDLINE,
      isVerified,
    });
  }

  static createInternational(
    countryCode: string,
    number: string,
    type: PhoneNumberType = PhoneNumberType.MOBILE,
    isVerified: boolean = false,
  ): PhoneNumber {
    return new PhoneNumber({
      number: number.replace(/\D/g, ''),
      countryCode,
      type,
      isVerified,
    });
  }

  // Business logic methods
  verify(verifiedAt: Date = new Date()): PhoneNumber {
    return new PhoneNumber({
      ...this._value,
      isVerified: true,
      verifiedAt,
    });
  }

  markAsUnverified(): PhoneNumber {
    return new PhoneNumber({
      ...this._value,
      isVerified: false,
      verifiedAt: undefined,
    });
  }

  isKenyan(): boolean {
    return this._value.countryCode === '+254';
  }

  isSafaricom(): boolean {
    return this._value.operator === MobileOperator.SAFARICOM;
  }

  isAirtel(): boolean {
    return this._value.operator === MobileOperator.AIRTEL;
  }

  // Formatting methods
  getFullNumber(): string {
    return `${this._value.countryCode}${this._value.number}`;
  }

  getFormattedNumber(): string {
    if (!this.isKenyan()) {
      return this.getFullNumber();
    }

    const number = this._value.number;

    if (this._value.type === PhoneNumberType.MOBILE) {
      // Format: +254 7XX XXX XXX
      return `+254 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    } else {
      // Format: +254 (0)XX XXX XXXX
      const areaCode = number.substring(0, 2);
      const firstPart = number.substring(2, 5);
      const secondPart = number.substring(5);
      return `+254 (0)${areaCode} ${firstPart} ${secondPart}`;
    }
  }

  getMaskedNumber(): string {
    const number = this._value.number;
    if (number.length <= 4) {
      return '***' + number.slice(-1);
    }

    const visibleDigits = 3;
    const maskedPart = '*'.repeat(number.length - visibleDigits);
    return this._value.countryCode + maskedPart + number.slice(-visibleDigits);
  }

  // For SMS notifications (Kenyan specific)
  getSmsProvider(): string {
    if (!this.isKenyan()) return 'INTERNATIONAL';

    if (this.isSafaricom()) return 'SAFARICOM_SMS';
    if (this.isAirtel()) return 'AIRTEL_SMS';
    return 'OTHER_SMS';
  }

  // Getters
  get number(): string {
    return this._value.number;
  }

  get countryCode(): string {
    return this._value.countryCode;
  }

  get type(): PhoneNumberType {
    return this._value.type;
  }

  get operator(): MobileOperator | undefined {
    return this._value.operator;
  }

  get isVerified(): boolean {
    return this._value.isVerified;
  }

  get verifiedAt(): Date | undefined {
    return this._value.verifiedAt;
  }
}
