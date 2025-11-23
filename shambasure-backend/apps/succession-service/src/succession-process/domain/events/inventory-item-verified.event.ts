export class InventoryItemVerifiedEvent {
  constructor(
    public readonly inventoryId: string,
    public readonly estateId: string,
    public readonly verifiedBy: string,
    public readonly verificationMethod: string,
    public readonly verificationDate: Date,
    public readonly verificationNotes?: string,
  ) {}

  getEventType(): string {
    return 'InventoryItemVerifiedEvent';
  }
}
