export type DowryStatus = 'NONE' | 'PARTIAL' | 'FULL';

export interface CustomaryEvidence {
  dowryPaymentStatus: DowryStatus; // Ruracio / Ayie / Amateka etc.
  ceremonyPerformed?: boolean; // Any recognized customary ceremony
  ceremonyDate?: Date;

  witnessedByElders: boolean; // Elders participation (VERY strong evidence)
  witnesses?: string[]; // Specific witness list

  cohabitationStart?: Date; // For presumption of marriage
  affidavitExists: boolean; // Sworn affidavit confirming marriage

  familyInvolvement?: boolean; // Negotiations, visits, introductions
  intentDeclaration?: boolean; // Verbal/recorded intention to marry

  customSpecificEvidence?: string[]; // e.g. Kikuyu: Ngurario, Luo: Ayie
}

export class CustomaryRites {
  private readonly evidence: CustomaryEvidence;

  constructor(evidence: CustomaryEvidence) {
    this.evidence = {
      witnesses: [],
      customSpecificEvidence: [],
      familyInvolvement: false,
      intentDeclaration: false,
      ceremonyPerformed: false,
      ...evidence,
    };
  }

  getEvidence(): Readonly<CustomaryEvidence> {
    return this.evidence;
  }

  /**
   * Calculates legitimacy score using weighted Kenyan customary marriage criteria.
   * Max score = 100.
   *
   * Strong weights:
   * - Dowry (Full = 40)
   * - Ceremony performed (20)
   * - Elders involved (15)
   * - Cohabitation (0–20)
   * - Affidavit (10)
   * - Family involvement (10)
   * - Custom-specific rituals (10)
   * - Intent declaration (5)
   */
  calculateLegitimacyScore(): number {
    let score = 0;

    // --- Dowry / Bride Price (Strongest factor) ---
    switch (this.evidence.dowryPaymentStatus) {
      case 'FULL':
        score += 40;
        break;
      case 'PARTIAL':
        score += 20;
        break;
      case 'NONE':
      default:
        break;
    }

    // --- Customary Ceremony ---
    if (this.evidence.ceremonyPerformed) score += 20;

    // --- Elders / Witnesses ---
    if (this.evidence.witnessedByElders) score += 15;
    if (this.evidence.witnesses && this.evidence.witnesses.length > 0) score += 5;

    // --- Cohabitation (Presumption of marriage) ---
    if (this.evidence.cohabitationStart) {
      const years = new Date().getFullYear() - this.evidence.cohabitationStart.getFullYear();

      if (years >= 5) score += 20;
      else if (years >= 3) score += 15;
      else if (years >= 1) score += 5;
    }

    // --- Affidavit (Supportive evidence) ---
    if (this.evidence.affidavitExists) score += 10;

    // --- Family involvement (Negotiations, Introductions) ---
    if (this.evidence.familyInvolvement) score += 10;

    // --- Intent declaration (Minor but relevant) ---
    if (this.evidence.intentDeclaration) score += 5;

    // --- Community-specific rites (Ngurario, Ayie, Imuratta etc.) ---
    if (this.evidence.customSpecificEvidence?.length) {
      score += Math.min(10, this.evidence.customSpecificEvidence.length * 3);
    }

    return Math.min(score, 100);
  }

  /**
   * Returns evidence missing based on core Kenyan customary marriage requirements.
   */
  getMissingEvidence(): string[] {
    const missing: string[] = [];

    if (this.evidence.dowryPaymentStatus === 'NONE')
      missing.push('Dowry or Bride Price Negotiations');

    if (!this.evidence.ceremonyPerformed) missing.push('Customary Cultural Ceremony');

    if (!this.evidence.familyInvolvement) missing.push('Family or Elders Involvement');

    if (!this.evidence.witnessedByElders) missing.push('Elders Participation');

    if (!this.evidence.cohabitationStart) missing.push('Cohabitation or Public Recognition');

    if (!this.evidence.affidavitExists) missing.push('Affidavit Confirming Marriage');

    if (!this.evidence.customSpecificEvidence?.length)
      missing.push('Community-Specific Ritual Evidence');

    return missing;
  }

  /**
   * Minimum threshold for a recognizable customary marriage claim.
   * Courts generally require >40% evidence.
   */
  isRecognizable(): boolean {
    return this.calculateLegitimacyScore() >= 40;
  }
}
