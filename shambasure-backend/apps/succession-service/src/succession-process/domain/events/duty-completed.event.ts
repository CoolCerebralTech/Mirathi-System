// succession-service/src/succession-process/domain/events/duty-completed.event.ts

export class DutyCompletedEvent {
  constructor(
    public readonly dutyId: string,
    public readonly estateId: string,
    public readonly completedAt: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
