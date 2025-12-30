// domain/exceptions/family.exception.ts

/**
 * Base Family Domain Exception
 */
export abstract class FamilyDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Invalid Family Member Exception
 * Thrown when family member entity violates business rules
 */
export class InvalidFamilyMemberException extends FamilyDomainException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Invalid Marriage Exception
 * Thrown when marriage entity violates Kenyan marriage law
 *
 * Kenyan Law Context:
 * - Marriage Act 2014: Different rules per marriage type
 * - S. 40 LSA: Polygamous marriage restrictions
 * - Matrimonial Property Act 2013: Property division rules
 */
export class InvalidMarriageException extends FamilyDomainException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Bigamy Exception
 * Thrown when attempting to register marriage that violates bigamy laws
 *
 * Kenyan Law Context:
 * - Civil/Christian marriages are strictly monogamous
 * - Cannot have multiple active Civil/Christian marriages
 */
export class BigamyException extends InvalidMarriageException {
  constructor(existingMarriageId: string, attemptedSpouseId: string) {
    super(
      `Bigamy violation: Person already has active marriage (${existingMarriageId}). ` +
        `Cannot marry ${attemptedSpouseId} under Civil/Christian law.`,
    );
  }
}

/**
 * Invalid Relationship Exception
 * Thrown when family relationship violates business rules
 */
export class InvalidRelationshipException extends FamilyDomainException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Invalid Guardianship Exception
 * Thrown when guardianship violates S. 70-73 LSA
 */
export class InvalidGuardianshipException extends FamilyDomainException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Invalid Polygamous Structure Exception
 * Thrown when polygamous family violates S. 40 LSA
 *
 * Kenyan Law Context:
 * - S. 40 LSA: Polygamous marriage distribution rules
 * - Wives' consent required for subsequent marriages
 * - Court certification validates structure
 */
export class InvalidPolygamousStructureException extends FamilyDomainException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * S. 40 Certification Exception
 * Thrown when S. 40 certification requirements not met
 */
export class S40CertificationException extends InvalidPolygamousStructureException {
  constructor(houseOrder: number, reason: string) {
    super(`House ${houseOrder} cannot be certified under S. 40 LSA: ${reason}`);
  }
}

/**
 * Wives Consent Missing Exception
 * Thrown when required wives' consent is missing
 */
export class WivesConsentMissingException extends InvalidPolygamousStructureException {
  constructor(houseOrder: number, missingWives: string[]) {
    super(
      `House ${houseOrder} missing consent from wives: ${missingWives.join(', ')}. ` +
        `S. 40 LSA requires all co-wives to consent to subsequent marriages.`,
    );
  }
}

/**
 * Invalid Dependency Assessment Exception
 * Thrown when dependant assessment violates S. 29 LSA
 */
export class InvalidDependencyAssessmentException extends FamilyDomainException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Identity Verification Failed Exception
 * Thrown when identity verification fails
 */
export class IdentityVerificationFailedException extends FamilyDomainException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Concurrency Exception
 * Thrown when optimistic locking fails
 */
export class ConcurrencyException extends FamilyDomainException {
  constructor(aggregateId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrency conflict for aggregate ${aggregateId}. ` +
        `Expected version: ${expectedVersion}, Actual version: ${actualVersion}`,
    );
  }
}

/**
 * Aggregate Not Found Exception
 * Thrown when aggregate cannot be found in repository
 */
export class AggregateNotFoundException extends FamilyDomainException {
  constructor(aggregateType: string, aggregateId: string) {
    super(`${aggregateType} with ID ${aggregateId} not found`);
  }
}

/**
 * Kenyan Law Violation Exception
 * Thrown when operation violates Kenyan succession law
 */
export class KenyanLawViolationException extends FamilyDomainException {
  constructor(
    public readonly lawSection: string,
    public readonly violation: string,
  ) {
    super(`Violation of ${lawSection} LSA: ${violation}`);
  }
}

/**
 * Marriage Type Mismatch Exception
 * Thrown when marriage type doesn't match operation requirements
 */
export class MarriageTypeMismatchException extends InvalidMarriageException {
  constructor(expectedType: string, actualType: string, operation: string) {
    super(
      `Operation '${operation}' requires ${expectedType} marriage, ` +
        `but marriage is ${actualType}`,
    );
  }
}

/**
 * Dissolved Marriage Exception
 * Thrown when attempting operations on dissolved marriage
 */
export class DissolvedMarriageException extends InvalidMarriageException {
  constructor(marriageId: string, operation: string) {
    super(`Cannot perform '${operation}' on dissolved marriage ${marriageId}`);
  }
}
