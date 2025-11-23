export class DistributionExecutedEvent {
  constructor(
    public readonly estateId: string,
    public readonly distributionId: string,
    public readonly executionDate: Date,
    public readonly transferMethod: string,
    public readonly transferValue?: number,
    public readonly executedBy?: string,
  ) {}

  getEventType(): string {
    return 'DistributionExecutedEvent';
  }
}
