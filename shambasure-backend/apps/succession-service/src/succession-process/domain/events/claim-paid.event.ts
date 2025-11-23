export class ClaimPaidEvent {
  constructor(
    public readonly claimId: string,
    public readonly estateId: string,
    public readonly amountPaid: number,
    public readonly paymentDate: Date,
    public readonly paymentMethod: string,
    public readonly transactionReference?: string,
  ) {}

  getEventType(): string {
    return 'ClaimPaidEvent';
  }
}
