export class ObjectionFiledEvent {
  constructor(
    public readonly caseId: string,
    public readonly estateId: string,
    public readonly objectionId: string,
    public readonly objectorName: string,
    public readonly objectionGrounds: string[],
    public readonly filingDate: Date,
    public readonly courtCaseNumber?: string,
  ) {}

  getEventType(): string {
    return 'ObjectionFiledEvent';
  }
}
