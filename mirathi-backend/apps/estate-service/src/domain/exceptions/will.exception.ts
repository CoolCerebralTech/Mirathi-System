// src/estate-service/src/domain/exceptions/will.exception.ts
/**
 * Will-specific exceptions for Kenyan succession law context
 */
export class WillException extends Error {
  public readonly code: string;
  public readonly field?: string;

  constructor(message: string, field?: string, code?: string) {
    super(message);
    this.name = 'WillException';
    this.field = field;
    this.code = code || this.getDefaultCode(field);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WillException);
    }
  }

  private getDefaultCode(field?: string): string {
    const codeMap: Record<string, string> = {
      testatorId: 'WIL_001',
      status: 'WIL_002',
      type: 'WIL_003',
      capacityDeclaration: 'WIL_004',
      executionDate: 'WIL_005',
      witnesses: 'WIL_006',
      bequests: 'WIL_007',
      executors: 'WIL_008',
      codicils: 'WIL_009',
      disinheritanceRecords: 'WIL_010',
      isRevoked: 'WIL_011',
    };

    return field && codeMap[field] ? codeMap[field] : 'WIL_000';
  }

  /**
   * Factory methods for common will errors
   */
  static invalidStatusTransition(from: string, to: string): WillException {
    return new WillException(
      `Invalid status transition from ${from} to ${to}`,
      'status',
      'WIL_101',
    );
  }

  static insufficientWitnesses(count: number): WillException {
    return new WillException(
      `Insufficient witnesses: ${count}. Minimum 2 required (S.11 LSA)`,
      'witnesses',
      'WIL_102',
    );
  }

  static beneficiaryWitness(witnessName: string): WillException {
    return new WillException(
      `Witness ${witnessName} cannot be a beneficiary (S.11(2) LSA)`,
      'witnesses',
      'WIL_103',
    );
  }

  static willAlreadyRevoked(): WillException {
    return new WillException('Will already revoked', 'isRevoked', 'WIL_104');
  }

  static cannotModifyExecutedWill(): WillException {
    return new WillException(
      'Cannot modify executed will. Use codicil instead.',
      'status',
      'WIL_105',
    );
  }

  static missingCapacityDeclaration(): WillException {
    return new WillException(
      'Will execution requires capacity declaration',
      'capacityDeclaration',
      'WIL_106',
    );
  }

  static duplicatePrimaryExecutor(): WillException {
    return new WillException('Will already has a primary executor', 'executors', 'WIL_107');
  }

  static contradictoryProvisions(person: string): WillException {
    return new WillException(
      `Contradictory provisions for ${person}: cannot be both beneficiary and disinherited`,
      'bequests',
      'WIL_108',
    );
  }

  static allocationExceeded(total: number): WillException {
    return new WillException(
      `Total percentage bequests (${total}%) exceed 100%`,
      'bequests',
      'WIL_109',
    );
  }

  static multipleResiduaryClauses(): WillException {
    return new WillException('Will can have only one residuary clause', 'bequests', 'WIL_110');
  }

  static codicilRequiresExecutedWill(): WillException {
    return new WillException('Codicils can only be added to executed wills', 'codicils', 'WIL_111');
  }

  static draftCannotBeRevoked(): WillException {
    return new WillException('Draft wills cannot be revoked', 'status', 'WIL_112');
  }

  /**
   * Check if error is a WillException
   */
  static isWillException(error: any): error is WillException {
    return error instanceof WillException;
  }

  /**
   * Get all error codes for documentation
   */
  static getErrorCodes(): Record<string, string> {
    return {
      WIL_000: 'General will error',
      WIL_001: 'Invalid testator ID',
      WIL_002: 'Invalid status',
      WIL_003: 'Invalid type',
      WIL_004: 'Invalid capacity declaration',
      WIL_005: 'Invalid execution date',
      WIL_006: 'Invalid witnesses',
      WIL_007: 'Invalid bequests',
      WIL_008: 'Invalid executors',
      WIL_009: 'Invalid codicils',
      WIL_010: 'Invalid disinheritance records',
      WIL_011: 'Invalid revocation',
      WIL_101: 'Invalid status transition',
      WIL_102: 'Insufficient witnesses',
      WIL_103: 'Beneficiary witness',
      WIL_104: 'Will already revoked',
      WIL_105: 'Cannot modify executed will',
      WIL_106: 'Missing capacity declaration',
      WIL_107: 'Duplicate primary executor',
      WIL_108: 'Contradictory provisions',
      WIL_109: 'Allocation exceeded',
      WIL_110: 'Multiple residuary clauses',
      WIL_111: 'Codicil requires executed will',
      WIL_112: 'Draft cannot be revoked',
    };
  }
}
