export class ExecutorNominatedEvent {
  constructor(
    public readonly executorId: string,
    public readonly willId: string,
    public readonly executorInfo: {
      userId?: string;
      fullName?: string;
      email?: string; // Critical for sending invitations
      phone?: string; // Critical for sending invitations
    },
    public readonly type: 'USER' | 'EXTERNAL',
    public readonly isPrimary: boolean,
    public readonly timestamp: Date = new Date(),
  ) {}
}
