import { DebtType } from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

import { AssetValueResponse } from './asset.response.dto';

@Exclude()
export class DebtResponseDto {
  @Expose()
  id: string;

  @Expose()
  type: DebtType;

  @Expose()
  description: string;

  @Expose()
  assetId?: string; // If it's a mortgage

  @Expose()
  creditorName: string;

  @Expose()
  @Type(() => AssetValueResponse)
  principalAmount: AssetValueResponse;

  @Expose()
  @Type(() => AssetValueResponse)
  outstandingBalance: AssetValueResponse;

  @Expose()
  dueDate?: Date;

  @Expose()
  isPaid: boolean;

  @Expose()
  paidAt?: Date;

  // Helper for UI Priority Sorting
  @Expose()
  get isPriorityDebt(): boolean {
    return this.type === 'FUNERAL_EXPENSE' || this.type === 'TAX_OBLIGATION';
  }
}
