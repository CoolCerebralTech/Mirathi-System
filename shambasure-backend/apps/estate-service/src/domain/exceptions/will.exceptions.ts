// domain/exceptions/will.exceptions.ts

/**
 * Will Domain Exceptions
 *
 * Purpose:
 * - Type-safe error handling
 * - Clear error messages for legal context
 * - Separation of business rule violations from technical errors
 * - HTTP status code mapping for API layer
 *
 * Kenyan Legal Context:
 * - Many exceptions reference specific Law of Succession Act sections
 * - Error messages are court-admissible (part of audit trail)
 * - Violations of legal requirements are distinguished from business logic errors
 *
 * Design Pattern: Domain Exception Hierarchy
 * - WillDomainException (base)
 *   ├── WillBusinessRuleException (business logic violations)
 *   ├── WillLegalViolationException (Kenyan law violations)
 *   └── WillStateException (invalid state transitions)
 */

// ============================================================================
// BASE EXCEPTION
// ============================================================================

/**
 * WillDomainException
 *
 * Base class for all will-related domain exceptions
 * Extends Error with additional context for better debugging
 */
export abstract class WillDomainException extends Error {
  public readonly code: string;
  public readonly httpStatusCode: number;
  public readonly isOperational: boolean = true; // Safe to retry
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    httpStatusCode: number = 400,
    context?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.httpStatusCode = httpStatusCode;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set prototype explicitly (TypeScript issue)
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Serialize for logging/API response
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      httpStatusCode: this.httpStatusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

// ============================================================================
// LEGAL VIOLATION EXCEPTIONS (Section X LSA violations)
// ============================================================================

/**
 * WillLegalViolationException
 *
 * Base class for violations of Kenyan Law of Succession Act
 * These are serious errors that make the will legally invalid
 */
export abstract class WillLegalViolationException extends WillDomainException {
  public readonly legalSection: string;

  constructor(message: string, code: string, legalSection: string, context?: Record<string, any>) {
    super(message, code, 400, { ...context, legalSection });
    this.legalSection = legalSection;
  }
}

/**
 * InsufficientWitnessesException
 *
 * Thrown when: Will has fewer than 2 witnesses
 * Legal Basis: Section 11 LSA
 * Severity: CRITICAL - Will is legally invalid
 */
export class InsufficientWitnessesException extends WillLegalViolationException {
  constructor(currentCount: number, requiredCount: number = 2) {
    super(
      `Section 11 LSA requires at least ${requiredCount} witnesses. Current count: ${currentCount}`,
      'INSUFFICIENT_WITNESSES',
      'Section 11 LSA',
      { currentCount, requiredCount },
    );
  }
}

/**
 * WitnessIsBeneficiaryException
 *
 * Thrown when: Witness is also named as beneficiary
 * Legal Basis: Section 11 LSA
 * Severity: CRITICAL - Beneficiary loses their bequest
 */
export class WitnessIsBeneficiaryException extends WillLegalViolationException {
  constructor(witnessName: string, witnessId: string) {
    super(
      `Section 11 LSA violation: ${witnessName} cannot be both witness and beneficiary. Beneficiary-witness loses their bequest.`,
      'WITNESS_IS_BENEFICIARY',
      'Section 11 LSA',
      { witnessName, witnessId },
    );
  }
}

/**
 * BeneficiaryIsWitnessException
 *
 * Thrown when: Beneficiary is also a witness
 * Legal Basis: Section 11 LSA
 * Severity: CRITICAL - Assignment is void
 */
export class BeneficiaryIsWitnessException extends WillLegalViolationException {
  constructor(beneficiaryName: string, beneficiaryId: string) {
    super(
      `Section 11 LSA violation: ${beneficiaryName} is already a witness and cannot be a beneficiary. This would void their bequest.`,
      'BENEFICIARY_IS_WITNESS',
      'Section 11 LSA',
      { beneficiaryName, beneficiaryId },
    );
  }
}

/**
 * WitnessesNotSimultaneousException
 *
 * Thrown when: Witnesses did not sign at the same time
 * Legal Basis: Section 11 LSA ("present at the same time")
 * Severity: HIGH - May invalidate will
 */
export class WitnessesNotSimultaneousException extends WillLegalViolationException {
  constructor(timeDifferenceMinutes: number) {
    super(
      `Section 11 LSA requires witnesses to be "present at the same time". Signatures are ${timeDifferenceMinutes} minutes apart (max 30 minutes).`,
      'WITNESSES_NOT_SIMULTANEOUS',
      'Section 11 LSA',
      { timeDifferenceMinutes, maxAllowedMinutes: 30 },
    );
  }
}

/**
 * TestamentaryCapacityLackingException
 *
 * Thrown when: Testator lacks mental capacity to make will
 * Legal Basis: Section 9 LSA
 * Severity: CRITICAL - Will is void
 */
export class TestamentaryCapacityLackingException extends WillLegalViolationException {
  constructor(testatorId: string, reason?: string) {
    super(
      `Section 9 LSA violation: Testator lacks testamentary capacity. ${reason ?? 'Capacity assessment required.'}`,
      'TESTAMENTARY_CAPACITY_LACKING',
      'Section 9 LSA',
      { testatorId, reason },
    );
  }
}

/**
 * InvalidRevocationMethodException
 *
 * Thrown when: Attempting invalid revocation method
 * Legal Basis: Section 17 LSA
 * Severity: HIGH - Revocation may be invalid
 */
export class InvalidRevocationMethodException extends WillLegalViolationException {
  constructor(method: string, reason: string) {
    super(
      `Section 17 LSA violation: Invalid revocation method '${method}'. ${reason}`,
      'INVALID_REVOCATION_METHOD',
      'Section 17 LSA',
      { method, reason },
    );
  }
}

// ============================================================================
// BUSINESS RULE EXCEPTIONS
// ============================================================================

/**
 * WillBusinessRuleException
 *
 * Base class for business rule violations (not necessarily legal violations)
 */
export abstract class WillBusinessRuleException extends WillDomainException {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, code, 400, context);
  }
}

/**
 * PercentageAllocationExceededException
 *
 * Thrown when: Total beneficiary percentages exceed 100%
 * Severity: HIGH - Mathematical impossibility
 */
export class PercentageAllocationExceededException extends WillBusinessRuleException {
  constructor(currentTotal: number, attemptedAddition: number) {
    const newTotal = currentTotal + attemptedAddition;
    super(
      `Total percentage allocation cannot exceed 100%. Current: ${currentTotal}%, Attempting to add: ${attemptedAddition}%, Would be: ${newTotal}%`,
      'PERCENTAGE_ALLOCATION_EXCEEDED',
      { currentTotal, attemptedAddition, newTotal, maxAllowed: 100 },
    );
  }
}

/**
 * DuplicateAssetAssignmentException
 *
 * Thrown when: Same asset assigned to multiple beneficiaries
 * Severity: HIGH - Cannot give same asset to two people
 */
export class DuplicateAssetAssignmentException extends WillBusinessRuleException {
  constructor(assetId: string, existingBeneficiary: string, newBeneficiary: string) {
    super(
      `Asset ${assetId} is already assigned to ${existingBeneficiary}. Cannot assign to ${newBeneficiary}.`,
      'DUPLICATE_ASSET_ASSIGNMENT',
      { assetId, existingBeneficiary, newBeneficiary },
    );
  }
}

/**
 * MultipleResiduaryBeneficiariesException
 *
 * Thrown when: Multiple beneficiaries claim 100% of residuary estate
 * Severity: HIGH - Ambiguous distribution
 */
export class MultipleResiduaryBeneficiariesException extends WillBusinessRuleException {
  constructor(existingBeneficiaries: string[]) {
    super(
      `Only one beneficiary can receive 100% of residuary estate. Existing residuary beneficiaries: ${existingBeneficiaries.join(', ')}. Use percentages for multiple residuary beneficiaries.`,
      'MULTIPLE_RESIDUARY_BENEFICIARIES',
      { existingBeneficiaries, suggestion: 'Specify percentages (e.g., 50% each)' },
    );
  }
}

/**
 * NoResiduaryProvisionException
 *
 * Thrown when: Will has no residuary clause or beneficiary
 * Severity: MEDIUM - Partial intestacy will occur
 */
export class NoResiduaryProvisionException extends WillBusinessRuleException {
  constructor() {
    super(
      `Will must have a residuary clause or residuary beneficiary. Without this, any assets not specifically mentioned will be distributed under intestacy rules.`,
      'NO_RESIDUARY_PROVISION',
      { recommendation: 'Add residuary clause or residuary beneficiary' },
    );
  }
}

/**
 * NoExecutorNominatedException
 *
 * Thrown when: Will has no executor
 * Severity: MEDIUM - Court will appoint administrator
 */
export class NoExecutorNominatedException extends WillBusinessRuleException {
  constructor() {
    super(
      `Will must nominate at least one executor. Without an executor, court will appoint an administrator which may delay probate.`,
      'NO_EXECUTOR_NOMINATED',
      { recommendation: 'Nominate at least one eligible executor' },
    );
  }
}

/**
 * NoEligibleExecutorException
 *
 * Thrown when: All nominated executors are ineligible or declined
 * Severity: HIGH - Cannot proceed with probate
 */
export class NoEligibleExecutorException extends WillBusinessRuleException {
  constructor(ineligibleReasons: string[]) {
    super(
      `No eligible executor available. All nominees are ineligible or have declined. Court will need to appoint administrator.`,
      'NO_ELIGIBLE_EXECUTOR',
      { ineligibleReasons, recommendation: 'Nominate alternate executors' },
    );
  }
}

/**
 * ExecutorIneligibleException
 *
 * Thrown when: Nominated executor does not meet legal requirements
 * Severity: HIGH - Cannot serve as executor
 */
export class ExecutorIneligibleException extends WillBusinessRuleException {
  constructor(executorName: string, reason: string) {
    super(
      `${executorName} is not eligible to serve as executor: ${reason}`,
      'EXECUTOR_INELIGIBLE',
      { executorName, reason },
    );
  }
}

/**
 * BeneficiaryValidationException
 *
 * Thrown when: Beneficiary assignment fails validation
 * Severity: MEDIUM - Assignment invalid
 */
export class BeneficiaryValidationException extends WillBusinessRuleException {
  constructor(beneficiaryName: string, validationErrors: string[]) {
    super(
      `Beneficiary assignment for ${beneficiaryName} is invalid: ${validationErrors.join('; ')}`,
      'BENEFICIARY_VALIDATION_FAILED',
      { beneficiaryName, validationErrors },
    );
  }
}

/**
 * DisinheritanceValidationException
 *
 * Thrown when: Disinheritance record fails validation
 * Severity: MEDIUM - Vulnerable to Section 26 challenge
 */
export class DisinheritanceValidationException extends WillBusinessRuleException {
  constructor(disinheritedName: string, validationErrors: string[]) {
    super(
      `Disinheritance of ${disinheritedName} is invalid or vulnerable to challenge: ${validationErrors.join('; ')}`,
      'DISINHERITANCE_VALIDATION_FAILED',
      { disinheritedName, validationErrors },
    );
  }
}

/**
 * DuplicateWitnessException
 *
 * Thrown when: Same person added as witness twice
 * Severity: LOW - Logical error
 */
export class DuplicateWitnessException extends WillBusinessRuleException {
  constructor(witnessName: string) {
    super(`${witnessName} is already a witness on this will.`, 'DUPLICATE_WITNESS', {
      witnessName,
    });
  }
}

/**
 * DuplicateExecutorException
 *
 * Thrown when: Same person nominated as executor twice
 * Severity: LOW - Logical error
 */
export class DuplicateExecutorException extends WillBusinessRuleException {
  constructor(executorName: string) {
    super(`${executorName} is already nominated as executor.`, 'DUPLICATE_EXECUTOR', {
      executorName,
    });
  }
}

// ============================================================================
// STATE EXCEPTIONS
// ============================================================================

/**
 * WillStateException
 *
 * Base class for invalid state transition exceptions
 */
export abstract class WillStateException extends WillDomainException {
  public readonly currentStatus: string;
  public readonly attemptedAction: string;

  constructor(
    message: string,
    code: string,
    currentStatus: string,
    attemptedAction: string,
    context?: Record<string, any>,
  ) {
    super(message, code, 409, { ...context, currentStatus, attemptedAction });
    this.currentStatus = currentStatus;
    this.attemptedAction = attemptedAction;
  }
}

/**
 * WillNotEditableException
 *
 * Thrown when: Attempting to modify non-DRAFT will
 * Severity: HIGH - State violation
 */
export class WillNotEditableException extends WillStateException {
  constructor(currentStatus: string, attemptedAction: string) {
    super(
      `Cannot ${attemptedAction} - will is in ${currentStatus} status. Only DRAFT wills can be modified.`,
      'WILL_NOT_EDITABLE',
      currentStatus,
      attemptedAction,
      { allowedStatus: 'DRAFT' },
    );
    this.httpStatusCode = 409; // Conflict
  }
}

/**
 * WillAlreadyExecutedException
 *
 * Thrown when: Attempting to modify executed will
 * Severity: CRITICAL - Cannot change after death
 */
export class WillAlreadyExecutedException extends WillStateException {
  constructor(attemptedAction: string) {
    super(
      `Cannot ${attemptedAction} - will has been executed (testator deceased). Executed wills are immutable.`,
      'WILL_ALREADY_EXECUTED',
      'EXECUTED',
      attemptedAction,
    );
    this.httpStatusCode = 403; // Forbidden
  }
}

/**
 * WillAlreadyRevokedException
 *
 * Thrown when: Attempting to use revoked will
 * Severity: HIGH - Will is invalid
 */
export class WillAlreadyRevokedException extends WillStateException {
  constructor(revocationMethod?: string) {
    super(
      `Will has been revoked${revocationMethod ? ` by ${revocationMethod}` : ''}. Revoked wills cannot be reactivated.`,
      'WILL_ALREADY_REVOKED',
      'REVOKED',
      'use revoked will',
      { revocationMethod },
    );
    this.httpStatusCode = 410; // Gone
  }
}

/**
 * WillNotWitnessedException
 *
 * Thrown when: Attempting to activate unwitnessed will
 * Severity: CRITICAL - Section 11 LSA violation
 */
export class WillNotWitnessedException extends WillStateException {
  constructor(currentStatus: string) {
    super(
      `Cannot activate will - must be WITNESSED first (Section 11 LSA). Current status: ${currentStatus}`,
      'WILL_NOT_WITNESSED',
      currentStatus,
      'activate',
      { requiredStatus: 'WITNESSED' },
    );
  }
}

/**
 * InvalidWillStatusTransitionException
 *
 * Thrown when: Invalid status transition attempted
 * Severity: HIGH - State machine violation
 */
export class InvalidWillStatusTransitionException extends WillStateException {
  constructor(fromStatus: string, toStatus: string, allowedTransitions: string[]) {
    super(
      `Invalid status transition from ${fromStatus} to ${toStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`,
      'INVALID_WILL_STATUS_TRANSITION',
      fromStatus,
      `transition to ${toStatus}`,
      { toStatus, allowedTransitions },
    );
  }
}

/**
 * WillNotReadyForWitnessingException
 *
 * Thrown when: Attempting to witness incomplete will
 * Severity: HIGH - Business rule violation
 */
export class WillNotReadyForWitnessingException extends WillStateException {
  constructor(issues: string[]) {
    super(
      `Will is not ready for witnessing. Issues: ${issues.join('; ')}`,
      'WILL_NOT_READY_FOR_WITNESSING',
      'DRAFT',
      'prepare for witnessing',
      { issues },
    );
  }
}

// ============================================================================
// CODICIL EXCEPTIONS
// ============================================================================

/**
 * CodicilOnDraftWillException
 *
 * Thrown when: Attempting to add codicil to draft will
 * Severity: HIGH - Codicils only apply to active wills
 */
export class CodicilOnDraftWillException extends WillBusinessRuleException {
  constructor() {
    super(
      `Cannot add codicil to DRAFT will. Codicils can only amend ACTIVE or WITNESSED wills. Modify the will directly instead.`,
      'CODICIL_ON_DRAFT_WILL',
      { recommendation: 'Edit will directly while in DRAFT status' },
    );
  }
}

/**
 * CodicilValidationException
 *
 * Thrown when: Codicil fails validation
 * Severity: MEDIUM - Codicil invalid
 */
export class CodicilValidationException extends WillBusinessRuleException {
  constructor(codicilNumber: number, errors: string[]) {
    super(
      `Codicil #${codicilNumber} validation failed: ${errors.join('; ')}`,
      'CODICIL_VALIDATION_FAILED',
      { codicilNumber, errors },
    );
  }
}

// ============================================================================
// CONCURRENCY EXCEPTIONS
// ============================================================================

/**
 * WillConcurrencyException
 *
 * Thrown when: Optimistic locking failure (version mismatch)
 * Severity: HIGH - Concurrent modification detected
 */
export class WillConcurrencyException extends WillDomainException {
  constructor(willId: string, expectedVersion: number, currentVersion: number) {
    super(
      `Concurrency conflict for will ${willId}. Expected version ${expectedVersion}, but current version is ${currentVersion}. Will was modified by another process.`,
      'WILL_CONCURRENCY_CONFLICT',
      409,
      { willId, expectedVersion, currentVersion },
    );
    this.isOperational = true; // Safe to retry
  }
}

/**
 * MultipleActiveWillsException
 *
 * Thrown when: Attempting to activate second will for same testator
 * Severity: CRITICAL - Business invariant violation
 */
export class MultipleActiveWillsException extends WillDomainException {
  constructor(testatorId: string, existingWillId: string, newWillId: string) {
    super(
      `Testator ${testatorId} already has an active will (${existingWillId}). Only ONE will can be active at a time. Supersede the old will first.`,
      'MULTIPLE_ACTIVE_WILLS',
      409,
      { testatorId, existingWillId, newWillId },
    );
    this.httpStatusCode = 409; // Conflict
  }
}

// ============================================================================
// NOT FOUND EXCEPTIONS
// ============================================================================

/**
 * WillNotFoundException
 *
 * Thrown when: Will not found in repository
 * Severity: LOW - Resource not found
 */
export class WillNotFoundException extends WillDomainException {
  constructor(willId: string) {
    super(`Will with ID ${willId} not found.`, 'WILL_NOT_FOUND', 404, { willId });
  }
}

/**
 * WitnessNotFoundException
 *
 * Thrown when: Witness not found in will
 * Severity: LOW - Resource not found
 */
export class WitnessNotFoundException extends WillDomainException {
  constructor(witnessId: string) {
    super(`Witness with ID ${witnessId} not found in this will.`, 'WITNESS_NOT_FOUND', 404, {
      witnessId,
    });
  }
}

/**
 * ExecutorNotFoundException
 *
 * Thrown when: Executor not found in will
 * Severity: LOW - Resource not found
 */
export class ExecutorNotFoundException extends WillDomainException {
  constructor(executorId: string) {
    super(`Executor with ID ${executorId} not found in this will.`, 'EXECUTOR_NOT_FOUND', 404, {
      executorId,
    });
  }
}

/**
 * BeneficiaryNotFoundException
 *
 * Thrown when: Beneficiary assignment not found
 * Severity: LOW - Resource not found
 */
export class BeneficiaryNotFoundException extends WillDomainException {
  constructor(assignmentId: string) {
    super(
      `Beneficiary assignment with ID ${assignmentId} not found in this will.`,
      'BENEFICIARY_NOT_FOUND',
      404,
      { assignmentId },
    );
  }
}

// ============================================================================
// EXCEPTION FACTORY (Convenience)
// ============================================================================

/**
 * WillExceptionFactory
 *
 * Convenience factory for creating exceptions with context
 */
export class WillExceptionFactory {
  static insufficientWitnesses(
    current: number,
    required: number = 2,
  ): InsufficientWitnessesException {
    return new InsufficientWitnessesException(current, required);
  }

  static witnessIsBeneficiary(name: string, id: string): WitnessIsBeneficiaryException {
    return new WitnessIsBeneficiaryException(name, id);
  }

  static beneficiaryIsWitness(name: string, id: string): BeneficiaryIsWitnessException {
    return new BeneficiaryIsWitnessException(name, id);
  }

  static percentageExceeded(
    current: number,
    addition: number,
  ): PercentageAllocationExceededException {
    return new PercentageAllocationExceededException(current, addition);
  }

  static notEditable(status: string, action: string): WillNotEditableException {
    return new WillNotEditableException(status, action);
  }

  static notFound(willId: string): WillNotFoundException {
    return new WillNotFoundException(willId);
  }

  static concurrencyConflict(
    willId: string,
    expected: number,
    current: number,
  ): WillConcurrencyException {
    return new WillConcurrencyException(willId, expected, current);
  }
}
