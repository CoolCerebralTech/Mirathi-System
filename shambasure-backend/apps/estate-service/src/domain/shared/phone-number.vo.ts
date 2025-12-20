// src/shared/domain/value-objects/phone-number.vo.ts
import { ValueObject } from '../base/value-object';
import {
  InvalidKenyanPhoneNumberException,
  InvalidPhoneNumberException,
} from '../exceptions/phone-number.exception';

export enum PhoneNumberType {
  MOBILE = 'MOBILE',
  LANDLINE = 'LANDLINE',
  VOIP = 'VOIP',
  TOLL_FREE = 'TOLL_FREE',
  PREMIUM = 'PREMIUM',
}

export enum MobileOperator {
  SAFARICOM = 'SAFARICOM',
  AIRTEL = 'AIRTEL',
  TELKOM = 'TELKOM',
  EQUITEL = 'EQUITEL',
  FAIBA = 'FAIBA',
  // LYCA removed as it operates as MVNO on other networks with shared prefixes
}

export enum PhoneNumberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PORTED = 'PORTED',
  UNKNOWN = 'UNKNOWN',
}

export interface PhoneNumberProps {
  number: string;
  countryCode: string;
  type: PhoneNumberType;
  operator?: MobileOperator;
  status: PhoneNumberStatus;
  isVerified: boolean;
  verifiedAt?: Date;
  verificationMethod?: 'SMS' | 'CALL' | 'MANUAL' | 'COURT_ORDER';
  isPrimary: boolean;
  isForLegalNotifications: boolean;
  isForEmergencyContact: boolean;
  ownerName?: string; // For display purposes
  lastUsedForNotification?: Date;
  mpesaRegistered: boolean;
  mpesaName?: string; // Registered M-Pesa name
  networkType?: '2G' | '3G' | '4G' | '5G' | 'UNKNOWN';
}

export class PhoneNumber extends ValueObject<PhoneNumberProps> {
  // Correct Kenyan mobile number prefixes (normalized without leading zero)
  private static readonly KENYAN_MOBILE_PREFIXES: Record<string, string[]> = {
    [MobileOperator.SAFARICOM]: [
      '70',
      '71',
      '72',
      '74',
      '79', // 07XX series
      '110',
      '111',
      '112',
      '113',
      '114',
      '115', // 011X series
    ],
    [MobileOperator.AIRTEL]: [
      '73',
      '75',
      '78', // 07XX series
      '100',
      '101',
      '102',
      '103',
      '104',
      '105',
      '106', // 010X series
    ],
    [MobileOperator.TELKOM]: ['77'], // 077X series
    [MobileOperator.EQUITEL]: ['76'], // 076X series (MVNO on Airtel)
    [MobileOperator.FAIBA]: ['747'], // 0747 series (JTL)
  };

  // Kenyan landline area codes (major towns)
  private static readonly KENYAN_AREA_CODES: Record<string, string> = {
    '020': 'Nairobi',
    '040': 'Mombasa',
    '041': 'Malindi',
    '042': 'Lamu',
    '043': 'Voi',
    '044': 'Machakos',
    '045': 'Kitui',
    '046': 'Garissa',
    '050': 'Naivasha',
    '051': 'Nakuru',
    '052': 'Kericho',
    '053': 'Eldoret',
    '054': 'Kitale',
    '055': 'Kakamega',
    '056': 'Kisumu',
    '057': 'Kisii',
    '058': 'Nyamira',
    '059': 'Bomet',
    '060': 'Muranga',
    '061': 'Nyeri',
    '062': 'Nanyuki',
    '064': 'Meru',
    '065': 'Chuka',
    '066': 'Embu',
    '067': 'Marsabit',
    '068': 'Isiolo',
  };

  constructor(props: PhoneNumberProps) {
    super(props);
    this.normalizeNumber();
    if (this.isKenyan()) {
      this.detectOperator(this._value.number);
    }
  }

  protected validate(): void {
    this.validateCountryCode();
    this.validateNumberFormat();
    this.validateKenyanPhoneNumber();
    this.validateForLegalUse();
  }

  private normalizeNumber(): void {
    // Remove all non-digit characters except leading plus
    let cleanNumber = this._value.number.replace(/[^\d]/g, '');

    // Remove leading 0 if present with Kenyan country code
    // e.g., 0712345678 -> 712345678
    if (this._value.countryCode === '+254' && cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }

    this._value.number = cleanNumber;
  }

  private validateCountryCode(): void {
    if (!this._value.countryCode.startsWith('+')) {
      throw new InvalidPhoneNumberException(
        `Country code must start with '+': ${this._value.countryCode}`,
        'countryCode',
        { countryCode: this._value.countryCode },
      );
    }

    // Validate format: + followed by 1-3 digits
    const countryCodeRegex = /^\+\d{1,3}$/;
    if (!countryCodeRegex.test(this._value.countryCode)) {
      throw new InvalidPhoneNumberException(
        `Invalid country code format: ${this._value.countryCode}`,
        'countryCode',
        { countryCode: this._value.countryCode },
      );
    }
  }

  private validateNumberFormat(): void {
    const number = this._value.number;

    if (!number || number.length < 4) {
      throw new InvalidPhoneNumberException(`Phone number too short: ${number}`, 'number', {
        number,
        length: number.length,
      });
    }

    if (number.length > 15) {
      throw new InvalidPhoneNumberException(`Phone number too long: ${number}`, 'number', {
        number,
        length: number.length,
      });
    }

    // Must contain only digits
    if (!/^\d+$/.test(number)) {
      throw new InvalidPhoneNumberException(
        `Phone number must contain only digits: ${number}`,
        'number',
        { number },
      );
    }
  }

  private validateKenyanPhoneNumber(): void {
    if (this._value.countryCode !== '+254') return;

    const number = this._value.number;

    // Validate based on type
    switch (this._value.type) {
      case PhoneNumberType.MOBILE:
        this.validateKenyanMobileNumber(number);
        break;
      case PhoneNumberType.LANDLINE:
        this.validateKenyanLandlineNumber(number);
        break;
      case PhoneNumberType.TOLL_FREE:
        this.validateTollFreeNumber(number);
        break;
      case PhoneNumberType.PREMIUM:
        this.validatePremiumNumber(number);
        break;
      case PhoneNumberType.VOIP:
        // VOIP numbers have different formats, less strict validation here
        break;
      default:
        throw new InvalidKenyanPhoneNumberException(number, this._value.type, {
          number,
          type: this._value.type,
        });
    }
  }

  private validateKenyanMobileNumber(number: string): void {
    // Kenyan mobile: 9 digits total (without country code)
    // e.g., 712345678 (9 digits)
    if (number.length !== 9) {
      throw new InvalidKenyanPhoneNumberException(number, 'MOBILE', {
        number,
        length: number.length,
        expected: 9,
      });
    }

    // Must start with valid mobile prefix
    const prefix = this.getMobilePrefix(number);
    if (!prefix) {
      throw new InvalidKenyanPhoneNumberException(number, 'MOBILE', {
        number,
        reason: 'Invalid or unknown Kenyan mobile prefix',
      });
    }
  }

  private validateKenyanLandlineNumber(number: string): void {
    // Kenyan landline: 7-8 digits total (without country code)
    if (number.length < 7 || number.length > 8) {
      throw new InvalidKenyanPhoneNumberException(number, 'LANDLINE', {
        number,
        length: number.length,
        expected: '7-8 digits',
      });
    }

    // Must start with valid area code (2-3 digits)
    const areaCode = this.getAreaCode(number);
    if (!areaCode || !PhoneNumber.KENYAN_AREA_CODES[areaCode]) {
      throw new InvalidKenyanPhoneNumberException(number, 'LANDLINE', {
        number,
        reason: 'Invalid area code',
      });
    }
  }

  private validateTollFreeNumber(number: string): void {
    // Toll-free numbers start with 0800 (which is 800 normalized without leading 0)
    if (!number.startsWith('800')) {
      throw new InvalidKenyanPhoneNumberException(number, 'TOLL_FREE', {
        number,
        reason: 'Toll-free numbers must start with 800 (after code)',
      });
    }
  }

  private validatePremiumNumber(number: string): void {
    // Premium rate numbers start with 090... (90... normalized)
    if (!number.startsWith('90')) {
      throw new InvalidKenyanPhoneNumberException(number, 'PREMIUM', {
        number,
        reason: 'Premium numbers must start with 90',
      });
    }
  }

  private validateForLegalUse(): void {
    // For legal notifications, numbers must be verified
    if (this._value.isForLegalNotifications && !this._value.isVerified) {
      throw new InvalidPhoneNumberException(
        'Phone number for legal notifications must be verified',
        'isVerified',
        { isForLegalNotifications: true, isVerified: false },
      );
    }

    // Emergency contacts should be mobile numbers
    if (this._value.isForEmergencyContact && this._value.type !== PhoneNumberType.MOBILE) {
      console.warn('Emergency contact should be a mobile number for SMS alerts');
    }
  }

  private getMobilePrefix(number: string): string | null {
    // Check all possible prefixes from longest (3 chars) to shortest (2 chars)
    const prefixes = [3, 2].map((len) => number.substring(0, len));
    return prefixes.find((p) => this.isValidMobilePrefix(p)) || null;
  }

  private isValidMobilePrefix(prefix: string): boolean {
    // Check if prefix exists in any operator's list
    return Object.values(PhoneNumber.KENYAN_MOBILE_PREFIXES).some((operatorPrefixes) =>
      operatorPrefixes.includes(prefix),
    );
  }

  private detectOperator(number: string): void {
    const prefix = this.getMobilePrefix(number);
    if (!prefix) return;

    for (const [operator, prefixes] of Object.entries(PhoneNumber.KENYAN_MOBILE_PREFIXES)) {
      if (prefixes.includes(prefix)) {
        this._value.operator = operator as MobileOperator;
        return;
      }
    }
  }

  private getAreaCode(number: string): string | null {
    // Construct potential area code keys by adding '0' prefix since we stripped it
    if (number.length >= 2) {
      const checkCode = '0' + number.substring(0, 2);
      if (PhoneNumber.KENYAN_AREA_CODES[checkCode]) {
        return checkCode;
      }
    }
    return null;
  }

  // Factory methods
  static createKenyanMobile(
    number: string,
    isVerified: boolean = false,
    isPrimary: boolean = false,
  ): PhoneNumber {
    return new PhoneNumber({
      number,
      countryCode: '+254',
      type: PhoneNumberType.MOBILE,
      status: PhoneNumberStatus.ACTIVE,
      isVerified,
      isPrimary,
      isForLegalNotifications: true,
      isForEmergencyContact: false,
      mpesaRegistered: false,
    });
  }

  static createKenyanLandline(
    number: string,
    isVerified: boolean = false,
    isPrimary: boolean = false,
  ): PhoneNumber {
    return new PhoneNumber({
      number,
      countryCode: '+254',
      type: PhoneNumberType.LANDLINE,
      status: PhoneNumberStatus.ACTIVE,
      isVerified,
      isPrimary,
      isForLegalNotifications: false, // Landlines not ideal for legal SMS
      isForEmergencyContact: false,
      mpesaRegistered: false,
    });
  }

  static createForLegalNotifications(
    number: string,
    countryCode: string = '+254',
    ownerName?: string,
  ): PhoneNumber {
    const phone = new PhoneNumber({
      number,
      countryCode,
      type: PhoneNumberType.MOBILE,
      status: PhoneNumberStatus.ACTIVE,
      isVerified: true, // Legal notifications require verification
      isPrimary: true,
      isForLegalNotifications: true,
      isForEmergencyContact: true,
      ownerName,
      mpesaRegistered: false,
    });

    if (!phone.isKenyan() && phone._value.isForLegalNotifications) {
      console.warn('Legal notifications to non-Kenyan numbers may have delivery issues');
    }

    return phone;
  }

  static createMpesaRegisteredNumber(number: string, mpesaName: string): PhoneNumber {
    return new PhoneNumber({
      number,
      countryCode: '+254',
      type: PhoneNumberType.MOBILE,
      status: PhoneNumberStatus.ACTIVE,
      isVerified: true,
      isPrimary: true,
      isForLegalNotifications: true,
      isForEmergencyContact: true,
      mpesaRegistered: true,
      mpesaName,
    });
  }

  // Business logic methods
  verify(
    verifiedAt: Date = new Date(),
    verificationMethod: 'SMS' | 'CALL' | 'MANUAL' | 'COURT_ORDER' = 'SMS',
  ): PhoneNumber {
    return new PhoneNumber({
      ...this._value,
      isVerified: true,
      verifiedAt,
      verificationMethod,
    });
  }

  markAsUnverified(): PhoneNumber {
    return new PhoneNumber({
      ...this._value,
      isVerified: false,
      verifiedAt: undefined,
      verificationMethod: undefined,
    });
  }

  setAsPrimary(): PhoneNumber {
    return new PhoneNumber({
      ...this._value,
      isPrimary: true,
    });
  }

  setAsSecondary(): PhoneNumber {
    return new PhoneNumber({
      ...this._value,
      isPrimary: false,
    });
  }

  updateStatus(status: PhoneNumberStatus): PhoneNumber {
    return new PhoneNumber({
      ...this._value,
      status,
    });
  }

  markUsedForNotification(): PhoneNumber {
    return new PhoneNumber({
      ...this._value,
      lastUsedForNotification: new Date(),
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

  hasMpesa(): boolean {
    return this._value.mpesaRegistered;
  }

  isIdealForLegalNotifications(): boolean {
    return (
      this._value.isVerified &&
      this._value.type === PhoneNumberType.MOBILE &&
      this._value.status === PhoneNumberStatus.ACTIVE &&
      (this.isSafaricom() || this.isAirtel()) // Best delivery rates for legal SMS
    );
  }

  canReceiveCourtSMS(): boolean {
    // Court SMS require verified Kenyan mobile numbers
    return (
      this.isKenyan() &&
      this._value.type === PhoneNumberType.MOBILE &&
      this._value.isVerified &&
      this._value.status === PhoneNumberStatus.ACTIVE
    );
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

    switch (this._value.type) {
      case PhoneNumberType.MOBILE:
        // Format: +254 7XX XXX XXX
        if (number.length === 9) {
          return `+254 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
        }
        break;

      case PhoneNumberType.LANDLINE: {
        // Format: +254 (0)XX XXX XXXX
        const areaCode = this.getAreaCode(number);
        if (areaCode) {
          const codeDigits = areaCode.substring(1); // '20' from '020'
          const localNumber = number.substring(codeDigits.length);
          return `+254 (0)${codeDigits} ${localNumber.substring(0, 3)} ${localNumber.substring(3)}`;
        }
        break;
      }

      case PhoneNumberType.TOLL_FREE:
        // Format: 0800 XXX XXX
        if (number.startsWith('800')) {
          return `0800 ${number.substring(3, 6)} ${number.substring(6)}`;
        }
        break;

      case PhoneNumberType.PREMIUM:
        // Format: 0900 XXX XXX
        if (number.startsWith('90')) {
          return `0900 ${number.substring(3, 6)} ${number.substring(6)}`;
        }
        break;
    }

    return this.getFullNumber();
  }

  getLocalFormat(): string {
    if (!this.isKenyan()) {
      return this.getFullNumber();
    }

    const number = this._value.number;
    if (this._value.type === PhoneNumberType.MOBILE && number.length === 9) {
      // 07XX ... or 01XX ...
      return `0${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }

    return `0${number}`;
  }

  getMaskedNumber(): string {
    const number = this._value.number;
    if (number.length <= 3) {
      return `${this._value.countryCode}***`;
    }

    const visibleDigits = Math.min(3, Math.floor(number.length / 3));
    const maskedPart = '*'.repeat(number.length - visibleDigits);
    return `${this._value.countryCode}${maskedPart}${number.slice(-visibleDigits)}`;
  }

  // For SMS notifications (Kenyan specific)
  getSmsProvider(): string {
    if (!this.isKenyan()) return 'INTERNATIONAL_SMS';

    if (this.isSafaricom()) return 'SAFARICOM_SMS';
    if (this.isAirtel()) return 'AIRTEL_SMS';
    if (this._value.operator === MobileOperator.TELKOM) return 'TELKOM_SMS';
    return 'OTHER_SMS';
  }

  getEstimatedDeliveryTime(): string {
    // Estimated SMS delivery times for Kenyan networks
    if (!this.isKenyan()) return 'VARIABLE';

    switch (this._value.operator) {
      case MobileOperator.SAFARICOM:
        return '5-30 seconds';
      case MobileOperator.AIRTEL:
        return '5-60 seconds';
      case MobileOperator.TELKOM:
        return '10-120 seconds';
      default:
        return 'VARIABLE';
    }
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

  get status(): PhoneNumberStatus {
    return this._value.status;
  }

  get isVerified(): boolean {
    return this._value.isVerified;
  }

  get verifiedAt(): Date | undefined {
    return this._value.verifiedAt;
  }

  get isPrimary(): boolean {
    return this._value.isPrimary;
  }

  get isForLegalNotifications(): boolean {
    return this._value.isForLegalNotifications;
  }

  get isForEmergencyContact(): boolean {
    return this._value.isForEmergencyContact;
  }

  get mpesaRegistered(): boolean {
    return this._value.mpesaRegistered;
  }

  get mpesaName(): string | undefined {
    return this._value.mpesaName;
  }

  // For API responses
  toJSON() {
    return {
      fullNumber: this.getFullNumber(),
      formatted: this.getFormattedNumber(),
      localFormat: this.getLocalFormat(),
      masked: this.getMaskedNumber(),
      countryCode: this._value.countryCode,
      type: this._value.type,
      operator: this._value.operator,
      status: this._value.status,
      isVerified: this._value.isVerified,
      verifiedAt: this._value.verifiedAt,
      verificationMethod: this._value.verificationMethod,
      isPrimary: this._value.isPrimary,
      isForLegalNotifications: this._value.isForLegalNotifications,
      isForEmergencyContact: this._value.isForEmergencyContact,
      isKenyan: this.isKenyan(),
      hasMpesa: this.hasMpesa(),
      mpesaName: this._value.mpesaName,
      canReceiveCourtSMS: this.canReceiveCourtSMS(),
      isIdealForLegalNotifications: this.isIdealForLegalNotifications(),
      smsProvider: this.getSmsProvider(),
      estimatedDeliveryTime: this.getEstimatedDeliveryTime(),
      ownerName: this._value.ownerName,
      lastUsedForNotification: this._value.lastUsedForNotification,
      networkType: this._value.networkType,
    };
  }
}
