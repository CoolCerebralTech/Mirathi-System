// succession-service/src/succession-process/domain/events/duty-overdue.event.ts

export class DutyOverdueEvent {
  constructor(
    public readonly dutyId: string,
    public readonly estateId: string,
    public readonly executorId: string,
    public readonly daysOverdue: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
