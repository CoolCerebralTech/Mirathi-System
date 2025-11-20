import { MINOR_PROTECTION } from '../../../common/constants/distribution-rules.constants';

export type GuardianSource = 'TESTAMENTARY' | 'COURT_ORDER' | 'PARENTAL_AGREEMENT' | 'DE_FACTO';

export class GuardianshipAuthority {
  private readonly source: GuardianSource;
  private readonly expiryDate: Date;
  private readonly scope: 'FULL' | 'ESTATE_ONLY' | 'PERSON_ONLY';

  constructor(
    source: GuardianSource,
    wardDob: Date,
    scope: 'FULL' | 'ESTATE_ONLY' | 'PERSON_ONLY' = 'FULL',
  ) {
    this.source = source;
    this.scope = scope;
    this.expiryDate = this.calculateExpiry(wardDob);
  }

  /**
   * Calculates when guardianship ends (Age 18 in Kenya).
   */
  private calculateExpiry(wardDob: Date): Date {
    const expiry = new Date(wardDob);
    expiry.setFullYear(expiry.getFullYear() + MINOR_PROTECTION.MINORS.ageLimit);
    return expiry;
  }

  isValid(): boolean {
    return new Date() < this.expiryDate;
  }

  isTestamentary(): boolean {
    return this.source === 'TESTAMENTARY';
  }

  canManageEstate(): boolean {
    return this.scope === 'FULL' || this.scope === 'ESTATE_ONLY';
  }

  getExpiryDate(): Date {
    return new Date(this.expiryDate);
  }

  toString(): string {
    return `${this.source} Guardianship (Expires: ${this.expiryDate.toISOString().split('T')[0]})`;
  }
}
