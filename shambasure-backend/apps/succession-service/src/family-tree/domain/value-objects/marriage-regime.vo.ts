import { KENYAN_FAMILY_LAW } from '../../../common/constants/kenyan-law.constants';

export type MarriageTypeCode = (typeof KENYAN_FAMILY_LAW.MARRIAGE_TYPES)[number];

export type MarriageMonogamyMode = 'MONOGAMOUS' | 'POLYGAMOUS' | 'POTENTIALLY_POLYGAMOUS';

export interface MarriageRegistrationInfo {
  certificateNumber?: string;
  registrationDate?: Date;
  isPresumed?: boolean; // Customary but unregistered → presumed marriage
}

export class MarriageRegime {
  private readonly type: MarriageTypeCode;
  private readonly monogamyMode: MarriageMonogamyMode;

  private readonly certificateNumber?: string;
  private readonly registrationDate?: Date;
  private readonly isPresumed: boolean;

  private readonly maxPolygamySlots: number | null;

  constructor(type: MarriageTypeCode, info: MarriageRegistrationInfo = {}) {
    if (!KENYAN_FAMILY_LAW.MARRIAGE_TYPES.includes(type)) {
      throw new Error(`Invalid marriage type: ${type}`);
    }

    this.type = type;
    this.certificateNumber = info.certificateNumber;
    this.registrationDate = info.registrationDate ?? undefined;
    this.isPresumed = info.isPresumed ?? false;

    this.monogamyMode = this.determineMonogamyMode();
    this.maxPolygamySlots = this.determinePolygamyCapacity();
  }

  private determineMonogamyMode(): MarriageMonogamyMode {
    if ((KENYAN_FAMILY_LAW.POLYGAMOUS_MARRIAGE_TYPES as readonly string[]).includes(this.type)) {
      return this.type === 'CUSTOMARY_MARRIAGE' ? 'POTENTIALLY_POLYGAMOUS' : 'POLYGAMOUS';
    }
    return 'MONOGAMOUS';
  }

  private determinePolygamyCapacity(): number | null {
    switch (this.type) {
      case 'ISLAMIC_MARRIAGE':
        return KENYAN_FAMILY_LAW.ISLAMIC_MARRIAGE.MAX_SPOUSES;
      case 'CUSTOMARY_MARRIAGE':
        return Infinity;
      default:
        return null; // Civil, Christian, Hindu
    }
  }

  // -----------------------------
  // GETTERS
  // -----------------------------
  getType(): MarriageTypeCode {
    return this.type;
  }

  getMonogamyMode(): MarriageMonogamyMode {
    return this.monogamyMode;
  }

  getCertificate(): string | undefined {
    return this.certificateNumber;
  }

  getRegistrationDate(): Date | null {
    return this.registrationDate ? new Date(this.registrationDate) : null;
  }

  isRegistered(): boolean {
    return !!this.certificateNumber && !!this.registrationDate;
  }

  isCustomaryPresumed(): boolean {
    return this.type === 'CUSTOMARY_MARRIAGE' && this.isPresumed && !this.isRegistered();
  }

  // -----------------------------
  // LEGAL BEHAVIOR
  // -----------------------------
  allowsPolygamy(): boolean {
    return this.monogamyMode !== 'MONOGAMOUS';
  }

  canAddSpouse(currentWivesCount: number): boolean {
    if (!this.allowsPolygamy()) return false;
    if (this.maxPolygamySlots === Infinity) return true;
    return currentWivesCount < (this.maxPolygamySlots ?? 1);
  }

  blocksNewMarriage(): boolean {
    return this.monogamyMode === 'MONOGAMOUS';
  }

  isRecognizedForSuccession(): boolean {
    if (this.type === 'CUSTOMARY_MARRIAGE') return true;
    if (this.isPresumed) return true;
    return this.isRegistered();
  }

  invalidatesSecondaryMarriage(): boolean {
    return this.monogamyMode === 'MONOGAMOUS';
  }

  getSuccessionRisk(): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (this.isRegistered() && this.monogamyMode === 'MONOGAMOUS') return 'LOW';
    if (this.isCustomaryPresumed()) return 'MEDIUM';
    if (!this.isRegistered()) return 'HIGH';
    return 'MEDIUM';
  }

  // -----------------------------
  // REPRESENTATION
  // -----------------------------
  toString(): string {
    const label = `${this.type} (${this.monogamyMode})`;
    const reg = this.isRegistered()
      ? `Certificate: ${this.certificateNumber}, Date: ${this.registrationDate?.toISOString().split('T')[0]}`
      : this.isCustomaryPresumed()
        ? 'UNREGISTERED – PRESUMED CUSTOMARY UNION'
        : 'UNREGISTERED';
    return `${label} — ${reg}`;
  }
}
