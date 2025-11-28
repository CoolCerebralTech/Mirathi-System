export class ExecutorDeclinedEvent {
  constructor(
    public readonly executorId: string,
    public readonly willId: string,
    public readonly reason: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
