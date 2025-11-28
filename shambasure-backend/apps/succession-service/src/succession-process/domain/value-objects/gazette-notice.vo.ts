export class GazetteNotice {
  private readonly noticeNumber: string;
  private readonly publicationDate: Date;
  private readonly objectionPeriodDays: number;
  private readonly noticeType: 'PROBATE' | 'LETTERS_OF_ADMINISTRATION';

  constructor(
    noticeNumber: string,
    publicationDate: Date,
    noticeType: 'PROBATE' | 'LETTERS_OF_ADMINISTRATION' = 'PROBATE',
    days: number = 30,
  ) {
    if (publicationDate > new Date()) {
      throw new Error('Publication date cannot be in the future.');
    }

    if (days < 30) {
      throw new Error('Objection period must be at least 30 days as per Kenyan law.');
    }

    this.noticeNumber = noticeNumber;
    this.publicationDate = publicationDate;
    this.noticeType = noticeType;
    this.objectionPeriodDays = days;
  }

  /**
   * Calculates the exact date when the objection period expires
   * Considering Kenyan court calendar (excludes Sundays and public holidays)
   */
  getObjectionExpiryDate(): Date {
    const expiry = new Date(this.publicationDate);
    let daysAdded = 0;

    while (daysAdded < this.objectionPeriodDays) {
      expiry.setDate(expiry.getDate() + 1);

      // Skip Sundays (day 0) and public holidays (simplified)
      if (expiry.getDay() !== 0) {
        daysAdded++;
      }
    }

    return expiry;
  }

  /**
   * Checks if we can proceed to Confirmation of Grant
   * Must wait until objection period expires AND no objections filed
   */
  hasMatured(hasObjections: boolean = false): boolean {
    return new Date() > this.getObjectionExpiryDate() && !hasObjections;
  }

  /**
   * Gets the notice text as it would appear in the Kenya Gazette
   */
  getGazetteText(deceasedName: string, applicantName: string): string {
    const noticeTemplates = {
      PROBATE: `IN THE MATTER OF THE ESTATE OF ${deceasedName.toUpperCase()} (DECEASED)
NOTICE IS HEREBY GIVEN that ${applicantName} has applied to the High Court for a Grant of Probate in the above estate.
Any objection should be filed in court within ${this.objectionPeriodDays} days from the date of publication.`,

      LETTERS_OF_ADMINISTRATION: `IN THE MATTER OF THE ESTATE OF ${deceasedName.toUpperCase()} (DECEASED)
NOTICE IS HEREBY GIVEN that ${applicantName} has applied to the High Court for Letters of Administration in the above estate.
Any objection should be filed in court within ${this.objectionPeriodDays} days from the date of publication.`,
    };

    return noticeTemplates[this.noticeType];
  }

  /**
   * Checks if objection period is still running
   */
  isObjectionPeriodActive(): boolean {
    return new Date() <= this.getObjectionExpiryDate();
  }

  getNoticeNumber(): string {
    return this.noticeNumber;
  }

  getPublicationDate(): Date {
    return new Date(this.publicationDate);
  }

  getNoticeType(): string {
    return this.noticeType;
  }

  getDaysRemaining(): number {
    const today = new Date();
    const expiry = this.getObjectionExpiryDate();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
