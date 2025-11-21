export class ProbateCaseFiledEvent {
  constructor(
    public readonly caseId: string,
    public readonly estateId: string,
    public readonly caseNumber: string,
    public readonly courtStation: string, // e.g. "High Court Nairobi"
    public readonly filingDate: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
