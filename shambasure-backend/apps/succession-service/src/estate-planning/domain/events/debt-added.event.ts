import { DebtType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';

export class DebtAddedEvent {
  constructor(
    public readonly debtId: string,
    public readonly ownerId: string,
    public readonly type: DebtType,
    public readonly principalAmount: AssetValue,
    public readonly creditorName: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
