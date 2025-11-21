export class GazetteNotice {
  private readonly noticeNumber: string;
  private readonly publicationDate: Date;
  private readonly objectionPeriodDays: number; // Typically 30

  constructor(noticeNumber: string, publicationDate: Date, days: number = 30) {
    if (publicationDate > new Date()) {
      throw new Error('Publication date cannot be in the future.');
    }
    this.noticeNumber = noticeNumber;
    this.publicationDate = publicationDate;
    this.objectionPeriodDays = days;
  }

  /**
   * Calculates the exact date when the objection period expires.
   */
  getObjectionExpiryDate(): Date {
    const expiry = new Date(this.publicationDate);
    expiry.setDate(expiry.getDate() + this.objectionPeriodDays);
    return expiry;
  }

  /**
   * Can we proceed to Confirmation of Grant?
   */
  hasMatured(): boolean {
    return new Date() > this.getObjectionExpiryDate();
  }

  getNoticeNumber(): string {
    return this.noticeNumber;
  }
}
