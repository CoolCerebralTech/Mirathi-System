// succession-service/src/succession-process/domain/events/inventory-item-added.event.ts

import { AssetValue } from '../../../estate-planning/domain/value-objects/asset-value.vo';

export class InventoryItemAddedEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly estateId: string,
    public readonly description: string,
    public readonly estimatedValue: AssetValue,
    public readonly assetId?: string, // If linked to a digital asset record
    public readonly timestamp: Date = new Date(),
  ) {}
}
