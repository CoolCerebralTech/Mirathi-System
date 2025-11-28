import { DebtStatus } from '@prisma/client';

export class DebtStatusUpdatedEvent {
  constructor(
    public readonly debtId: string,
    public readonly ownerId: string,
    public readonly newStatus: DebtStatus,
    public readonly outstandingBalance: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
