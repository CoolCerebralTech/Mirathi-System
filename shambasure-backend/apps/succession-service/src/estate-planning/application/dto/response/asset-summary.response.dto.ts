import { AssetType, AssetVerificationStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AssetSummaryResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  type: AssetType;

  @Expose()
  currentValue: number | null;

  @Expose()
  currency: string;

  @Expose()
  verificationStatus: AssetVerificationStatus;

  @Expose()
  isEncumbered: boolean;

  @Expose()
  canBeTransferred: boolean;

  @Expose()
  get formattedValue(): string {
    return `${this.currency} ${this.currentValue?.toLocaleString() ?? '0'}`;
  }

  @Expose()
  updatedAt: Date;
}
