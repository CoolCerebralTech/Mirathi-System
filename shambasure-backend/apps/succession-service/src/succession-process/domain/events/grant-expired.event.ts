export class GrantExpiredEvent {
  constructor(
    public readonly grantId: string,
    public readonly estateId: string,
    public readonly expiryDate: Date,
    public readonly grantType: string,
    public readonly applicantId: string,
  ) {}

  getEventType(): string {
    return 'GrantExpiredEvent';
  }
}
