import { BeneficiaryType, DistributionStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class BeneficiarySummaryResponseDto {
  @Expose()
  id: string;

  @Expose()
  assetId: string;

  @Expose()
  beneficiaryType: BeneficiaryType;

  @Expose()
  displayName: string;

  @Expose()
  relationshipDescription: string;

  @Expose()
  allocationDescription: string;

  @Expose()
  distributionStatus: DistributionStatus;

  @Expose()
  canBeDistributed: boolean;

  @Expose()
  legalStatus: string;

  @Expose()
  get statusBadge(): string {
    if (this.distributionStatus === DistributionStatus.COMPLETED) return 'Distributed';
    if (!this.canBeDistributed) return 'Blocked';
    return 'Ready';
  }

  @Expose()
  updatedAt: Date;
}
