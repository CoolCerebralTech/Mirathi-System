export class EstateDebtsSettledEvent {
  constructor(
    public readonly estateId: string,
    public readonly totalDebtsSettled: number,
    public readonly settlementDate: Date,
  ) {}

  getEventType(): string {
    return 'EstateDebtsSettledEvent';
  }
}
