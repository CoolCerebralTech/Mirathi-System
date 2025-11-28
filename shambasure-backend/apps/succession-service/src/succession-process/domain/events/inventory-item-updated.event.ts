export class InventoryItemUpdatedEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly estateId: string,
    public readonly field: string,
    public readonly oldValue: any,
    public readonly newValue: any,
    public readonly updatedBy: string,
    public readonly reason?: string,
  ) {}

  getEventType(): string {
    return 'InventoryItemUpdatedEvent';
  }
}
