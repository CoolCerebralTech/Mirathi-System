export class AssetEncumberedEvent {
  constructor(
    public readonly assetId: string,
    public readonly ownerId: string,
    public readonly encumbranceDescription: string, // e.g. "Mortgage with KCB Bank"
    public readonly amount: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
