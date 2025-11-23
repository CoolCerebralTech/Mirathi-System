export class GrantAmendedEvent {
  constructor(
    public readonly grantId: string,
    public readonly estateId: string,
    public readonly amendmentDate: Date,
    public readonly amendmentReason: string,
    public readonly amendedBy: string,
    public readonly changes: string[],
    public readonly courtOrderNumber?: string,
  ) {}

  getEventType(): string {
    return 'GrantAmendedEvent';
  }
}
