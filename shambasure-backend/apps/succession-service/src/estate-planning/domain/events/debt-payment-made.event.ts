export class DebtPaymentMadeEvent {
  constructor(
    public readonly debtId: string,
    public readonly ownerId: string,
    public readonly paymentAmount: number,
    public readonly currency: string,
    public readonly remainingBalance: number,
    public readonly paymentDate: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
