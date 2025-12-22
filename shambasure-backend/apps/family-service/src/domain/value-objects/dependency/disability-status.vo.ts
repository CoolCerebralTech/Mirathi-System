// domain/value-objects/dependency/disability-status.vo.ts
import { ValueObject } from '../../base/value-object';

/**
 * Disability Status Value Object (S.29(2) LSA)
 *
 * Represents disability information for extended dependency rights
 */
interface DisabilityStatusProps {
  hasPhysicalDisability: boolean;
  hasMentalDisability: boolean;
  requiresOngoingCare: boolean;
  disabilityDetails?: string;
  medicalCertificateId?: string;
  assessmentDate?: Date;
}

export class DisabilityStatus extends ValueObject<DisabilityStatusProps> {
  private constructor(props: DisabilityStatusProps) {
    super(props);
  }

  public static create(props: DisabilityStatusProps): DisabilityStatus {
    return new DisabilityStatus({
      ...props,
      assessmentDate: props.assessmentDate ?? new Date(),
    });
  }

  protected validate(): void {
    // If requires ongoing care, must have at least one disability
    if (this.props.requiresOngoingCare) {
      if (!this.props.hasPhysicalDisability && !this.props.hasMentalDisability) {
        console.warn('Ongoing care required but no disability specified');
      }
    }
  }

  get hasPhysicalDisability(): boolean {
    return this.props.hasPhysicalDisability;
  }

  get hasMentalDisability(): boolean {
    return this.props.hasMentalDisability;
  }

  get requiresOngoingCare(): boolean {
    return this.props.requiresOngoingCare;
  }

  get disabilityDetails(): string | undefined {
    return this.props.disabilityDetails;
  }

  /**
   * Check if has any disability
   */
  public hasAnyDisability(): boolean {
    return this.props.hasPhysicalDisability || this.props.hasMentalDisability;
  }

  /**
   * Check if qualifies for S.29(2) extended rights
   */
  public qualifiesForExtendedRights(): boolean {
    return this.hasAnyDisability() && this.props.requiresOngoingCare;
  }

  public toJSON(): Record<string, any> {
    return {
      hasPhysicalDisability: this.props.hasPhysicalDisability,
      hasMentalDisability: this.props.hasMentalDisability,
      requiresOngoingCare: this.props.requiresOngoingCare,
      disabilityDetails: this.props.disabilityDetails,
      medicalCertificateId: this.props.medicalCertificateId,
      assessmentDate: this.props.assessmentDate?.toISOString(),
      hasAnyDisability: this.hasAnyDisability(),
      qualifiesForExtendedRights: this.qualifiesForExtendedRights(),
    };
  }
}
