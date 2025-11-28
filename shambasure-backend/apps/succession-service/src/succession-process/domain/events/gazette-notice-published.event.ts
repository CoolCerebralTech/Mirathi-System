export class GazetteNoticePublishedEvent {
  constructor(
    public readonly caseId: string,
    public readonly estateId: string,
    public readonly noticeNumber: string,
    public readonly publicationDate: Date,
    public readonly objectionExpiryDate: Date,
    public readonly gazetteIssueNumber: string,
    public readonly publicationType: 'PROBATE' | 'LETTERS_OF_ADMINISTRATION',
  ) {}

  getEventType(): string {
    return 'GazetteNoticePublishedEvent';
  }
}
