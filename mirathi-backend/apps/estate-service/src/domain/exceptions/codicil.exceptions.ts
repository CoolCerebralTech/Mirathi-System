// src/estate-service/src/domain/exceptions/codicil.exception.ts
/**
 * Codicil-specific exceptions for Kenyan succession law context
 */
export class CodicilException extends Error {
  public readonly code: string;
  public readonly field?: string;

  constructor(message: string, field?: string, code?: string) {
    super(message);
    this.name = 'CodicilException';
    this.field = field;
    this.code = code || this.getDefaultCode(field);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CodicilException);
    }
  }

  private getDefaultCode(field?: string): string {
    const codeMap: Record<string, string> = {
      title: 'CODI_001',
      content: 'CODI_002',
      codicilDate: 'CODI_003',
      witnesses: 'CODI_004',
      amendmentType: 'CODI_005',
      affectedClauses: 'CODI_006',
      updateContent: 'CODI_007',
      validate: 'CODI_008',
    };

    return field && codeMap[field] ? codeMap[field] : 'CODI_000';
  }

  /**
   * Factory methods for common codicil errors
   */
  static invalidWitnessCount(count: number): CodicilException {
    return new CodicilException(
      `Codicil must have at least 2 witnesses. Found: ${count}`,
      'witnesses',
      'CODI_101',
    );
  }

  static cannotModifyExecuted(): CodicilException {
    return new CodicilException(
      'Cannot modify executed codicil. Create a new codicil instead.',
      'updateContent',
      'CODI_102',
    );
  }

  static duplicateWitness(witnessId: string): CodicilException {
    return new CodicilException(
      `Witness ${witnessId} already added to codicil`,
      'witnesses',
      'CODI_103',
    );
  }

  static invalidAmendmentType(type: string): CodicilException {
    return new CodicilException(
      `Invalid amendment type: ${type}. Must be ADDITION, MODIFICATION, or REVOCATION`,
      'amendmentType',
      'CODI_104',
    );
  }

  static missingAffectedClauses(): CodicilException {
    return new CodicilException(
      'Revocation codicil must specify affected clauses',
      'affectedClauses',
      'CODI_105',
    );
  }

  static futureDate(): CodicilException {
    return new CodicilException('Codicil date cannot be in the future', 'codicilDate', 'CODI_106');
  }

  static emptyContent(): CodicilException {
    return new CodicilException('Codicil must have content', 'content', 'CODI_107');
  }

  /**
   * Check if error is a CodicilException
   */
  static isCodicilException(error: any): error is CodicilException {
    return error instanceof CodicilException;
  }

  /**
   * Get all error codes for documentation
   */
  static getErrorCodes(): Record<string, string> {
    return {
      CODI_000: 'General codicil error',
      CODI_001: 'Invalid title',
      CODI_002: 'Invalid content',
      CODI_003: 'Invalid date',
      CODI_004: 'Invalid witnesses',
      CODI_005: 'Invalid amendment type',
      CODI_006: 'Invalid affected clauses',
      CODI_007: 'Cannot modify executed codicil',
      CODI_008: 'Validation failed',
      CODI_101: 'Insufficient witnesses',
      CODI_102: 'Cannot modify executed codicil',
      CODI_103: 'Duplicate witness',
      CODI_104: 'Invalid amendment type',
      CODI_105: 'Missing affected clauses for revocation',
      CODI_106: 'Future date not allowed',
      CODI_107: 'Empty content',
    };
  }
}
