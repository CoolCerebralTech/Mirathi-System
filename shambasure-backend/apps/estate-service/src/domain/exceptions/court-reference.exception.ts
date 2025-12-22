import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidCourtReferenceException extends InvalidValueObjectException {
  constructor(message: string, field: string = 'courtReference', context?: Record<string, any>) {
    super(message, field, { ...context, code: 'DOMAIN_COURT_REF_001' });
  }
}

export class InvalidCaseNumberException extends InvalidCourtReferenceException {
  constructor(caseNumber: string, context?: Record<string, any>) {
    super(`Invalid court case number: ${caseNumber}`, 'caseNumber', { ...context, caseNumber });
  }
}

export class InvalidGrantNumberException extends InvalidCourtReferenceException {
  constructor(grantNumber: string, context?: Record<string, any>) {
    super(`Invalid grant number: ${grantNumber}`, 'grantNumber', { ...context, grantNumber });
  }
}

export class InvalidFormNumberException extends InvalidCourtReferenceException {
  constructor(formNumber: string, context?: Record<string, any>) {
    super(`Invalid court form number: ${formNumber}`, 'formNumber', { ...context, formNumber });
  }
}

export class InvalidCourtLevelException extends InvalidCourtReferenceException {
  constructor(courtLevel: string, context?: Record<string, any>) {
    super(`Invalid court level: ${courtLevel}`, 'courtLevel', { ...context, courtLevel });
  }
}

export class InvalidCourtStationException extends InvalidCourtReferenceException {
  constructor(courtStation: string, county: string, context?: Record<string, any>) {
    super(`Court station ${courtStation} not found in county ${county}`, 'courtStation', {
      ...context,
      courtStation,
      county,
    });
  }
}
