export class WitnessVerifiedEvent {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly verifiedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
