export class WitnessRejectedEvent {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly reason: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
