import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidKenyanIdException extends InvalidValueObjectException {
  constructor(message: string, field: string = 'kenyanId', context?: Record<string, any>) {
    super(message, field, { ...context, code: 'DOMAIN_KENYAN_ID_001' });
  }
}

export class InvalidNationalIdException extends InvalidKenyanIdException {
  constructor(id: string, context?: Record<string, any>) {
    super(
      `Invalid National ID format: ${id}. Must be 8 digits or 7 digits + letter`,
      'nationalId',
      { ...context, id, type: 'NATIONAL_ID' },
    );
  }
}

export class InvalidNationalIdChecksumException extends InvalidKenyanIdException {
  constructor(id: string, context?: Record<string, any>) {
    super(`Invalid National ID checksum: ${id}`, 'nationalId', {
      ...context,
      id,
      type: 'NATIONAL_ID',
    });
  }
}

export class InvalidNationalIdLetterException extends InvalidKenyanIdException {
  constructor(id: string, expected: string, context?: Record<string, any>) {
    super(`Invalid old National ID letter: ${id}. Expected ${expected}`, 'nationalId', {
      ...context,
      id,
      expected,
      type: 'NATIONAL_ID',
    });
  }
}

export class InvalidKraPinException extends InvalidKenyanIdException {
  constructor(pin: string, context?: Record<string, any>) {
    super(`Invalid KRA PIN format: ${pin}. Must be P/A followed by 10 digits`, 'kraPin', {
      ...context,
      pin,
      type: 'KRA_PIN',
    });
  }
}

export class InvalidPersonalKraPinException extends InvalidKenyanIdException {
  constructor(pin: string, context?: Record<string, any>) {
    super(`Invalid personal KRA PIN: ${pin}`, 'kraPin', {
      ...context,
      pin,
      type: 'KRA_PIN',
      category: 'PERSONAL',
    });
  }
}

export class InvalidCompanyKraPinException extends InvalidKenyanIdException {
  constructor(pin: string, context?: Record<string, any>) {
    super(`Invalid company KRA PIN: ${pin}`, 'kraPin', {
      ...context,
      pin,
      type: 'KRA_PIN',
      category: 'COMPANY',
    });
  }
}

export class InvalidPassportException extends InvalidKenyanIdException {
  constructor(passport: string, context?: Record<string, any>) {
    super(`Invalid passport format: ${passport}. Must be letter + 7 digits`, 'passport', {
      ...context,
      passport,
      type: 'PASSPORT',
    });
  }
}

export class InvalidAlienCardException extends InvalidKenyanIdException {
  constructor(card: string, context?: Record<string, any>) {
    super(`Invalid alien card format: ${card}. Must be A followed by 8 digits`, 'alienCard', {
      ...context,
      card,
      type: 'ALIEN_CARD',
    });
  }
}

export class InvalidBirthCertificateException extends InvalidKenyanIdException {
  constructor(certificate: string, context?: Record<string, any>) {
    super(
      `Invalid birth certificate format: ${certificate}. Expected format: XX/YY/NNNN`,
      'birthCertificate',
      { ...context, certificate, type: 'BIRTH_CERTIFICATE' },
    );
  }
}

export class EmptyIdException extends InvalidKenyanIdException {
  constructor(field: string, context?: Record<string, any>) {
    super(`${field} cannot be empty`, field, context);
  }
}

export class UnknownIdTypeException extends InvalidKenyanIdException {
  constructor(type: string, context?: Record<string, any>) {
    super(`Unknown ID type: ${type}`, 'type', { ...context, type });
  }
}
