import { MINOR_PROTECTION } from '../../../common/constants/distribution-rules.constants';

/**
 * Source of guardianship under Kenyan law / court practice.
 */
export type GuardianSource =
  | 'TESTAMENTARY' // Appointed in a valid Will
  | 'COURT_ORDER' // Children’s Court or High Court
  | 'PARENTAL_AGREEMENT' // Registered Parental Responsibility Agreement
  | 'DE_FACTO' // Lived-in caregiver recognized by conduct
  | 'KINSHIP_CARE' // Extended family placement (common in Kenya)
  | 'STATE_APPOINTED' // DCS / Government placement
  | 'EMERGENCY_ORDER'; // Urgent temporary protection under Children Act

/**
 * Scope of authority. Kenyan courts differentiate between:
 *  - Person (daily welfare, education, medical)
 *  - Estate (property, trust, inheritance)
 */
export type GuardianshipScope = 'FULL' | 'ESTATE_ONLY' | 'PERSON_ONLY' | 'TEMPORARY';

/**
 * Metadata used for audit trails and dispute resolution.
 */
export interface GuardianshipAudit {
  issuedBy?: string; // Judge, parent, or authority
  issuedAt?: Date; // When appointment was made
  revokedAt?: Date | null; // If revocation occurred
  notes?: string; // Additional legal or factual details
}

/**
 * Guardian Authority Value Object
 * Handles validity, scope checks, expiry, and Kenyan-specific rules.
 */
export class GuardianshipAuthority {
  private readonly source: GuardianSource;
  private readonly expiryDate: Date | null;
  private readonly scope: GuardianshipScope;
  private readonly audit: GuardianshipAudit;

  constructor(
    source: GuardianSource,
    wardDob: Date,
    scope: GuardianshipScope = 'FULL',
    audit: GuardianshipAudit = {},
  ) {
    this.source = source;
    this.scope = scope;
    this.audit = {
      revokedAt: null,
      ...audit,
    };

    this.expiryDate = this.calculateExpiry(wardDob);
  }

  /**
   * Kenyan minor protection rule: Guardianship ends at age 18
   * unless:
   *  - emergency order (time-limited)
   *  - revoked earlier by court
   */
  private calculateExpiry(wardDob: Date): Date | null {
    if (!(wardDob instanceof Date) || isNaN(wardDob.getTime())) {
      return null;
    }

    const expiry = new Date(wardDob);
    expiry.setFullYear(expiry.getFullYear() + MINOR_PROTECTION.MINORS.ageLimit);

    return expiry;
  }

  /**
   * Full validity check:
   * - child is still a minor
   * - guardianship not revoked
   * - emergency or temporary orders can expire early
   */
  isValid(at: Date = new Date()): boolean {
    if (this.audit.revokedAt) return false;
    if (!this.expiryDate) return false;
    if (at >= this.expiryDate) return false;

    return true;
  }

  /**
   * Identifies if this guardianship was created through a Will.
   */
  isTestamentary(): boolean {
    return this.source === 'TESTAMENTARY';
  }

  /**
   * Estate management authority (e.g., running trusts, collecting pensions).
   */
  canManageEstate(): boolean {
    return this.scope === 'FULL' || this.scope === 'ESTATE_ONLY';
  }

  /**
   * Welfare, health, education authority.
   */
  canMakePersonalDecisions(): boolean {
    return this.scope === 'FULL' || this.scope === 'PERSON_ONLY';
  }

  /**
   * Can this guardian represent the ward during succession filings?
   */
  canRepresentInSuccessionMatters(): boolean {
    return this.canManageEstate() || this.isTestamentary();
  }

  /**
   * Returns TRUE if the guardian was appointed by state or court authority.
   */
  isCourtOrStateIssued(): boolean {
    return (
      this.source === 'COURT_ORDER' ||
      this.source === 'STATE_APPOINTED' ||
      this.source === 'EMERGENCY_ORDER'
    );
  }

  /**
   * Revocation (e.g., court removes guardian).
   */
  revoke(reason?: string): GuardianshipAuthority {
    return new GuardianshipAuthority(this.source, this.expiryDate || new Date(), this.scope, {
      ...this.audit,
      revokedAt: new Date(),
      notes: reason || this.audit.notes,
    });
  }

  getSource(): GuardianSource {
    return this.source;
  }

  getScope(): GuardianshipScope {
    return this.scope;
  }

  getExpiryDate(): Date | null {
    return this.expiryDate ? new Date(this.expiryDate) : null;
  }

  getAudit(): Readonly<GuardianshipAudit> {
    return this.audit;
  }

  /**
   * Human-readable entry for logs and UI.
   */
  toString(): string {
    const expiry = this.expiryDate?.toISOString().split('T')[0] ?? 'UNKNOWN';

    return `${this.source} Guardianship (${this.scope}) — Expires: ${expiry}`;
  }
}
