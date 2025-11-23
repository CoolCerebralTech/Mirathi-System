export class CaseClosedEvent {
  constructor(
    public readonly caseId: string,
    public readonly estateId: string,
    public readonly closureDate: Date,
    public readonly closureReason: string,
    public readonly closedBy: string,
    public readonly finalDistributionDate?: Date,
  ) {}

  getEventType(): string {
    return 'CaseClosedEvent';
  }
}
