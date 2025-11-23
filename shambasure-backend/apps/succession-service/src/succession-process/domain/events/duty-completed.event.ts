export class DutyCompletedEvent {
  constructor(
    public readonly dutyId: string,
    public readonly estateId: string,
    public readonly executorId: string,
    public readonly completedAt: Date,
    public readonly type: string,
    public readonly notes?: string,
    public readonly supportingDocuments?: string[],
  ) {}

  getEventType(): string {
    return 'DutyCompletedEvent';
  }
}
