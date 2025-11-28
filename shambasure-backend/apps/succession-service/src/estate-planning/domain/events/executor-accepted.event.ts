export class ExecutorAcceptedEvent {
  constructor(
    public readonly executorId: string,
    public readonly willId: string,
    public readonly acceptedAt: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
