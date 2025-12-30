// src/estate-service/src/domain/exceptions/will-executor.exception.ts
/**
 * WillExecutor-specific exceptions for Kenyan succession law context
 */
export class WillExecutorException extends Error {
  public readonly code: string;
  public readonly field?: string;

  constructor(message: string, field?: string, code?: string) {
    super(message);
    this.name = 'WillExecutorException';
    this.field = field;
    this.code = code || this.getDefaultCode(field);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WillExecutorException);
    }
  }

  private getDefaultCode(field?: string): string {
    const codeMap: Record<string, string> = {
      executorIdentity: 'EXEC_001',
      priority: 'EXEC_002',
      appointmentDate: 'EXEC_003',
      consentDate: 'EXEC_004',
      qualificationReasons: 'EXEC_005',
      powers: 'EXEC_006',
      restrictions: 'EXEC_007',
      compensation: 'EXEC_008',
      isQualified: 'EXEC_009',
    };

    return field && codeMap[field] ? codeMap[field] : 'EXEC_000';
  }

  /**
   * Factory methods for common executor errors
   */
  static minorExecutor(): WillExecutorException {
    return new WillExecutorException(
      'Minor cannot serve as executor (S.83 LSA)',
      'isMinor',
      'EXEC_101',
    );
  }

  static mentallyIncapacitated(): WillExecutorException {
    return new WillExecutorException(
      'Mentally incapacitated person cannot serve as executor',
      'isMentallyIncapacitated',
      'EXEC_102',
    );
  }

  static bankruptExecutor(): WillExecutorException {
    return new WillExecutorException(
      'Bankrupt person cannot serve as executor',
      'isBankrupt',
      'EXEC_103',
    );
  }

  static invalidNationalId(id: string): WillExecutorException {
    return new WillExecutorException(
      `Invalid Kenyan National ID: ${id}`,
      'executorIdentity.externalDetails.nationalId',
      'EXEC_104',
    );
  }

  static invalidKraPin(pin: string): WillExecutorException {
    return new WillExecutorException(
      `Invalid KRA PIN: ${pin}`,
      'executorIdentity.externalDetails.kraPin',
      'EXEC_105',
    );
  }

  static invalidEmail(email: string): WillExecutorException {
    return new WillExecutorException(
      `Invalid email format: ${email}`,
      'executorIdentity.externalDetails.email',
      'EXEC_106',
    );
  }

  static invalidPhone(phone: string): WillExecutorException {
    return new WillExecutorException(
      `Invalid phone number: ${phone}`,
      'executorIdentity.externalDetails.phone',
      'EXEC_107',
    );
  }

  static missingConsent(): WillExecutorException {
    return new WillExecutorException('Executor consent not obtained', 'consentStatus', 'EXEC_108');
  }

  static duplicatePower(power: string): WillExecutorException {
    return new WillExecutorException(`Power already granted: ${power}`, 'powers', 'EXEC_109');
  }

  static duplicateRestriction(restriction: string): WillExecutorException {
    return new WillExecutorException(
      `Restriction already imposed: ${restriction}`,
      'restrictions',
      'EXEC_110',
    );
  }

  static invalidCompensation(): WillExecutorException {
    return new WillExecutorException('Invalid compensation details', 'compensation', 'EXEC_111');
  }

  /**
   * Check if error is a WillExecutorException
   */
  static isWillExecutorException(error: any): error is WillExecutorException {
    return error instanceof WillExecutorException;
  }

  /**
   * Get all error codes for documentation
   */
  static getErrorCodes(): Record<string, string> {
    return {
      EXEC_000: 'General executor error',
      EXEC_001: 'Invalid executor identity',
      EXEC_002: 'Invalid priority',
      EXEC_003: 'Invalid appointment date',
      EXEC_004: 'Invalid consent date',
      EXEC_005: 'Invalid qualification reasons',
      EXEC_006: 'Invalid powers',
      EXEC_007: 'Invalid restrictions',
      EXEC_008: 'Invalid compensation',
      EXEC_009: 'Invalid qualification status',
      EXEC_101: 'Minor executor disqualified',
      EXEC_102: 'Mentally incapacitated executor disqualified',
      EXEC_103: 'Bankrupt executor disqualified',
      EXEC_104: 'Invalid National ID',
      EXEC_105: 'Invalid KRA PIN',
      EXEC_106: 'Invalid email format',
      EXEC_107: 'Invalid phone number',
      EXEC_108: 'Missing executor consent',
      EXEC_109: 'Duplicate power',
      EXEC_110: 'Duplicate restriction',
      EXEC_111: 'Invalid compensation details',
    };
  }
}
