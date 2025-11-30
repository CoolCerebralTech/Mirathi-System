import { LegalCapacityStatus, WillStatus, WillType } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class WillSummaryResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  testatorId: string;

  @Expose()
  type: WillType;

  @Expose()
  status: WillStatus;

  @Expose()
  legalCapacityStatus: LegalCapacityStatus;

  @Expose()
  witnessCount: number;

  @Expose()
  hasAllWitnesses: boolean;

  @Expose()
  assetCount: number;

  @Expose()
  beneficiaryCount: number;

  @Expose()
  executorCount: number;

  @Expose()
  isRevoked: boolean;

  @Expose()
  activatedAt: Date | null;

  @Expose()
  get isActive(): boolean {
    return this.status === WillStatus.ACTIVE && !this.isRevoked;
  }

  @Expose()
  get canBeActivated(): boolean {
    return (
      this.status === WillStatus.WITNESSED &&
      this.legalCapacityStatus === LegalCapacityStatus.ASSESSED_COMPETENT &&
      this.hasAllWitnesses
    );
  }

  @Expose()
  get isComplete(): boolean {
    return this.assetCount > 0 && this.beneficiaryCount > 0 && this.executorCount > 0;
  }

  @Expose()
  get statusBadge(): string {
    if (this.isRevoked) return 'Revoked';
    if (this.status === WillStatus.WITNESSED && this.canBeActivated) return 'Ready to Activate';
    return this.status;
  }

  @Expose()
  lastModified: Date;

  @Expose()
  updatedAt: Date;
}
