// succession-service/src/succession-process/domain/events/inventory-item-verified.event.ts

export class InventoryItemVerifiedEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly estateId: string,
    public readonly verifiedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
