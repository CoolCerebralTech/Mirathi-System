export class ClaimDisputedEvent {
  constructor(
    public readonly claimId: string,
    public readonly estateId: string,
    public readonly disputeReason: string,
    public readonly courtCaseNumber?: string,
  ) {}

  getEventType(): string {
    return 'ClaimDisputedEvent';
  }
}
