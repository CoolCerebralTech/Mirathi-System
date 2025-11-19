import { AssetValue } from '../value-objects/asset-value.vo';

export class DebtPaymentMadeEvent {
  constructor(
    public readonly debtId: string,
    public readonly ownerId: string,
    public readonly amountPaid: AssetValue,
    public readonly remainingBalance: AssetValue,
    public readonly timestamp: Date = new Date(),
  ) {}
}
