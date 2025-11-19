export class AssetVerifiedEvent {
  constructor(
    public readonly assetId: string,
    public readonly documentId: string, // The specific Title Deed/Logbook used for verification
    public readonly verifiedBy: string, // Admin or System ID
    public readonly timestamp: Date = new Date(),
  ) {}
}
