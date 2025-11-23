export class InventoryItemDisputedEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly estateId: string,
    public readonly disputeReason: string,
    public readonly disputedBy: string,
    public readonly disputeDate: Date,
    public readonly supportingEvidence?: string[],
  ) {}

  getEventType(): string {
    return 'InventoryItemDisputedEvent';
  }
}
