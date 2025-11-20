export interface CustomaryEvidence {
  dowryPaymentStatus: 'NONE' | 'PARTIAL' | 'FULL';
  ceremonyDate?: Date;
  witnessedByElders: boolean;
  cohabitationStart?: Date;
  affidavitExists: boolean;
}

export class CustomaryRites {
  private readonly evidence: CustomaryEvidence;

  constructor(evidence: CustomaryEvidence) {
    this.evidence = { ...evidence };
  }

  getEvidence(): Readonly<CustomaryEvidence> {
    return this.evidence;
  }

  /**
   * Calculates the strength of the marriage claim based on Kenyan Case Law.
   * Used to flag "High Risk" relationships in the dashboard.
   */
  calculateLegitimacyScore(): number {
    let score = 0;

    // Dowry/Bride Price is significant evidence
    if (this.evidence.dowryPaymentStatus === 'FULL') score += 40;
    if (this.evidence.dowryPaymentStatus === 'PARTIAL') score += 20;

    // Cohabitation (Presumption of Marriage)
    if (this.evidence.cohabitationStart) {
      const years = new Date().getFullYear() - this.evidence.cohabitationStart.getFullYear();
      if (years > 3) score += 30; // Long cohabitation suggests marriage
    }

    // Witnesses/Affidavits
    if (this.evidence.witnessedByElders) score += 15;
    if (this.evidence.affidavitExists) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Is this relationship legally recognizable?
   * Generally requires at least Dowry OR Long Cohabitation + Affidavit.
   */
  isRecognizable(): boolean {
    return this.calculateLegitimacyScore() >= 40;
  }
}
