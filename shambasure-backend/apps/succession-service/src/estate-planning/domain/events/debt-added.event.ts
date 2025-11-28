import { DebtPriority, DebtType } from '@prisma/client';

export class DebtAddedEvent {
  constructor(
    public readonly debtId: string,
    public readonly ownerId: string,
    public readonly type: DebtType,
    public readonly principalAmount: number,
    public readonly currency: string,
    public readonly creditorName: string,
    public readonly priority: DebtPriority,
    public readonly assetId?: string, // Optional: Only if debt is secured against an asset
    public readonly timestamp: Date = new Date(),
  ) {}
}
