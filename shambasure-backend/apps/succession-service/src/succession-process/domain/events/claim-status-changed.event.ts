export class ClaimStatusChangedEvent {
  constructor(
    public readonly claimId: string,
    public readonly estateId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly reason?: string,
    public readonly changedBy?: string,
  ) {}

  getEventType(): string {
    return 'ClaimStatusChangedEvent';
  }
}
