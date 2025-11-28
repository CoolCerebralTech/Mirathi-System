export class GrantReplacedEvent {
  constructor(
    public readonly oldGrantId: string,
    public readonly newGrantId: string,
    public readonly estateId: string,
    public readonly replacementDate: Date,
    public readonly replacementReason: string,
    public readonly replacedBy: string,
  ) {}

  getEventType(): string {
    return 'GrantReplacedEvent';
  }
}
