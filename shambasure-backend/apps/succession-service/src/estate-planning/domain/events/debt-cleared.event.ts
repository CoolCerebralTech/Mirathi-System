export class DebtClearedEvent {
  constructor(
    public readonly debtId: string,
    public readonly ownerId: string,
    public readonly clearedDate: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
