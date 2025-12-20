import { ValueObject } from '../../../base/value-object';
import { Result, combine } from '../../../core/result';
import { Address } from '../../../shared/address.vo';
import { Email } from '../../../shared/email.vo';
import { PhoneNumber } from '../../../shared/phone-number.vo';

export enum SignatureType {
  DIGITAL_SIGNATURE = 'DIGITAL_SIGNATURE',
  WET_SIGNATURE = 'WET_SIGNATURE',
  E_SIGNATURE = 'E_SIGNATURE',
  BIOMETRIC_SIGNATURE = 'BIOMETRIC_SIGNATURE',
  WITNESS_MARK = 'WITNESS_MARK',
}

export enum WitnessVerificationMethod {
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATURE',
  ALIEN_CARD = 'ALIEN_CARD',
  MILITARY_ID = 'MILITARY_ID',
  OTHER = 'OTHER',
}

export enum WitnessEligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE_MINOR = 'INELIGIBLE_MINOR',
  INELIGIBLE_BENEFICIARY = 'INELIGIBLE_BENEFICIARY',
  INELIGIBLE_SPOUSE = 'INELIGIBLE_SPOUSE',
  INELIGIBLE_EXECUTOR = 'INELIGIBLE_EXECUTOR',
  INELIGIBLE_RELATIONSHIP = 'INELIGIBLE_RELATIONSHIP',
  INELIGIBLE_MENTAL_CAPACITY = 'INELIGIBLE_MENTAL_CAPACITY',
  INELIGIBLE_CRIMINAL_RECORD = 'INELIGIBLE_CRIMINAL_RECORD',
  PENDING_ELIGIBILITY_CHECK = 'PENDING_ELIGIBILITY_CHECK',
}

interface WitnessSignatureProps {
  // Legal Requirements (Section 11 LSA)
  witnessId: string; // Reference to User or external witness
  fullName: string;
  signatureType: SignatureType;
  signatureData: string; // Encrypted/hashed signature
  signatureTimestamp: Date;
  signatureLocation?: string;

  // Kenyan Legal Compliance
  witnessAge: number; // Must be ≥ 18 (Section 11(3) LSA)
  isBeneficiary: boolean; // Cannot witness if beneficiary (Section 11(4))
  isExecutor: boolean; // Cannot witness if executor (Section 11(4))
  relationshipToTestator?: string;

  // Verification
  verificationMethod?: WitnessVerificationMethod;
  idNumber?: string;
  idVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;

  // Eligibility
  eligibilityStatus: WitnessEligibilityStatus;
  eligibilityVerifiedAt?: Date;
  ineligibilityReason?: string;

  // Professional Witness Details
  isProfessionalWitness?: boolean;
  professionalCapacity?: string;
  professionalLicenseNumber?: string;

  // Contact Information
  email?: Email;
  phone?: PhoneNumber;
  address?: Address;

  // Legal Retention (Data Protection Act)
  retainedUntil: Date;
  purpose: string;
}

export class WitnessSignature extends ValueObject<WitnessSignatureProps> {
  get witnessId(): string {
    return this.props.witnessId;
  }
  get fullName(): string {
    return this.props.fullName;
  }
  get signatureType(): SignatureType {
    return this.props.signatureType;
  }
  get signatureTimestamp(): Date {
    return this.props.signatureTimestamp;
  }
  get eligibilityStatus(): WitnessEligibilityStatus {
    return this.props.eligibilityStatus;
  }
  get isBeneficiary(): boolean {
    return this.props.isBeneficiary;
  }
  get isExecutor(): boolean {
    return this.props.isExecutor;
  }
  get witnessAge(): number {
    return this.props.witnessAge;
  }
  get retainedUntil(): Date {
    return this.props.retainedUntil;
  }

  private constructor(props: WitnessSignatureProps) {
    super(props);
  }

  /**
   * Factory method to create a WitnessSignature
   * Validates Kenyan legal requirements for will witnesses
   */
  public static create(props: WitnessSignatureProps): Result<WitnessSignature> {
    const validationResults = combine([
      this.validateLegalRequirements(props),
      this.validateSignatureData(props),
      this.validateRetentionPeriod(props),
    ]);

    if (validationResults.isFailure) {
      return Result.fail<WitnessSignature>(validationResults.getErrorValue());
    }

    return Result.ok<WitnessSignature>(new WitnessSignature(props));
  }

  /**
   * Validates Kenyan Law of Succession Act requirements for witnesses
   * Section 11(3) & 11(4) LSA
   */
  private static validateLegalRequirements(props: WitnessSignatureProps): Result<void> {
    // Age requirement - must be at least 18 years old
    if (props.witnessAge < 18) {
      return Result.fail(
        `Witness must be at least 18 years old. Age provided: ${props.witnessAge}`,
      );
    }

    // Cannot be a beneficiary (Section 11(4)(a))
    if (props.isBeneficiary) {
      return Result.fail(
        'A beneficiary cannot witness a will under Kenyan law (Section 11(4)(a) LSA)',
      );
    }

    // Cannot be an executor (Section 11(4)(b))
    if (props.isExecutor) {
      return Result.fail(
        'An executor cannot witness a will under Kenyan law (Section 11(4)(b) LSA)',
      );
    }

    // Digital signature validation for Kenyan courts
    if (props.signatureType === SignatureType.DIGITAL_SIGNATURE && !props.idVerified) {
      return Result.fail(
        'Digital signatures require verified identity for Kenyan legal acceptance',
      );
    }

    // Minimum witness requirements (handled at aggregate level, but validate here too)
    if (!props.fullName || props.fullName.trim().length < 3) {
      return Result.fail('Witness full name is required');
    }

    return Result.ok();
  }

  /**
   * Validates signature data based on signature type
   */
  private static validateSignatureData(props: WitnessSignatureProps): Result<void> {
    if (!props.signatureData || props.signatureData.trim().length === 0) {
      return Result.fail('Signature data is required');
    }

    // Different validation based on signature type
    switch (props.signatureType) {
      case SignatureType.DIGITAL_SIGNATURE:
        // Should be base64 encoded or have specific format
        if (props.signatureData.length < 50) {
          return Result.fail('Digital signature data appears invalid');
        }
        break;

      case SignatureType.WET_SIGNATURE:
        // For scanned wet signatures, validate format
        if (!props.signatureData.startsWith('data:image/')) {
          return Result.fail('Wet signature should be in image format');
        }
        break;

      case SignatureType.BIOMETRIC_SIGNATURE:
        // Biometric data validation
        if (props.signatureData.length < 100) {
          return Result.fail('Biometric signature data appears insufficient');
        }
        break;
    }

    return Result.ok();
  }

  /**
   * Validates retention period for data protection compliance
   */
  private static validateRetentionPeriod(props: WitnessSignatureProps): Result<void> {
    const minimumRetention = new Date();
    minimumRetention.setFullYear(minimumRetention.getFullYear() + 7); // 7 years minimum for legal documents

    if (props.retainedUntil < minimumRetention) {
      return Result.fail(
        `Retention period must be at least 7 years for legal compliance. Provided: ${props.retainedUntil}`,
      );
    }

    if (props.retainedUntil < props.signatureTimestamp) {
      return Result.fail('Retention end date cannot be before signature date');
    }

    return Result.ok();
  }

  /**
   * Verifies a witness's identity
   */
  public verifyIdentity(
    verifiedBy: string,
    verificationMethod: WitnessVerificationMethod,
  ): Result<void> {
    if (this.props.idVerified) {
      return Result.fail('Witness identity already verified');
    }

    this.props.idVerified = true;
    this.props.verifiedBy = verifiedBy;
    this.props.verifiedAt = new Date();
    this.props.verificationMethod = verificationMethod;

    return Result.ok();
  }

  /**
   * Updates eligibility status
   */
  public updateEligibilityStatus(status: WitnessEligibilityStatus, reason?: string): Result<void> {
    if (
      status === WitnessEligibilityStatus.ELIGIBLE &&
      (this.props.isBeneficiary || this.props.isExecutor)
    ) {
      return Result.fail('Cannot mark beneficiary or executor as eligible');
    }

    this.props.eligibilityStatus = status;
    if (reason) {
      this.props.ineligibilityReason = reason;
    }
    this.props.eligibilityVerifiedAt = new Date();

    return Result.ok();
  }

  /**
   * Checks if witness signature is legally valid for Kenyan probate
   */
  public isLegallyValid(): boolean {
    return (
      this.props.idVerified &&
      this.props.eligibilityStatus === WitnessEligibilityStatus.ELIGIBLE &&
      this.props.witnessAge >= 18 &&
      !this.props.isBeneficiary &&
      !this.props.isExecutor &&
      this.props.retainedUntil > new Date()
    );
  }

  /**
   * Returns days until retention expires
   */
  public daysUntilRetentionExpiry(): number {
    const today = new Date();
    const diffTime = this.props.retainedUntil.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
