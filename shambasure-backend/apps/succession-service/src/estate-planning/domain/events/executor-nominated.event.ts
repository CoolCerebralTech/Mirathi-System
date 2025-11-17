export class ExecutorNominatedEvent {
  constructor(
    public readonly executorId: string,
    public readonly willId: string,
    public readonly executorInfo: {
      userId?: string;
      fullName?: string;
    },
    public readonly isPrimary: boolean,
    public readonly timestamp: Date = new Date(),
  ) {}
}
