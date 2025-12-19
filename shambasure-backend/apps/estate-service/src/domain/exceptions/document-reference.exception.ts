// src/shared/domain/exceptions/document-reference.exception.ts
import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidDocumentReferenceException extends InvalidValueObjectException {
  constructor(message: string, field?: string, context?: Record<string, any>) {
    super(message, 'DOMAIN_DOC_REF_001', field, context);
  }
}

export class InvalidTitleDeedReferenceException extends InvalidDocumentReferenceException {
  constructor(reference: string, context?: Record<string, any>) {
    super(`Invalid title deed reference: ${reference}`, 'referenceNumber', {
      ...context,
      reference,
      documentType: 'TITLE_DEED',
    });
  }
}

export class InvalidDeathCertificateException extends InvalidDocumentReferenceException {
  constructor(reference: string, context?: Record<string, any>) {
    super(`Invalid death certificate reference: ${reference}`, 'referenceNumber', {
      ...context,
      reference,
      documentType: 'DEATH_CERTIFICATE',
    });
  }
}

export class InvalidBirthCertificateException extends InvalidDocumentReferenceException {
  constructor(reference: string, context?: Record<string, any>) {
    super(`Invalid birth certificate reference: ${reference}`, 'referenceNumber', {
      ...context,
      reference,
      documentType: 'BIRTH_CERTIFICATE',
    });
  }
}

export class InvalidIDNumberException extends InvalidDocumentReferenceException {
  constructor(idNumber: string, idType: string, context?: Record<string, any>) {
    super(
      `Invalid ${idType.replace('_', ' ').toLowerCase()} number: ${idNumber}`,
      'referenceNumber',
      { ...context, idNumber, idType },
    );
  }
}

export class InvalidIssuingAuthorityException extends InvalidDocumentReferenceException {
  constructor(authority: string, context?: Record<string, any>) {
    super(`Invalid issuing authority: ${authority}`, 'issuingAuthority', { ...context, authority });
  }
}

export class ExpiredDocumentException extends InvalidDocumentReferenceException {
  constructor(reference: string, expiryDate: Date, context?: Record<string, any>) {
    super(`Document ${reference} expired on ${expiryDate.toISOString()}`, 'expiryDate', {
      ...context,
      reference,
      expiryDate,
    });
  }
}
