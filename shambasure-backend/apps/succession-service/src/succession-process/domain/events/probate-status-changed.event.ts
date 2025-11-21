export class ProbateStatusChangedEvent {
  constructor(
    public readonly caseId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly reason?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
