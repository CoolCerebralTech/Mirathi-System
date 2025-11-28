export class ExecutorRemovedEvent {
  constructor(
    public readonly executorId: string,
    public readonly willId: string,
    public readonly reason: string,
    public readonly removedBy?: string, // Optional: User ID (e.g., Court Clerk/Admin)
    public readonly timestamp: Date = new Date(),
  ) {}
}
