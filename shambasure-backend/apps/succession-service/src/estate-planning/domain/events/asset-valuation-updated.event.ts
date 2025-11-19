import { AssetValue } from '../value-objects/asset-value.vo';

export class AssetValuationUpdatedEvent {
  constructor(
    public readonly assetId: string,
    public readonly ownerId: string,
    public readonly oldValue: AssetValue,
    public readonly newValue: AssetValue,
    public readonly reason: string | null, // e.g., "Annual Market Revaluation"
    public readonly timestamp: Date = new Date(),
  ) {}
}
