export class WitnessVerifiedEvent {
  constructor(
    public readonly witnessId: string,
    public readonly willId: string,
    public readonly verifiedBy: string, // User ID of the verifier (Admin/Official)
    public readonly verifiedAt: Date = new Date(),
    public readonly timestamp: Date = new Date(),
  ) {}
}
