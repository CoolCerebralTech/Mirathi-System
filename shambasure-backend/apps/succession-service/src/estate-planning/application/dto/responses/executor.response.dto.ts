import {
  ExecutorAppointmentType,
  ExecutorCompensationType,
  ExecutorEligibilityStatus,
  ExecutorStatus,
} from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class ExecutorIdentityResponseDto {
  @Expose()
  executorId: string | null;

  @Expose()
  fullName: string | null;

  @Expose()
  email: string | null;

  @Expose()
  phone: string | null;

  @Expose()
  idNumber: string | null;

  @Expose()
  kraPin: string | null;

  @Expose()
  get displayName(): string {
    return this.fullName || `User ${this.executorId}` || 'Unknown Executor';
  }

  @Expose()
  get contactInfo(): string {
    return [this.email, this.phone].filter(Boolean).join(' | ');
  }
}

@Exclude()
export class ExecutorProfessionalResponseDto {
  @Expose()
  isProfessional: boolean;

  @Expose()
  professionalQualification: string | null;

  @Expose()
  practicingCertificateNumber: string | null;

  @Expose()
  get isQualified(): boolean {
    return Boolean(this.practicingCertificateNumber);
  }

  @Expose()
  get professionalSummary(): string {
    if (!this.isProfessional) return 'Lay Executor';
    return `${this.professionalQualification} (${this.practicingCertificateNumber})`;
  }
}

@Exclude()
export class ExecutorRelationshipResponseDto {
  @Expose()
  relationship: string | null;

  @Expose()
  relationshipDuration: string | null;

  @Expose()
  get relationshipDescription(): string {
    return this.relationship || 'Not specified';
  }
}

@Exclude()
export class ExecutorAddressResponseDto {
  @Expose()
  physicalAddress: Record<string, any> | null;

  @Expose()
  postalAddress: Record<string, any> | null;

  @Expose()
  get hasAddress(): boolean {
    return Boolean(this.physicalAddress || this.postalAddress);
  }

  @Expose()
  get primaryAddress(): Record<string, any> | null {
    return this.physicalAddress || this.postalAddress;
  }
}

@Exclude()
export class ExecutorEligibilityResponseDto {
  @Expose()
  eligibilityStatus: ExecutorEligibilityStatus;

  @Expose()
  eligibilityVerifiedAt: Date | null;

  @Expose()
  eligibilityVerifiedBy: string | null;

  @Expose()
  ineligibilityReason: string | null;

  @Expose()
  get isEligible(): boolean {
    return this.eligibilityStatus === ExecutorEligibilityStatus.ELIGIBLE;
  }

  @Expose()
  get isVerified(): boolean {
    return this.eligibilityStatus !== ExecutorEligibilityStatus.PENDING_VERIFICATION;
  }

  @Expose()
  get eligibilitySummary(): string {
    switch (this.eligibilityStatus) {
      case ExecutorEligibilityStatus.ELIGIBLE:
        return 'Eligible';

      case ExecutorEligibilityStatus.INELIGIBLE_MINOR:
        return 'Ineligible: Minor';

      case ExecutorEligibilityStatus.INELIGIBLE_BANKRUPT:
        return 'Ineligible: Bankrupt';

      case ExecutorEligibilityStatus.INELIGIBLE_CRIMINAL_RECORD:
        return 'Ineligible: Criminal Record';

      case ExecutorEligibilityStatus.INELIGIBLE_NON_RESIDENT:
        return 'Ineligible: Non-Resident';

      case ExecutorEligibilityStatus.PENDING_VERIFICATION:
        return 'Pending Verification';

      default:
        return 'Unknown';
    }
  }
}

@Exclude()
export class ExecutorTimelineResponseDto {
  @Expose()
  nominatedAt: Date | null;

  @Expose()
  appointedAt: Date | null;

  @Expose()
  acceptedAt: Date | null;

  @Expose()
  declinedAt: Date | null;

  @Expose()
  removedAt: Date | null;

  @Expose()
  completedAt: Date | null;

  @Expose()
  get currentPhase(): string {
    if (this.completedAt) return 'Completed';
    if (this.removedAt) return 'Removed';
    if (this.declinedAt) return 'Declined';
    if (this.acceptedAt) return 'Active';
    if (this.appointedAt) return 'Appointed';
    if (this.nominatedAt) return 'Nominated';
    return 'Unknown';
  }

  @Expose()
  get daysInCurrentPhase(): number | null {
    const referenceDate =
      this.completedAt ||
      this.removedAt ||
      this.declinedAt ||
      this.acceptedAt ||
      this.appointedAt ||
      this.nominatedAt;
    if (!referenceDate) return null;

    const today = new Date();
    const diffTime = today.getTime() - referenceDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}

@Exclude()
export class ExecutorCompensationResponseDto {
  @Expose()
  isCompensated: boolean;

  @Expose()
  compensationType: ExecutorCompensationType;

  @Expose()
  compensationAmount: number | null;

  @Expose()
  compensationPercentage: number | null;

  @Expose()
  hourlyRate: number | null;

  @Expose()
  estimatedHours: number | null;

  @Expose()
  courtApprovedCompensation: boolean;

  @Expose()
  get compensationDescription(): string {
    if (!this.isCompensated) return 'No compensation';

    switch (this.compensationType) {
      case ExecutorCompensationType.FIXED_AMOUNT:
        return `Fixed: KES ${this.compensationAmount?.toLocaleString()}`;
      case ExecutorCompensationType.PERCENTAGE_OF_ESTATE:
        return `Percentage: ${this.compensationPercentage}% of estate`;
      case ExecutorCompensationType.HOURLY_RATE:
        return `Hourly: KES ${this.hourlyRate}/hour (est. ${this.estimatedHours} hours)`;
      case ExecutorCompensationType.STATUTORY_SCALE:
        return 'Statutory scale';
      default:
        return 'Unknown compensation';
    }
  }

  @Expose()
  get estimatedCompensation(): number | null {
    // This would need estate value context from application service
    return null;
  }

  @Expose()
  get requiresCourtApproval(): boolean {
    return !this.courtApprovedCompensation && this.isCompensated;
  }
}

@Exclude()
export class ExecutorBondResponseDto {
  @Expose()
  requiresBond: boolean;

  @Expose()
  bondAmount: number | null;

  @Expose()
  bondProvided: boolean;

  @Expose()
  bondProvider: string | null;

  @Expose()
  bondExpiryDate: Date | null;

  @Expose()
  get bondStatus(): string {
    if (!this.requiresBond) return 'Not Required';
    if (this.bondProvided) return 'Provided';
    return 'Required';
  }

  @Expose()
  get isBondValid(): boolean {
    if (!this.bondProvided || !this.bondExpiryDate) return false;
    return this.bondExpiryDate > new Date();
  }

  @Expose()
  get bondSummary(): string {
    if (!this.requiresBond) return 'No bond required';
    if (this.bondProvided) {
      return `Bond provided by ${this.bondProvider} (KES ${this.bondAmount?.toLocaleString()})`;
    }
    return `Bond required: KES ${this.bondAmount?.toLocaleString()}`;
  }
}

@Exclude()
export class ExecutorDutiesResponseDto {
  @Expose()
  specificDuties: string | null;

  @Expose()
  limitations: string | null;

  @Expose()
  specialPowers: string | null;

  @Expose()
  get hasCustomDuties(): boolean {
    return Boolean(this.specificDuties || this.limitations || this.specialPowers);
  }

  @Expose()
  get dutiesSummary(): string {
    if (!this.hasCustomDuties) return 'Standard executor duties';
    return 'Custom duties defined';
  }
}

@Exclude()
export class ExecutorPreferencesResponseDto {
  @Expose()
  preferredContactMethod: string | null;

  @Expose()
  languagePreference: string;

  @Expose()
  get communicationSummary(): string {
    return [this.preferredContactMethod, this.languagePreference].filter(Boolean).join(' • ');
  }
}

@Exclude()
export class ExecutorResponseDto {
  @Expose()
  id: string;

  @Expose()
  willId: string;

  @Expose()
  isPrimary: boolean;

  @Expose()
  orderOfPriority: number;

  @Expose()
  appointmentType: ExecutorAppointmentType;

  @Expose()
  status: ExecutorStatus;

  @Expose()
  declineReason: string | null;

  @Expose()
  removalReason: string | null;

  // Nested DTOs
  @Expose()
  @Type(() => ExecutorIdentityResponseDto)
  identity: ExecutorIdentityResponseDto;

  @Expose()
  @Type(() => ExecutorProfessionalResponseDto)
  professional: ExecutorProfessionalResponseDto;

  @Expose()
  @Type(() => ExecutorRelationshipResponseDto)
  relationship: ExecutorRelationshipResponseDto;

  @Expose()
  @Type(() => ExecutorAddressResponseDto)
  address: ExecutorAddressResponseDto;

  @Expose()
  @Type(() => ExecutorEligibilityResponseDto)
  eligibility: ExecutorEligibilityResponseDto;

  @Expose()
  @Type(() => ExecutorTimelineResponseDto)
  timeline: ExecutorTimelineResponseDto;

  @Expose()
  @Type(() => ExecutorCompensationResponseDto)
  compensation: ExecutorCompensationResponseDto;

  @Expose()
  @Type(() => ExecutorBondResponseDto)
  bond: ExecutorBondResponseDto;

  @Expose()
  @Type(() => ExecutorDutiesResponseDto)
  duties: ExecutorDutiesResponseDto;

  @Expose()
  @Type(() => ExecutorPreferencesResponseDto)
  preferences: ExecutorPreferencesResponseDto;

  // Domain Logic Exposed
  @Expose()
  get canAcceptRole(): boolean {
    return (
      this.status === ExecutorStatus.NOMINATED &&
      this.eligibility.isEligible &&
      (!this.bond.requiresBond || this.bond.bondProvided)
    );
  }

  @Expose()
  get canBeCompensated(): boolean {
    const validStatuses: ExecutorStatus[] = [
      ExecutorStatus.NOMINATED,
      ExecutorStatus.ACTIVE,
      ExecutorStatus.COMPLETED,
    ];

    return validStatuses.includes(this.status);
  }

  @Expose()
  get requiresCourtApproval(): boolean {
    return (
      this.compensation.requiresCourtApproval || (this.bond.requiresBond && !this.bond.bondProvided)
    );
  }

  @Expose()
  get statusSummary(): string {
    if (this.status === ExecutorStatus.NOMINATED && !this.eligibility.isVerified) {
      return 'Pending Eligibility Check';
    }
    if (this.status === ExecutorStatus.NOMINATED && this.eligibility.isEligible) {
      return 'Ready for Acceptance';
    }
    return this.status;
  }

  // Timestamps
  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
