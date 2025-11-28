export class AssetVerifiedEvent {
  constructor(
    public readonly assetId: string,
    public readonly verifiedBy: string, // User ID of the verifier
    public readonly timestamp: Date = new Date(),
  ) {}
}
