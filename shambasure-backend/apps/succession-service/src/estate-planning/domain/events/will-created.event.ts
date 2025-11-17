export class WillCreatedEvent {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly title: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
