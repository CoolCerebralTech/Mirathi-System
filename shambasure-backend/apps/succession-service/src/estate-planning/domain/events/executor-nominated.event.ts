export class ExecutorNominatedEvent {
  constructor(
    public readonly executorId: string, // The ID of the Executor entity
    public readonly willId: string,
    public readonly userId: string | null, // Populated if type is USER
    public readonly fullName: string | null, // Populated if type is EXTERNAL/PROFESSIONAL
    public readonly type: 'USER' | 'EXTERNAL' | 'PROFESSIONAL',
    public readonly isPrimary: boolean,
    public readonly priorityOrder: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
