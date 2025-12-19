// src/shared/domain/exceptions/phone-number.exception.ts
import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidPhoneNumberException extends InvalidValueObjectException {
  constructor(message: string, field?: string, context?: Record<string, any>) {
    super(message, 'DOMAIN_PHONE_001', field, context);
  }
}

export class InvalidKenyanPhoneNumberException extends InvalidPhoneNumberException {
  constructor(number: string, type: string, context?: Record<string, any>) {
    super(`Invalid Kenyan ${type.toLowerCase()} number: ${number}`, 'number', {
      ...context,
      number,
      type,
    });
  }
}

export class InvalidPhoneFormatException extends InvalidPhoneNumberException {
  constructor(number: string, context?: Record<string, any>) {
    super(`Invalid phone number format: ${number}`, 'number', { ...context, number });
  }
}

export class InvalidCountryCodeException extends InvalidPhoneNumberException {
  constructor(countryCode: string, context?: Record<string, any>) {
    super(`Invalid country code: ${countryCode}`, 'countryCode', { ...context, countryCode });
  }
}

export class PhoneNumberTooShortException extends InvalidPhoneNumberException {
  constructor(number: string, minLength: number, context?: Record<string, any>) {
    super(`Phone number too short: ${number}. Minimum ${minLength} digits required.`, 'number', {
      ...context,
      number,
      minLength,
    });
  }
}

export class PhoneNumberTooLongException extends InvalidPhoneNumberException {
  constructor(number: string, maxLength: number, context?: Record<string, any>) {
    super(`Phone number too long: ${number}. Maximum ${maxLength} digits allowed.`, 'number', {
      ...context,
      number,
      maxLength,
    });
  }
}
