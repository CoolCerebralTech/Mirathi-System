// src/estate-service/src/domain/exceptions/will-witness.exception.ts
/**
 * WillWitness-specific exceptions for Kenyan succession law context
 */
export class WillWitnessException extends Error {
  public readonly code: string;
  public readonly field?: string;

  constructor(message: string, field?: string, code?: string) {
    super(message);
    this.name = 'WillWitnessException';
    this.field = field;
    this.code = code || this.getDefaultCode(field);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WillWitnessException);
    }
  }

  private getDefaultCode(field?: string): string {
    const codeMap: Record<string, string> = {
      witnessIdentity: 'WIT_001',
      status: 'WIT_002',
      eligibility: 'WIT_003',
      signatureType: 'WIT_004',
      signedAt: 'WIT_005',
      declarations: 'WIT_006',
      contactInfo: 'WIT_007',
      invitedAt: 'WIT_008',
    };

    return field && codeMap[field] ? codeMap[field] : 'WIT_000';
  }

  /**
   * Factory methods for common witness errors
   */
  static invalidWitnessType(type: string): WillWitnessException {
    return new WillWitnessException(
      `Invalid witness type: ${type}`,
      'witnessIdentity.type',
      'WIT_101',
    );
  }

  static missingFullName(): WillWitnessException {
    return new WillWitnessException(
      'External witness must have full name',
      'witnessIdentity.externalDetails.fullName',
      'WIT_102',
    );
  }

  static invalidNationalId(id: string): WillWitnessException {
    return new WillWitnessException(
      `Invalid Kenyan National ID: ${id}`,
      'witnessIdentity.externalDetails.nationalId',
      'WIT_103',
    );
  }

  static invalidKraPin(pin: string): WillWitnessException {
    return new WillWitnessException(
      `Invalid KRA PIN: ${pin}`,
      'witnessIdentity.externalDetails.kraPin',
      'WIT_104',
    );
  }

  static ineligibleWitness(): WillWitnessException {
    return new WillWitnessException('Witness is legally ineligible', 'eligibility', 'WIT_105');
  }

  static cannotSignRejected(): WillWitnessException {
    return new WillWitnessException('Cannot sign rejected witness', 'status', 'WIT_106');
  }

  static alreadySigned(): WillWitnessException {
    return new WillWitnessException('Witness already signed', 'status', 'WIT_107');
  }

  static cannotVerifyUnsigned(): WillWitnessException {
    return new WillWitnessException('Only signed witnesses can be verified', 'status', 'WIT_108');
  }

  static alreadyVerified(): WillWitnessException {
    return new WillWitnessException('Witness already verified', 'status', 'WIT_109');
  }

  static cannotRejectSigned(): WillWitnessException {
    return new WillWitnessException(
      'Cannot reject signed or verified witness',
      'status',
      'WIT_110',
    );
  }

  static beneficiaryWitness(): WillWitnessException {
    return new WillWitnessException(
      'Witness cannot be a beneficiary (S.11(2) LSA)',
      'declarations.isNotBeneficiary',
      'WIT_111',
    );
  }

  static spouseOfBeneficiaryWitness(): WillWitnessException {
    return new WillWitnessException(
      'Witness cannot be spouse of beneficiary (S.11(2) LSA)',
      'declarations.isNotSpouseOfBeneficiary',
      'WIT_112',
    );
  }

  static missingSignatureDate(): WillWitnessException {
    return new WillWitnessException('Signature requires date', 'signedAt', 'WIT_113');
  }

  static futureSignatureDate(): WillWitnessException {
    return new WillWitnessException(
      'Signature date cannot be in the future',
      'signedAt',
      'WIT_114',
    );
  }

  static invalidEmail(email: string): WillWitnessException {
    return new WillWitnessException(
      `Invalid email format: ${email}`,
      'contactInfo.email',
      'WIT_115',
    );
  }

  static invalidPhone(phone: string): WillWitnessException {
    return new WillWitnessException(
      `Invalid phone number: ${phone}`,
      'contactInfo.phone',
      'WIT_116',
    );
  }

  static alreadyInvited(): WillWitnessException {
    return new WillWitnessException('Witness already invited', 'invitedAt', 'WIT_117');
  }

  /**
   * Check if error is a WillWitnessException
   */
  static isWillWitnessException(error: any): error is WillWitnessException {
    return error instanceof WillWitnessException;
  }

  /**
   * Get all error codes for documentation
   */
  static getErrorCodes(): Record<string, string> {
    return {
      WIT_000: 'General witness error',
      WIT_001: 'Invalid witness identity',
      WIT_002: 'Invalid status',
      WIT_003: 'Invalid eligibility',
      WIT_004: 'Invalid signature type',
      WIT_005: 'Invalid signature date',
      WIT_006: 'Invalid declarations',
      WIT_007: 'Invalid contact information',
      WIT_008: 'Invalid invitation',
      WIT_101: 'Invalid witness type',
      WIT_102: 'Missing full name for external witness',
      WIT_103: 'Invalid National ID',
      WIT_104: 'Invalid KRA PIN',
      WIT_105: 'Legally ineligible witness',
      WIT_106: 'Cannot sign rejected witness',
      WIT_107: 'Witness already signed',
      WIT_108: 'Cannot verify unsigned witness',
      WIT_109: 'Witness already verified',
      WIT_110: 'Cannot reject signed witness',
      WIT_111: 'Witness is beneficiary',
      WIT_112: 'Witness is spouse of beneficiary',
      WIT_113: 'Missing signature date',
      WIT_114: 'Future signature date',
      WIT_115: 'Invalid email format',
      WIT_116: 'Invalid phone number',
      WIT_117: 'Already invited',
    };
  }
}
