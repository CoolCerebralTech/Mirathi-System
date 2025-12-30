// src/estate-service/src/domain/exceptions/will-bequest.exception.ts
/**
 * WillBequest-specific exceptions for Kenyan succession law context
 */
export class WillBequestException extends Error {
  public readonly code: string;
  public readonly field?: string;

  constructor(message: string, field?: string, code?: string) {
    super(message);
    this.name = 'WillBequestException';
    this.field = field;
    this.code = code || this.getDefaultCode(field);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WillBequestException);
    }
  }

  private getDefaultCode(field?: string): string {
    const codeMap: Record<string, string> = {
      beneficiary: 'BEQ_001',
      bequestType: 'BEQ_002',
      specificAssetId: 'BEQ_003',
      percentage: 'BEQ_004',
      fixedAmount: 'BEQ_005',
      residuaryShare: 'BEQ_006',
      lifeInterestDetails: 'BEQ_007',
      trustDetails: 'BEQ_008',
      conditions: 'BEQ_009',
      priority: 'BEQ_010',
      executionOrder: 'BEQ_011',
      description: 'BEQ_012',
      alternateBeneficiary: 'BEQ_013',
    };

    return field && codeMap[field] ? codeMap[field] : 'BEQ_000';
  }

  /**
   * Factory methods for common bequest errors
   */
  static invalidBeneficiary(): WillBequestException {
    return new WillBequestException('Invalid beneficiary identity', 'beneficiary', 'BEQ_101');
  }

  static invalidPercentage(): WillBequestException {
    return new WillBequestException(
      'Percentage must be between 0 and 100',
      'percentage',
      'BEQ_102',
    );
  }

  static missingAssetId(): WillBequestException {
    return new WillBequestException(
      'Specific asset bequest requires asset ID',
      'specificAssetId',
      'BEQ_103',
    );
  }

  static missingAmount(): WillBequestException {
    return new WillBequestException(
      'Fixed amount bequest requires amount',
      'fixedAmount',
      'BEQ_104',
    );
  }

  static missingLifeInterestDetails(): WillBequestException {
    return new WillBequestException(
      'Life interest bequest requires details',
      'lifeInterestDetails',
      'BEQ_105',
    );
  }

  static missingTrustDetails(): WillBequestException {
    return new WillBequestException(
      'Trust bequest requires trust details',
      'trustDetails',
      'BEQ_106',
    );
  }

  static contradictoryConditions(): WillBequestException {
    return new WillBequestException(
      'Bequest contains contradictory conditions',
      'conditions',
      'BEQ_107',
    );
  }

  static invalidResiduaryShare(): WillBequestException {
    return new WillBequestException(
      'Residuary share must be positive',
      'residuaryShare',
      'BEQ_108',
    );
  }

  static duplicateCondition(): WillBequestException {
    return new WillBequestException('Condition already exists in bequest', 'conditions', 'BEQ_109');
  }

  static sameBeneficiaryAsAlternate(): WillBequestException {
    return new WillBequestException(
      'Alternate beneficiary cannot be the same as primary beneficiary',
      'alternateBeneficiary',
      'BEQ_110',
    );
  }

  static illegalTrustPurpose(): WillBequestException {
    return new WillBequestException(
      'Trust purpose cannot be illegal',
      'trustDetails.trustPurpose',
      'BEQ_111',
    );
  }

  static emptyDescription(): WillBequestException {
    return new WillBequestException('Bequest must have a description', 'description', 'BEQ_112');
  }

  /**
   * Check if error is a WillBequestException
   */
  static isWillBequestException(error: any): error is WillBequestException {
    return error instanceof WillBequestException;
  }

  /**
   * Get all error codes for documentation
   */
  static getErrorCodes(): Record<string, string> {
    return {
      BEQ_000: 'General bequest error',
      BEQ_001: 'Invalid beneficiary',
      BEQ_002: 'Invalid bequest type',
      BEQ_003: 'Invalid asset ID',
      BEQ_004: 'Invalid percentage',
      BEQ_005: 'Invalid fixed amount',
      BEQ_006: 'Invalid residuary share',
      BEQ_007: 'Invalid life interest details',
      BEQ_008: 'Invalid trust details',
      BEQ_009: 'Invalid conditions',
      BEQ_010: 'Invalid priority',
      BEQ_011: 'Invalid execution order',
      BEQ_012: 'Invalid description',
      BEQ_013: 'Invalid alternate beneficiary',
      BEQ_101: 'Invalid beneficiary identity',
      BEQ_102: 'Invalid percentage value',
      BEQ_103: 'Missing asset ID',
      BEQ_104: 'Missing fixed amount',
      BEQ_105: 'Missing life interest details',
      BEQ_106: 'Missing trust details',
      BEQ_107: 'Contradictory conditions',
      BEQ_108: 'Invalid residuary share',
      BEQ_109: 'Duplicate condition',
      BEQ_110: 'Same beneficiary as alternate',
      BEQ_111: 'Illegal trust purpose',
      BEQ_112: 'Empty description',
    };
  }
}
