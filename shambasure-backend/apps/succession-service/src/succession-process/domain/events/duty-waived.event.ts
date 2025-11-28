export class DutyWaivedEvent {
  constructor(
    public readonly dutyId: string,
    public readonly estateId: string,
    public readonly executorId: string,
    public readonly type: string,
    public readonly reason: string,
    public readonly waivedBy: string,
    public readonly waivedAt: Date,
    public readonly courtOrderNumber?: string,
  ) {}

  getEventType(): string {
    return 'DutyWaivedEvent';
  }
}
