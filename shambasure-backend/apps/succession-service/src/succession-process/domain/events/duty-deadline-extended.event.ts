export class DutyDeadlineExtendedEvent {
  constructor(
    public readonly dutyId: string,
    public readonly estateId: string,
    public readonly executorId: string,
    public readonly type: string,
    public readonly oldDeadline: Date,
    public readonly newDeadline: Date,
    public readonly reason: string,
    public readonly extendedBy: string,
    public readonly extensionDays: number,
  ) {}

  getEventType(): string {
    return 'DutyDeadlineExtendedEvent';
  }
}
