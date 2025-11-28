export class ProbateCaseFiledEvent {
  constructor(
    public readonly caseId: string,
    public readonly estateId: string,
    public readonly caseNumber: string,
    public readonly courtStation: string,
    public readonly filingDate: Date,
    public readonly applicationType: string,
    public readonly applicantName: string,
    public readonly filingFee: number,
  ) {}

  getEventType(): string {
    return 'ProbateCaseFiledEvent';
  }

  getPayload() {
    return {
      caseId: this.caseId,
      estateId: this.estateId,
      caseNumber: this.caseNumber,
      courtStation: this.courtStation,
      filingDate: this.filingDate,
      applicationType: this.applicationType,
      applicantName: this.applicantName,
      filingFee: this.filingFee,
    };
  }
}
