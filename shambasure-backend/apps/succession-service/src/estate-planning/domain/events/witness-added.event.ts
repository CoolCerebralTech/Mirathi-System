export class WitnessAddedEvent {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly witnessInfo: {
      userId?: string;
      fullName: string;
    },
    public readonly timestamp: Date = new Date(),
  ) {}
}
