export class EstateSettlementCompletedEvent {
  constructor(
    public readonly estateId: string,
    public readonly deceasedName: string,
    public readonly completionDate: Date,
    public readonly grossEstateValue: number,
    public readonly netEstateValue: number,
  ) {}

  getEventType(): string {
    return 'EstateSettlementCompletedEvent';
  }
}
