// src/estate-service/src/domain/value-objects/beneficiary-identity.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

export interface BeneficiaryIdentityProps {
  type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';
  userId?: string;
  familyMemberId?: string;
  externalDetails?: {
    name: string;
    nationalId?: string;
    kraPin?: string;
    relationship?: string;
  };
  // Optional derived props for reconstruction
  identityType?: string;
}

/**
 * Beneficiary Identity Value Object
 *
 * Represents who can receive an inheritance in Kenya
 * Legal Requirements:
 * - Must be identifiable (cannot be anonymous)
 * - Must not be a witness (S.11(2) LSA)
 * - Cannot be the testator themselves
 * - Can be natural person, legal entity, or charitable organization
 */
export class BeneficiaryIdentity extends ValueObject<BeneficiaryIdentityProps> {
  constructor(props: BeneficiaryIdentityProps) {
    super(props);
  }
  // --- FACTORY FOR MAPPER ---
  public static create(props: any): BeneficiaryIdentity {
    // Basic validation or cleanup before instantiation
    return new BeneficiaryIdentity({
      type: props.type,
      userId: props.userId,
      familyMemberId: props.familyMemberId,
      externalDetails: props.externalDetails,
    });
  }

  protected validate(): void {
    // Validate based on type
    switch (this.props.type) {
      case 'USER':
        if (!this.props.userId) {
          throw new ValueObjectValidationError('User beneficiary must have userId', 'userId');
        }
        break;

      case 'FAMILY_MEMBER':
        if (!this.props.familyMemberId) {
          throw new ValueObjectValidationError(
            'Family member beneficiary must have familyMemberId',
            'familyMemberId',
          );
        }
        break;

      case 'EXTERNAL':
        if (!this.props.externalDetails?.name) {
          throw new ValueObjectValidationError(
            'External beneficiary must have at least a name',
            'externalDetails.name',
          );
        }

        // Validate Kenyan ID if provided
        if (this.props.externalDetails.nationalId) {
          this.validateKenyanNationalId(this.props.externalDetails.nationalId);
        }

        // Validate KRA PIN if provided
        if (this.props.externalDetails.kraPin) {
          this.validateKraPin(this.props.externalDetails.kraPin);
        }
        break;

      default:
        throw new ValueObjectValidationError(
          `Invalid beneficiary type: $string{this.props.type}`,
          'type',
        );
    }
  }

  private validateKenyanNationalId(id: string): void {
    // Basic Kenyan ID validation (8 digits starting with 1-3)
    const idPattern = /^[1-3]\d{7}$/;
    if (!idPattern.test(id)) {
      throw new ValueObjectValidationError(
        'Invalid Kenyan National ID format',
        'externalDetails.nationalId',
      );
    }
  }

  private validateKraPin(pin: string): void {
    // KRA PIN format: Letter followed by 10 digits
    const pinPattern = /^[A-Z]\d{10}$/;
    if (!pinPattern.test(pin)) {
      throw new ValueObjectValidationError('Invalid KRA PIN format', 'externalDetails.kraPin');
    }
  }

  /**
   * Get identifier based on type
   */
  public getIdentifier(): string {
    switch (this.props.type) {
      case 'USER':
        return `USER:${this.props.userId}`;
      case 'FAMILY_MEMBER':
        return `FAMILY:${this.props.familyMemberId}`;
      case 'EXTERNAL':
        return `EXTERNAL:${this.props.externalDetails?.name}`;
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Check if this is an external beneficiary
   */
  public isExternal(): boolean {
    return this.props.type === 'EXTERNAL';
  }

  /**
   * Check if this is a registered user
   */
  public isUser(): boolean {
    return this.props.type === 'USER';
  }

  /**
   * Check if this is a family member
   */
  public isFamilyMember(): boolean {
    return this.props.type === 'FAMILY_MEMBER';
  }

  /**
   * Get display name
   */
  public getDisplayName(): string {
    switch (this.props.type) {
      case 'USER':
        return `User ${this.props.userId?.substring(0, 8)}...`;
      case 'FAMILY_MEMBER':
        return `Family Member ${this.props.familyMemberId?.substring(0, 8)}...`;
      case 'EXTERNAL':
        return this.props.externalDetails?.name || 'Unknown External';
      default:
        return 'Unknown';
    }
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.props.type,
      userId: this.props.userId,
      familyMemberId: this.props.familyMemberId,
      externalDetails: this.props.externalDetails,
      identifier: this.getIdentifier(),
      displayName: this.getDisplayName(),
    };
  }

  // Static factory methods
  public static createUser(userId: string): BeneficiaryIdentity {
    return new BeneficiaryIdentity({
      type: 'USER',
      userId,
    });
  }

  public static createFamilyMember(familyMemberId: string): BeneficiaryIdentity {
    return new BeneficiaryIdentity({
      type: 'FAMILY_MEMBER',
      familyMemberId,
    });
  }

  public static createExternal(
    name: string,
    nationalId?: string,
    kraPin?: string,
    relationship?: string,
  ): BeneficiaryIdentity {
    return new BeneficiaryIdentity({
      type: 'EXTERNAL',
      externalDetails: {
        name,
        nationalId,
        kraPin,
        relationship,
      },
    });
  }
}
