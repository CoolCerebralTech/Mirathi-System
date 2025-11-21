export class GazetteNoticePublishedEvent {
  constructor(
    public readonly caseId: string,
    public readonly noticeNumber: string,
    public readonly publicationDate: Date,
    public readonly objectionDeadline: Date, // Calculated (Date + 30 days)
    public readonly timestamp: Date = new Date(),
  ) {}
}
