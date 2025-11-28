export class EstateSettlementStalledEvent {
  constructor(
    public readonly estateId: string,
    public readonly deceasedName: string,
    public readonly stallDate: Date,
    public readonly stalledAtStep: string,
  ) {}

  getEventType(): string {
    return 'EstateSettlementStalledEvent';
  }
}
