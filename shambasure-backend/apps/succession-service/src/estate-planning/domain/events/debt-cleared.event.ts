export class DebtClearedEvent {
  constructor(
    public readonly debtId: string,
    public readonly ownerId: string,
    public readonly clearedDate: Date,
    public readonly settlementMethod: string | null, // e.g., "Cash", "Bank Transfer"
    public readonly timestamp: Date = new Date(),
  ) {}
}
