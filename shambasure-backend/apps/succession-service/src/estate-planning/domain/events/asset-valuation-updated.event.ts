export class AssetValuationUpdatedEvent {
  constructor(
    public readonly assetId: string,
    public readonly ownerId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly valuationDate: Date,
    public readonly source: string, // e.g., "Registered Valuer", "Market Estimate"
    public readonly timestamp: Date = new Date(),
  ) {}
}
