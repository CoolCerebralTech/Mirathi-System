export class WitnessSignedEvent {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly signedAt: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
