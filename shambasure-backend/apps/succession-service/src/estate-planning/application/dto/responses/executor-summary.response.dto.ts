import { ExecutorAppointmentType, ExecutorEligibilityStatus, ExecutorStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ExecutorSummaryResponseDto {
  @Expose()
  id: string;

  @Expose()
  displayName: string;

  @Expose()
  relationshipDescription: string;

  @Expose()
  isPrimary: boolean;

  @Expose()
  orderOfPriority: number;

  @Expose()
  status: ExecutorStatus;

  @Expose()
  eligibilityStatus: ExecutorEligibilityStatus;

  @Expose()
  appointmentType: ExecutorAppointmentType;

  @Expose()
  isProfessional: boolean;

  @Expose()
  requiresBond: boolean;

  @Expose()
  bondProvided: boolean;

  @Expose()
  get canAcceptRole(): boolean {
    return (
      this.status === ExecutorStatus.NOMINATED &&
      this.eligibilityStatus === ExecutorEligibilityStatus.ELIGIBLE &&
      (!this.requiresBond || this.bondProvided)
    );
  }

  @Expose()
  get statusBadge(): string {
    if (
      this.status === ExecutorStatus.NOMINATED &&
      this.eligibilityStatus !== ExecutorEligibilityStatus.ELIGIBLE
    ) {
      return 'Pending Eligibility';
    }
    return this.status;
  }

  @Expose()
  updatedAt: Date;
}
