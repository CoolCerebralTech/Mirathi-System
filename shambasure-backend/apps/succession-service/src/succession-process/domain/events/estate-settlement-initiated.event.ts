export class EstateSettlementInitiatedEvent {
  constructor(
    public readonly estateId: string,
    public readonly deceasedName: string,
    public readonly dateOfDeath: Date,
    public readonly initiationDate: Date,
  ) {}

  getEventType(): string {
    return 'EstateSettlementInitiatedEvent';
  }
}
