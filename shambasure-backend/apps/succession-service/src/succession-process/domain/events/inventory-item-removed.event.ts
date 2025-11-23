export class InventoryItemRemovedEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly estateId: string,
    public readonly reason: string,
    public readonly removedBy: string,
    public readonly removalDate: Date,
  ) {}

  getEventType(): string {
    return 'InventoryItemRemovedEvent';
  }
}
