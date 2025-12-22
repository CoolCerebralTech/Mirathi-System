import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';

export class InvalidWitnessException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_WITNESS');
  }
}

export enum SignatureType {
  DIGITAL = 'DIGITAL',
  WET = 'WET',
  BIOMETRIC = 'BIOMETRIC',
}

export enum WitnessVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

interface WitnessSignatureProps {
  witnessId: string;
  fullName: string;
  signatureType: SignatureType;
  signatureData: string; // Hash or Encrypted Blob
  signedAt: Date;

  // LSA S.11 Requirements
  witnessAge: number;
  isBeneficiary: boolean;
  isExecutor: boolean;

  // Verification
  status: WitnessVerificationStatus;
  verifiedBy?: string;
  verificationMethod?: string; // "ID_CHECK", "VIDEO"
}

export class WitnessSignature extends ValueObject<WitnessSignatureProps> {
  private constructor(props: WitnessSignatureProps) {
    super(props);
  }

  protected validate(): void {
    // S.11 LSA Compliance
    if (this.props.witnessAge < 18) {
      throw new InvalidWitnessException('Witness must be 18+ (S.11 LSA)');
    }

    // S.11(4) - Beneficiary/Executor logic
    // Technically, they CAN witness, but they lose their bequest/appointment.
    // However, our system enforces "Safe Wills", so we block it or warn.
    // Strict Mode: Block.
    if (this.props.isBeneficiary) {
      throw new InvalidWitnessException(
        'Beneficiary cannot be a witness (S.13(1) LSA - Gift Void)',
      );
    }

    // Actually S.13(2) says appointment as executor is NOT void if they witness,
    // but best practice is independent witnesses. We allowed checking "isExecutor".
    // We will allow it but flag it in UI.

    if (!this.props.signatureData) {
      throw new InvalidWitnessException('Signature data missing');
    }
  }

  static create(props: {
    witnessId: string;
    fullName: string;
    signatureType: SignatureType;
    signatureData: string;
    witnessAge: number;
    isBeneficiary: boolean;
    isExecutor: boolean;
  }): WitnessSignature {
    return new WitnessSignature({
      ...props,
      signedAt: new Date(),
      status: WitnessVerificationStatus.PENDING,
    });
  }

  // --- Immutable Operations ---

  verify(verifierId: string, method: string): WitnessSignature {
    if (this.props.status === WitnessVerificationStatus.VERIFIED) return this;

    return new WitnessSignature({
      ...this.props,
      status: WitnessVerificationStatus.VERIFIED,
      verifiedBy: verifierId,
      verificationMethod: method,
    });
  }

  reject(verifierId: string): WitnessSignature {
    return new WitnessSignature({
      ...this.props,
      status: WitnessVerificationStatus.REJECTED,
      verifiedBy: verifierId,
    });
  }

  // --- Logic ---

  isValid(): boolean {
    return this.props.status === WitnessVerificationStatus.VERIFIED;
  }

  public toJSON(): Record<string, any> {
    return {
      witnessName: this.props.fullName,
      signedAt: this.props.signedAt,
      type: this.props.signatureType,
      status: this.props.status,
      compliance: {
        age: this.props.witnessAge,
        conflictOfInterest: this.props.isBeneficiary || this.props.isExecutor,
      },
    };
  }
}
