import { KENYAN_FAMILY_LAW } from '../../../common/constants/kenyan-law.constants';

export type MarriageTypeCode = (typeof KENYAN_FAMILY_LAW.MARRIAGE_TYPES)[number];

export class MarriageRegime {
  private readonly type: MarriageTypeCode;
  private readonly isPolygamyAllowed: boolean;
  private readonly certificateNumber?: string;
  private readonly registrationDate?: Date;

  constructor(type: MarriageTypeCode, certificateNumber?: string, registrationDate?: Date) {
    this.type = type;
    this.certificateNumber = certificateNumber;
    this.registrationDate = registrationDate;

    // Logic derived from Kenyan Marriage Act 2014
    this.isPolygamyAllowed = this.determinePolygamyStatus(type);
  }

  getType(): MarriageTypeCode {
    return this.type;
  }

  allowsPolygamy(): boolean {
    return this.isPolygamyAllowed;
  }

  hasCertificate(): boolean {
    return !!this.certificateNumber;
  }

  /**
   * Validates if a new marriage can be contracted given this existing regime.
   * e.g., A Civil Marriage blocks ALL future marriages.
   */
  blocksNewMarriage(): boolean {
    // If monogamous, no new spouse allowed.
    // Even in polygamous, limits apply (e.g. 4 wives in Islamic law).
    return !this.isPolygamyAllowed;
  }

  private determinePolygamyStatus(type: MarriageTypeCode): boolean {
    // Islamic and Customary allow polygamy. Civil, Christian, Hindu do not.
    return (KENYAN_FAMILY_LAW.POLYGAMOUS_MARRIAGE_TYPES as readonly string[]).includes(type);
  }

  static createCivil(certificate: string, date: Date): MarriageRegime {
    return new MarriageRegime('CIVIL_MARRIAGE', certificate, date);
  }

  static createCustomary(isRegistered: boolean = false, cert?: string): MarriageRegime {
    // Customary marriages are valid even if unregistered (presumed),
    // but registration is mandatory within 6 months under 2014 Act.
    return new MarriageRegime('CUSTOMARY_MARRIAGE', cert);
  }
}
