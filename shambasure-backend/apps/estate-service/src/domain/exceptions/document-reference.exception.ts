import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidDocumentReferenceException extends InvalidValueObjectException {
  constructor(message: string, field: string = 'referenceNumber', context?: Record<string, any>) {
    super(message, field, { ...context, code: 'DOMAIN_DOC_REF_001' });
  }
}

export class InvalidTitleDeedReferenceException extends InvalidDocumentReferenceException {
  constructor(reference: string, context?: Record<string, any>) {
    super(`Invalid Title Deed reference format: ${reference}`, 'referenceNumber', {
      ...context,
      documentType: 'TITLE_DEED',
    });
  }
}

export class InvalidDeathCertificateException extends InvalidDocumentReferenceException {
  constructor(reference: string, context?: Record<string, any>) {
    super(`Invalid Death Certificate reference format: ${reference}`, 'referenceNumber', {
      ...context,
      documentType: 'DEATH_CERTIFICATE',
    });
  }
}

export class InvalidBirthCertificateException extends InvalidDocumentReferenceException {
  constructor(reference: string, context?: Record<string, any>) {
    super(`Invalid Birth Certificate reference format: ${reference}`, 'referenceNumber', {
      ...context,
      documentType: 'BIRTH_CERTIFICATE',
    });
  }
}

export class InvalidIDNumberException extends InvalidDocumentReferenceException {
  constructor(reference: string, idType: string, context?: Record<string, any>) {
    super(`Invalid ${idType} format or checksum: ${reference}`, 'referenceNumber', {
      ...context,
      documentType: idType,
    });
  }
}

export class InvalidWillReferenceException extends InvalidDocumentReferenceException {
  constructor(reference: string, context?: Record<string, any>) {
    super(`Invalid Will reference format: ${reference}`, 'referenceNumber', {
      ...context,
      documentType: 'WILL',
    });
  }
}
