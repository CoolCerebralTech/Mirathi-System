export class GrantConfirmedEvent {
  constructor(
    public readonly grantId: string,
    public readonly estateId: string,
    public readonly confirmedDate: Date,
    public readonly confirmedBy: string,
    public readonly courtOrderNumber?: string,
    public readonly confirmationNotes?: string,
  ) {}

  getEventType(): string {
    return 'GrantConfirmedEvent';
  }
}
