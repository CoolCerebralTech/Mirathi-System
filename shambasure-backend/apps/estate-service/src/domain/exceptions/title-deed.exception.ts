import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidTitleDeedException extends InvalidValueObjectException {
  constructor(message: string, field: string = 'titleDeed', context?: Record<string, any>) {
    super(message, field, { ...context, code: 'DOMAIN_TITLE_DEED_001' });
  }
}

export class InvalidDeedNumberException extends InvalidTitleDeedException {
  constructor(deedNumber: string, context?: Record<string, any>) {
    super(`Invalid title deed number format: ${deedNumber}`, 'deedNumber', {
      ...context,
      deedNumber,
    });
  }
}

export class InvalidParcelNumberException extends InvalidTitleDeedException {
  constructor(parcelNumber: string, context?: Record<string, any>) {
    super(`Invalid parcel number format: ${parcelNumber}`, 'parcelNumber', {
      ...context,
      parcelNumber,
    });
  }
}

export class FutureIssueDateException extends InvalidTitleDeedException {
  constructor(issueDate: Date, context?: Record<string, any>) {
    super(`Issue date cannot be in the future: ${issueDate.toISOString()}`, 'issueDate', {
      ...context,
      issueDate,
    });
  }
}

export class MissingExpiryDateException extends InvalidTitleDeedException {
  constructor(context?: Record<string, any>) {
    super('Leasehold title deed must have an expiry date', 'expiryDate', context);
  }
}

export class InvalidExpiryDateException extends InvalidTitleDeedException {
  constructor(issueDate: Date, expiryDate: Date, context?: Record<string, any>) {
    super(
      `Expiry date ${expiryDate.toISOString()} must be after issue date ${issueDate.toISOString()}`,
      'expiryDate',
      { ...context, issueDate, expiryDate },
    );
  }
}

export class ExpiredLeaseException extends InvalidTitleDeedException {
  constructor(deedNumber: string, expiryDate: Date, context?: Record<string, any>) {
    super(`Title deed ${deedNumber} expired on ${expiryDate.toISOString()}`, 'expiryDate', {
      ...context,
      deedNumber,
      expiryDate,
      expired: true,
    });
  }
}

export class InvalidLeaseholdException extends InvalidTitleDeedException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'leasehold', context);
  }
}

export class InvalidFreeholdException extends InvalidTitleDeedException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'freehold', context);
  }
}
