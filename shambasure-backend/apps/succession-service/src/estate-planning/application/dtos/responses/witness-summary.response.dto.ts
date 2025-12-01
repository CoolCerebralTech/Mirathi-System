// witness-summary.response.dto.ts
import { WitnessEligibilityStatus, WitnessStatus, WitnessType } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class WitnessSummaryResponseDto {
  @Expose()
  id: string;

  @Expose()
  willId: string;

  @Expose()
  fullName: string;

  @Expose()
  witnessType: WitnessType;

  @Expose()
  relationship: string | null;

  @Expose()
  status: WitnessStatus;

  @Expose()
  eligibilityStatus: WitnessEligibilityStatus;

  @Expose()
  hasConflictOfInterest: boolean;

  @Expose()
  isProfessionalWitness: boolean;

  @Expose()
  signedAt: Date | null;

  @Expose()
  verifiedAt: Date | null;

  @Expose()
  get canSign(): boolean {
    return (
      this.status === WitnessStatus.PENDING &&
      this.eligibilityStatus === WitnessEligibilityStatus.ELIGIBLE &&
      !this.hasConflictOfInterest
    );
  }

  @Expose()
  get isVerified(): boolean {
    return this.verifiedAt !== null;
  }

  @Expose()
  get statusBadge(): string {
    if (
      this.status === WitnessStatus.PENDING &&
      this.eligibilityStatus !== WitnessEligibilityStatus.ELIGIBLE
    ) {
      return 'Pending Eligibility';
    }
    if (this.hasConflictOfInterest) return 'Conflict';
    return this.status;
  }

  @Expose()
  updatedAt: Date;
}
