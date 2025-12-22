import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidAddressException extends InvalidValueObjectException {
  constructor(message: string, field: string = 'address', context?: Record<string, any>) {
    super(message, field, { ...context, code: 'DOMAIN_ADDRESS_001' });
  }
}

export class EmptyAddressException extends InvalidAddressException {
  constructor(field: string, context?: Record<string, any>) {
    super(`${field} cannot be empty`, field, context);
  }
}

export class InvalidStreetAddressException extends InvalidAddressException {
  constructor(
    address: string,
    minLength: number,
    maxLength: number,
    context?: Record<string, any>,
  ) {
    super(
      `Street address must be between ${minLength} and ${maxLength} characters: ${address}`,
      'streetAddress',
      { ...context, address, minLength, maxLength },
    );
  }
}

export class InvalidPostalCodeException extends InvalidAddressException {
  constructor(postalCode: string, context?: Record<string, any>) {
    super(`Invalid postal code format: ${postalCode}`, 'postalCode', { ...context, postalCode });
  }
}

export class InvalidCountyAddressException extends InvalidAddressException {
  constructor(county: string, context?: Record<string, any>) {
    super(`Invalid county in address: ${county}`, 'county', { ...context, county });
  }
}
