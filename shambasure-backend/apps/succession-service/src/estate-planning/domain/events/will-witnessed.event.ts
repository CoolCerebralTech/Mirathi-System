export class WillWitnessedEvent {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
