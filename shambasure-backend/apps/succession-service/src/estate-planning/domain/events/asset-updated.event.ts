export class AssetUpdatedEvent {
  constructor(
    public readonly assetId: string,
    public readonly ownerId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
