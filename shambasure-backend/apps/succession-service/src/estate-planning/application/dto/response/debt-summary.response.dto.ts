import { DebtPriority, DebtStatus, DebtType } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DebtSummaryResponseDto {
  @Expose()
  id: string;

  @Expose()
  type: DebtType;

  @Expose()
  description: string;

  @Expose()
  creditorName: string;

  @Expose()
  principalAmount: number;

  @Expose()
  outstandingBalance: number;

  @Expose()
  currency: string;

  @Expose()
  priority: DebtPriority;

  @Expose()
  status: DebtStatus;

  @Expose()
  isPaid: boolean;

  @Expose()
  isStatuteBarred: boolean;

  @Expose()
  isDisputed: boolean;

  @Expose()
  get canMakePayments(): boolean {
    if (this.isPaid) return false;
    if (this.isStatuteBarred) return false;
    if (this.isDisputed) return false;
    return true;
  }

  @Expose()
  get formattedBalance(): string {
    return `${this.currency} ${this.outstandingBalance.toLocaleString()}`;
  }

  @Expose()
  get statusBadge(): string {
    if (this.isPaid) return 'Paid';
    if (this.isStatuteBarred) return 'Statute Barred';
    if (this.isDisputed) return 'Disputed';
    if (this.outstandingBalance < this.principalAmount) return 'Partially Paid';
    return 'Outstanding';
  }

  @Expose()
  updatedAt: Date;
}
