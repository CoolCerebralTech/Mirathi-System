export class ExecutorNominatedEvent {
  constructor(
    public readonly executorId: string,
    public readonly willId: string,
    public readonly executorInfo: {
      userId?: string;
      fullName?: string;
      email?: string;
      phone?: string;
      relationship?: string; // e.g., "Brother"
    },
    public readonly type: 'USER' | 'EXTERNAL',
    public readonly isPrimary: boolean,
    public readonly priorityOrder: number, // 1 = First Choice, 2 = Alternate
    public readonly timestamp: Date = new Date(),
  ) {}
}
