// domain/exceptions/guardianship.exception.ts

/**
 * Base Guardianship Exception
 *
 * For all errors related to guardianship domain logic violations
 */
export class GuardianshipException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'GuardianshipException';
    Object.setPrototypeOf(this, GuardianshipException.prototype);
  }
}

/**
 * Invalid Guardianship Exception
 *
 * Thrown when guardianship violates business rules
 *
 * Examples:
 * - Person cannot be their own guardian
 * - Property management without bond
 * - Filing report for inactive guardianship
 */
export class InvalidGuardianshipException extends GuardianshipException {
  constructor(message: string, code?: string) {
    super(message, code ?? 'INVALID_GUARDIANSHIP', 400);
    this.name = 'InvalidGuardianshipException';
    Object.setPrototypeOf(this, InvalidGuardianshipException.prototype);
  }
}

/**
 * Guardian Not Found Exception
 *
 * Thrown when guardian entity doesn't exist
 */
export class GuardianNotFoundException extends GuardianshipException {
  constructor(guardianId: string) {
    super(`Guardian with ID ${guardianId} not found`, 'GUARDIAN_NOT_FOUND', 404);
    this.name = 'GuardianNotFoundException';
    Object.setPrototypeOf(this, GuardianNotFoundException.prototype);
  }
}

/**
 * Ward Not Found Exception
 *
 * Thrown when ward (minor/incapacitated person) doesn't exist
 */
export class WardNotFoundException extends GuardianshipException {
  constructor(wardId: string) {
    super(`Ward with ID ${wardId} not found`, 'WARD_NOT_FOUND', 404);
    this.name = 'WardNotFoundException';
    Object.setPrototypeOf(this, WardNotFoundException.prototype);
  }
}

/**
 * Bond Required Exception
 *
 * Thrown when S.72 bond must be posted before action
 */
export class BondRequiredException extends GuardianshipException {
  constructor(message?: string) {
    super(
      message ?? 'S.72 LSA bond must be posted before property management',
      'BOND_REQUIRED',
      403,
    );
    this.name = 'BondRequiredException';
    Object.setPrototypeOf(this, BondRequiredException.prototype);
  }
}

/**
 * Bond Expired Exception
 *
 * Thrown when guardian bond has expired
 */
export class BondExpiredException extends GuardianshipException {
  constructor(expiryDate: Date) {
    super(
      `Guardian bond expired on ${expiryDate.toISOString().split('T')[0]}`,
      'BOND_EXPIRED',
      403,
    );
    this.name = 'BondExpiredException';
    Object.setPrototypeOf(this, BondExpiredException.prototype);
  }
}

/**
 * Report Overdue Exception
 *
 * Thrown when S.73 annual report is overdue
 */
export class ReportOverdueException extends GuardianshipException {
  constructor(daysOverdue: number) {
    super(`S.73 annual report is overdue by ${daysOverdue} days`, 'REPORT_OVERDUE', 400);
    this.name = 'ReportOverdueException';
    Object.setPrototypeOf(this, ReportOverdueException.prototype);
  }
}

/**
 * Court Order Required Exception
 *
 * Thrown when court order is needed for action
 */
export class CourtOrderRequiredException extends GuardianshipException {
  constructor(action: string) {
    super(`Court order required for: ${action}`, 'COURT_ORDER_REQUIRED', 403);
    this.name = 'CourtOrderRequiredException';
    Object.setPrototypeOf(this, CourtOrderRequiredException.prototype);
  }
}

/**
 * Guardianship Already Terminated Exception
 *
 * Thrown when trying to modify terminated guardianship
 */
export class GuardianshipAlreadyTerminatedException extends GuardianshipException {
  constructor(guardianshipId: string) {
    super(`Guardianship ${guardianshipId} is already terminated`, 'GUARDIANSHIP_TERMINATED', 400);
    this.name = 'GuardianshipAlreadyTerminatedException';
    Object.setPrototypeOf(this, GuardianshipAlreadyTerminatedException.prototype);
  }
}

/**
 * Ward Not Minor Exception
 *
 * Thrown when trying to appoint guardian for adult
 */
export class WardNotMinorException extends GuardianshipException {
  constructor(wardAge: number) {
    super(
      `Ward is ${wardAge} years old - guardianship only for minors (<18) or incapacitated persons`,
      'WARD_NOT_MINOR',
      400,
    );
    this.name = 'WardNotMinorException';
    Object.setPrototypeOf(this, WardNotMinorException.prototype);
  }
}

/**
 * Guardian Ineligible Exception
 *
 * Thrown when person is not eligible to be guardian
 *
 * Reasons:
 * - Under 18 years old
 * - Bankrupt
 * - Criminal record
 * - Mental incapacity
 */
export class GuardianIneligibleException extends GuardianshipException {
  constructor(reason: string) {
    super(`Guardian ineligible: ${reason}`, 'GUARDIAN_INELIGIBLE', 400);
    this.name = 'GuardianIneligibleException';
    Object.setPrototypeOf(this, GuardianIneligibleException.prototype);
  }
}

/**
 * Multiple Guardians Exception
 *
 * Thrown when ward already has guardian and new one conflicts
 */
export class MultipleGuardiansException extends GuardianshipException {
  constructor(wardId: string) {
    super(
      `Ward ${wardId} already has active guardian(s). Terminate existing guardianship first.`,
      'MULTIPLE_GUARDIANS',
      400,
    );
    this.name = 'MultipleGuardiansException';
    Object.setPrototypeOf(this, MultipleGuardiansException.prototype);
  }
}

/**
 * Customary Law Conflict Exception
 *
 * Thrown when statutory and customary law conflict
 */
export class CustomaryLawConflictException extends GuardianshipException {
  constructor(conflictDetails: string) {
    super(`Customary law conflict: ${conflictDetails}`, 'CUSTOMARY_LAW_CONFLICT', 400);
    this.name = 'CustomaryLawConflictException';
    Object.setPrototypeOf(this, CustomaryLawConflictException.prototype);
  }
}
