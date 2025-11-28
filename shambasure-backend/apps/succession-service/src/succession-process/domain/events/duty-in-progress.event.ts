export class DutyInProgressEvent {
  constructor(
    public readonly dutyId: string,
    public readonly estateId: string,
    public readonly executorId: string,
    public readonly type: string,
    public readonly startedAt: Date,
    public readonly estimatedCompletion?: Date,
    public readonly progressNotes?: string,
  ) {}

  getEventType(): string {
    return 'DutyInProgressEvent';
  }
}
