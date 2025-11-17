export class ExecutorAcceptedEvent {
  constructor(
    public readonly executorId: string,
    public readonly willId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
