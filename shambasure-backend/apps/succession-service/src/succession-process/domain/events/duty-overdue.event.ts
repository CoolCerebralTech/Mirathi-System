export class DutyOverdueEvent {
  constructor(
    public readonly dutyId: string,
    public readonly estateId: string,
    public readonly executorId: string,
    public readonly type: string,
    public readonly daysOverdue: number,
    public readonly originalDeadline: Date,
    public readonly overdueNotificationSent: boolean = false,
  ) {}

  getEventType(): string {
    return 'DutyOverdueEvent';
  }
}
