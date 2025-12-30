// src/succession-automation/src/domain/exceptions/probate.exception.ts

/**
 * Domain Exceptions for Probate Application
 */

export abstract class DomainException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// ============================================================================
// Application Not Found
// ============================================================================

export class ApplicationNotFoundException extends DomainException {
  constructor(applicationId: string) {
    super(`Probate Application with ID ${applicationId} not found`, 'APPLICATION_NOT_FOUND', 404, {
      applicationId,
    });
  }
}

// ============================================================================
// Application Not Editable
// ============================================================================

export class ApplicationNotEditableException extends DomainException {
  constructor(applicationId: string, currentStatus: string) {
    super(
      `Application ${applicationId} cannot be modified in status ${currentStatus}`,
      'APPLICATION_NOT_EDITABLE',
      400,
      { applicationId, currentStatus },
    );
  }
}

// ============================================================================
// Cannot File Application
// ============================================================================

export class CannotFileApplicationException extends DomainException {
  constructor(
    applicationId: string,
    reasons: {
      formsApproved: boolean;
      consentsReceived: boolean;
      noDeclinedConsents: boolean;
      filingFeePaid: boolean;
    },
  ) {
    const failedChecks = Object.entries(reasons)
      .filter(([_, passed]) => !passed)
      .map(([check]) => check);

    super(
      `Cannot file application ${applicationId}. Failed checks: ${failedChecks.join(', ')}`,
      'CANNOT_FILE_APPLICATION',
      400,
      {
        applicationId,
        failedChecks,
        ...reasons,
      },
    );
  }
}

// ============================================================================
// Duplicate Form Type
// ============================================================================

export class DuplicateFormTypeException extends DomainException {
  constructor(formType: string, existingFormId: string) {
    super(
      `Form type ${formType} already exists (Form ID: ${existingFormId}). Use supersede() to replace it.`,
      'DUPLICATE_FORM_TYPE',
      409,
      { formType, existingFormId },
    );
  }
}

// ============================================================================
// Form Not Found
// ============================================================================

export class FormNotFoundException extends DomainException {
  constructor(formId: string, applicationId: string) {
    super(`Form ${formId} not found in application ${applicationId}`, 'FORM_NOT_FOUND', 404, {
      formId,
      applicationId,
    });
  }
}

// ============================================================================
// Consent Not Found
// ============================================================================

export class ConsentNotFoundException extends DomainException {
  constructor(consentId: string, applicationId: string) {
    super(
      `Consent ${consentId} not found in application ${applicationId}`,
      'CONSENT_NOT_FOUND',
      404,
      { consentId, applicationId },
    );
  }
}

// ============================================================================
// Duplicate Consent
// ============================================================================

export class DuplicateConsentException extends DomainException {
  constructor(familyMemberId: string) {
    super(`Consent already exists for family member ${familyMemberId}`, 'DUPLICATE_CONSENT', 409, {
      familyMemberId,
    });
  }
}

// ============================================================================
// Declined Consent Exists
// ============================================================================

export class DeclinedConsentExistsException extends DomainException {
  constructor(
    applicationId: string,
    declinedConsents: Array<{ id: string; name: string; reason: string }>,
  ) {
    const names = declinedConsents.map((c) => c.name).join(', ');

    super(
      `Cannot file application ${applicationId}. The following family members have declined consent: ${names}`,
      'DECLINED_CONSENT_EXISTS',
      400,
      {
        applicationId,
        declinedConsents,
      },
    );
  }
}

// ============================================================================
// Missing Required Forms
// ============================================================================

export class MissingRequiredFormsException extends DomainException {
  constructor(applicationId: string, missingForms: string[]) {
    super(
      `Application ${applicationId} is missing required forms: ${missingForms.join(', ')}`,
      'MISSING_REQUIRED_FORMS',
      400,
      {
        applicationId,
        missingForms,
      },
    );
  }
}

// ============================================================================
// No Primary Petition
// ============================================================================

export class NoPrimaryPetitionException extends DomainException {
  constructor(applicationId: string) {
    super(
      `Application ${applicationId} must have at least one primary petition form (P&A 1, P&A 5, P&A 80, or Islamic Petition)`,
      'NO_PRIMARY_PETITION',
      400,
      { applicationId },
    );
  }
}

// ============================================================================
// Form Not Approved
// ============================================================================

export class FormNotApprovedException extends DomainException {
  constructor(formId: string, formType: string, currentStatus: string) {
    super(
      `Form ${formType} (ID: ${formId}) must be approved before filing. Current status: ${currentStatus}`,
      'FORM_NOT_APPROVED',
      400,
      {
        formId,
        formType,
        currentStatus,
      },
    );
  }
}

// ============================================================================
// Filing Fee Not Paid
// ============================================================================

export class FilingFeeNotPaidException extends DomainException {
  constructor(applicationId: string) {
    super(
      `Filing fee has not been paid for application ${applicationId}`,
      'FILING_FEE_NOT_PAID',
      400,
      { applicationId },
    );
  }
}

// ============================================================================
// Cannot Send Consent Request
// ============================================================================

export class CannotSendConsentRequestException extends DomainException {
  constructor(consentId: string, reason: string) {
    super(
      `Cannot send consent request for consent ${consentId}: ${reason}`,
      'CANNOT_SEND_CONSENT_REQUEST',
      400,
      {
        consentId,
        reason,
      },
    );
  }
}

// ============================================================================
// Consent Request Expired
// ============================================================================

export class ConsentRequestExpiredException extends DomainException {
  constructor(consentId: string, familyMemberName: string, expiredAt: Date) {
    super(
      `Consent request for ${familyMemberName} expired on ${expiredAt.toISOString()}`,
      'CONSENT_REQUEST_EXPIRED',
      400,
      {
        consentId,
        familyMemberName,
        expiredAt,
      },
    );
  }
}

// ============================================================================
// Invalid Consent Status Transition
// ============================================================================

export class InvalidConsentStatusTransitionException extends DomainException {
  constructor(consentId: string, currentStatus: string, attemptedTransition: string) {
    super(
      `Cannot transition consent ${consentId} from ${currentStatus} to ${attemptedTransition}`,
      'INVALID_CONSENT_STATUS_TRANSITION',
      400,
      {
        consentId,
        currentStatus,
        attemptedTransition,
      },
    );
  }
}

// ============================================================================
// Invalid Form Status Transition
// ============================================================================

export class InvalidFormStatusTransitionException extends DomainException {
  constructor(formId: string, currentStatus: string, attemptedTransition: string) {
    super(
      `Cannot transition form ${formId} from ${currentStatus} to ${attemptedTransition}`,
      'INVALID_FORM_STATUS_TRANSITION',
      400,
      {
        formId,
        currentStatus,
        attemptedTransition,
      },
    );
  }
}

// ============================================================================
// Application Already Filed
// ============================================================================

export class ApplicationAlreadyFiledException extends DomainException {
  constructor(applicationId: string, filedAt: Date, courtCaseNumber?: string) {
    super(
      `Application ${applicationId} was already filed on ${filedAt.toISOString()}` +
        (courtCaseNumber ? ` (Case No: ${courtCaseNumber})` : ''),
      'APPLICATION_ALREADY_FILED',
      409,
      {
        applicationId,
        filedAt,
        courtCaseNumber,
      },
    );
  }
}

// ============================================================================
// Form Generation Failed
// ============================================================================

export class FormGenerationFailedException extends DomainException {
  constructor(formType: string, reason: string, details?: Record<string, any>) {
    super(`Failed to generate ${formType} form: ${reason}`, 'FORM_GENERATION_FAILED', 500, {
      formType,
      reason,
      ...details,
    });
  }
}

// ============================================================================
// Invalid Application Type
// ============================================================================

export class InvalidApplicationTypeException extends DomainException {
  constructor(applicationType: string, reason: string) {
    super(
      `Invalid application type ${applicationType}: ${reason}`,
      'INVALID_APPLICATION_TYPE',
      400,
      {
        applicationType,
        reason,
      },
    );
  }
}

// ============================================================================
// Court Station Invalid
// ============================================================================

export class InvalidCourtStationException extends DomainException {
  constructor(courtStation: string, validStations: string[]) {
    super(
      `Invalid court station: ${courtStation}. Valid options: ${validStations.join(', ')}`,
      'INVALID_COURT_STATION',
      400,
      {
        courtStation,
        validStations,
      },
    );
  }
}

// ============================================================================
// Cannot Withdraw Application
// ============================================================================

export class CannotWithdrawApplicationException extends DomainException {
  constructor(applicationId: string, currentStatus: string) {
    super(
      `Cannot withdraw application ${applicationId} in status ${currentStatus}`,
      'CANNOT_WITHDRAW_APPLICATION',
      400,
      {
        applicationId,
        currentStatus,
      },
    );
  }
}

// ============================================================================
// Missing Contact Information
// ============================================================================

export class MissingContactInformationException extends DomainException {
  constructor(familyMemberId: string, familyMemberName: string, method: string) {
    super(
      `Cannot send ${method} consent request to ${familyMemberName} - missing contact information`,
      'MISSING_CONTACT_INFORMATION',
      400,
      {
        familyMemberId,
        familyMemberName,
        method,
      },
    );
  }
}

// ============================================================================
// Form Template Not Found
// ============================================================================

export class FormTemplateNotFoundException extends DomainException {
  constructor(formType: string, templateVersion: string) {
    super(
      `Form template not found for ${formType} version ${templateVersion}`,
      'FORM_TEMPLATE_NOT_FOUND',
      404,
      {
        formType,
        templateVersion,
      },
    );
  }
}

// ============================================================================
// Incomplete Form Data
// ============================================================================

export class IncompleteFormDataException extends DomainException {
  constructor(formId: string, formType: string, missingFields: string[]) {
    super(
      `Form ${formType} (ID: ${formId}) has missing required fields: ${missingFields.join(', ')}`,
      'INCOMPLETE_FORM_DATA',
      400,
      {
        formId,
        formType,
        missingFields,
      },
    );
  }
}
