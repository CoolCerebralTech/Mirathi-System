import { AssetValue } from '../../../estate-planning/domain/value-objects/asset-value.vo';

export class InventoryItemAddedEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly estateId: string,
    public readonly description: string,
    public readonly estimatedValue: AssetValue,
    public readonly assetType: string,
    public readonly assetId?: string,
    public readonly ownershipType?: string,
  ) {}

  getEventType(): string {
    return 'InventoryItemAddedEvent';
  }

  getPayload() {
    return {
      inventoryId: this.inventoryId,
      estateId: this.estateId,
      description: this.description,
      estimatedValue: this.estimatedValue.getAmount(),
      currency: this.estimatedValue.getCurrency(),
      assetType: this.assetType,
      assetId: this.assetId,
      ownershipType: this.ownershipType,
    };
  }
}
