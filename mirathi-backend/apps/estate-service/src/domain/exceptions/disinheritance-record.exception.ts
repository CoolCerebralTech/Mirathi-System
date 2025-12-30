// src/estate-service/src/domain/exceptions/disinheritance-record.exception.ts
/**
 * DisinheritanceRecord-specific exceptions for Kenyan succession law context
 */
export class DisinheritanceRecordException extends Error {
  public readonly code: string;
  public readonly field?: string;

  constructor(message: string, field?: string, code?: string) {
    super(message);
    this.name = 'DisinheritanceRecordException';
    this.field = field;
    this.code = code || this.getDefaultCode(field);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DisinheritanceRecordException);
    }
  }

  private getDefaultCode(field?: string): string {
    const codeMap: Record<string, string> = {
      disinheritedPerson: 'DIR_001',
      reasonCategory: 'DIR_002',
      reasonDescription: 'DIR_003',
      evidence: 'DIR_004',
      legalRiskLevel: 'DIR_005',
      riskMitigationSteps: 'DIR_006',
      isAcknowledgedByDisinherited: 'DIR_007',
      acknowledgmentDate: 'DIR_008',
      isActive: 'DIR_009',
      deactivatedReason: 'DIR_010',
    };

    return field && codeMap[field] ? codeMap[field] : 'DIR_000';
  }

  /**
   * Factory methods for common disinheritance errors
   */
  static invalidPerson(): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      'Invalid disinherited person identity',
      'disinheritedPerson',
      'DIR_101',
    );
  }

  static missingReason(): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      'Disinheritance must have a reason description',
      'reasonDescription',
      'DIR_102',
    );
  }

  static missingEvidence(): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      'Disinheritance must have supporting evidence',
      'evidence',
      'DIR_103',
    );
  }

  static insufficientEvidence(reason: string): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      `Insufficient evidence for ${reason} category`,
      'evidence',
      'DIR_104',
    );
  }

  static invalidRiskLevel(level: string): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      `Invalid legal risk level: ${level}`,
      'legalRiskLevel',
      'DIR_105',
    );
  }

  static insufficientMitigationSteps(
    level: string,
    required: number,
  ): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      `${level} risk disinheritance must have at least ${required} mitigation steps`,
      'riskMitigationSteps',
      'DIR_106',
    );
  }

  static missingAcknowledgmentDate(): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      'Acknowledgment must have date if acknowledged',
      'acknowledgmentDate',
      'DIR_107',
    );
  }

  static futureAcknowledgmentDate(): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      'Acknowledgment date cannot be in the future',
      'acknowledgmentDate',
      'DIR_108',
    );
  }

  static missingDeactivationReason(): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      'Deactivated disinheritance must have a reason',
      'deactivatedReason',
      'DIR_109',
    );
  }

  static missingDeactivationDate(): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      'Deactivated disinheritance must have deactivation date',
      'deactivatedAt',
      'DIR_110',
    );
  }

  static alreadyDeactivated(): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      'Disinheritance record already deactivated',
      'isActive',
      'DIR_111',
    );
  }

  static alreadyActive(): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      'Disinheritance record already active',
      'isActive',
      'DIR_112',
    );
  }

  static duplicateEvidence(): DisinheritanceRecordException {
    return new DisinheritanceRecordException(
      'Evidence already exists in record',
      'evidence',
      'DIR_113',
    );
  }

  /**
   * Check if error is a DisinheritanceRecordException
   */
  static isDisinheritanceRecordException(error: any): error is DisinheritanceRecordException {
    return error instanceof DisinheritanceRecordException;
  }

  /**
   * Get all error codes for documentation
   */
  static getErrorCodes(): Record<string, string> {
    return {
      DIR_000: 'General disinheritance error',
      DIR_001: 'Invalid disinherited person',
      DIR_002: 'Invalid reason category',
      DIR_003: 'Invalid reason description',
      DIR_004: 'Invalid evidence',
      DIR_005: 'Invalid legal risk level',
      DIR_006: 'Invalid risk mitigation steps',
      DIR_007: 'Invalid acknowledgment status',
      DIR_008: 'Invalid acknowledgment date',
      DIR_009: 'Invalid active status',
      DIR_010: 'Invalid deactivation reason',
      DIR_101: 'Invalid person identity',
      DIR_102: 'Missing reason description',
      DIR_103: 'Missing evidence',
      DIR_104: 'Insufficient evidence',
      DIR_105: 'Invalid risk level',
      DIR_106: 'Insufficient mitigation steps',
      DIR_107: 'Missing acknowledgment date',
      DIR_108: 'Future acknowledgment date',
      DIR_109: 'Missing deactivation reason',
      DIR_110: 'Missing deactivation date',
      DIR_111: 'Already deactivated',
      DIR_112: 'Already active',
      DIR_113: 'Duplicate evidence',
    };
  }
}
