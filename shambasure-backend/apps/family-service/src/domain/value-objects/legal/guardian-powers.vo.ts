// domain/value-objects/legal/guardian-powers.vo.ts
import { ValueObject, ValueObjectValidationError } from '../../base/value-object';

/**
 * Guardian Powers Value Object
 *
 * Defines what a guardian can legally do on behalf of the ward
 *
 * KENYAN LAW (S.70-71 LSA):
 * - Guardians have different powers based on appointment type
 * - Property management requires S.72 bond posting
 * - Medical consent typically granted by default
 * - Marriage consent requires court approval
 *
 * POWER TYPES:
 * 1. Property Management: Buy/sell assets, manage finances
 * 2. Medical Consent: Authorize medical treatment
 * 3. Marriage Consent: Consent to ward's marriage (if under 18)
 * 4. Educational Decisions: School enrollment, career choices
 * 5. Legal Representation: Sign contracts, file lawsuits
 */

interface GuardianPowersProps {
  hasPropertyManagementPowers: boolean; // S.72 bond required if true
  canConsentToMedical: boolean; // Medical treatment decisions
  canConsentToMarriage: boolean; // Marriage consent (minors)
  canMakeLegalDecisions: boolean; // Sign contracts, legal docs
  canMakeEducationalDecisions: boolean; // School, career choices
  restrictions: string[]; // Court-imposed limitations
  specialInstructions?: string; // Additional guidance
}

export class GuardianPowers extends ValueObject<GuardianPowersProps> {
  private constructor(props: GuardianPowersProps) {
    super(props);
  }

  public static create(props: Partial<GuardianPowersProps>): GuardianPowers {
    // Default powers (minimal safe defaults)
    const defaultProps: GuardianPowersProps = {
      hasPropertyManagementPowers: false, // Requires bond
      canConsentToMedical: true, // Usually granted
      canConsentToMarriage: false, // Requires court approval
      canMakeLegalDecisions: false, // Requires explicit grant
      canMakeEducationalDecisions: true, // Usually granted
      restrictions: [],
      specialInstructions: undefined,
      ...props,
    };

    return new GuardianPowers(defaultProps);
  }

  /**
   * Create minimal powers (natural parent default)
   */
  public static createMinimal(): GuardianPowers {
    return GuardianPowers.create({
      hasPropertyManagementPowers: false,
      canConsentToMedical: true,
      canConsentToMarriage: false,
      canMakeLegalDecisions: false,
      canMakeEducationalDecisions: true,
      restrictions: [],
    });
  }

  /**
   * Create full powers (testamentary guardian typical)
   */
  public static createFull(): GuardianPowers {
    return GuardianPowers.create({
      hasPropertyManagementPowers: true,
      canConsentToMedical: true,
      canConsentToMarriage: true,
      canMakeLegalDecisions: true,
      canMakeEducationalDecisions: true,
      restrictions: [],
    });
  }

  protected validate(): void {
    // Restrictions must be non-empty strings
    if (this.props.restrictions.some((r) => !r || r.trim().length === 0)) {
      throw new ValueObjectValidationError(
        'Restrictions must be non-empty strings',
        'restrictions',
      );
    }

    // Warn if marriage consent without court approval
    if (this.props.canConsentToMarriage && !this.props.specialInstructions?.includes('court')) {
      console.warn('Marriage consent power should have court approval documentation');
    }

    // Property management is a major power - should have explicit restrictions
    if (this.props.hasPropertyManagementPowers && this.props.restrictions.length === 0) {
      console.warn(
        'Property management powers granted without restrictions - consider adding limits',
      );
    }
  }

  // === GETTERS ===

  get hasPropertyManagementPowers(): boolean {
    return this.props.hasPropertyManagementPowers;
  }

  get canConsentToMedical(): boolean {
    return this.props.canConsentToMedical;
  }

  get canConsentToMarriage(): boolean {
    return this.props.canConsentToMarriage;
  }

  get canMakeLegalDecisions(): boolean {
    return this.props.canMakeLegalDecisions;
  }

  get canMakeEducationalDecisions(): boolean {
    return this.props.canMakeEducationalDecisions;
  }

  get restrictions(): ReadonlyArray<string> {
    return Object.freeze([...this.props.restrictions]);
  }

  get specialInstructions(): string | undefined {
    return this.props.specialInstructions;
  }

  // === BUSINESS LOGIC ===

  /**
   * Check if powers are restricted
   */
  public hasRestrictions(): boolean {
    return this.props.restrictions.length > 0;
  }

  /**
   * Check if specific restriction exists
   */
  public hasRestriction(restriction: string): boolean {
    return this.props.restrictions.some((r) => r.toLowerCase().includes(restriction.toLowerCase()));
  }

  /**
   * Check if powers are minimal (only basic care)
   */
  public isMinimalPowers(): boolean {
    return (
      !this.props.hasPropertyManagementPowers &&
      !this.props.canConsentToMarriage &&
      !this.props.canMakeLegalDecisions
    );
  }

  /**
   * Check if powers are full (all granted)
   */
  public isFullPowers(): boolean {
    return (
      this.props.hasPropertyManagementPowers &&
      this.props.canConsentToMedical &&
      this.props.canConsentToMarriage &&
      this.props.canMakeLegalDecisions &&
      this.props.canMakeEducationalDecisions
    );
  }

  /**
   * Check if requires S.72 bond
   */
  public requiresBond(): boolean {
    return this.props.hasPropertyManagementPowers;
  }

  /**
   * Count granted powers
   */
  public countGrantedPowers(): number {
    let count = 0;
    if (this.props.hasPropertyManagementPowers) count++;
    if (this.props.canConsentToMedical) count++;
    if (this.props.canConsentToMarriage) count++;
    if (this.props.canMakeLegalDecisions) count++;
    if (this.props.canMakeEducationalDecisions) count++;
    return count;
  }

  /**
   * Get power level (LOW, MEDIUM, HIGH)
   */
  public getPowerLevel(): 'LOW' | 'MEDIUM' | 'HIGH' {
    const count = this.countGrantedPowers();
    if (count <= 1) return 'LOW';
    if (count <= 3) return 'MEDIUM';
    return 'HIGH';
  }

  // === MUTATIONS (Return new instances - immutable) ===

  /**
   * Grant property management powers
   */
  public grantPropertyManagement(additionalRestrictions?: string[]): GuardianPowers {
    if (this.props.hasPropertyManagementPowers) {
      throw new ValueObjectValidationError(
        'Property management powers already granted',
        'hasPropertyManagementPowers',
      );
    }

    return GuardianPowers.create({
      ...this.props,
      hasPropertyManagementPowers: true,
      canMakeLegalDecisions: true, // Usually granted together
      restrictions: [...this.props.restrictions, ...(additionalRestrictions ?? [])],
    });
  }

  /**
   * Revoke property management powers
   */
  public revokePropertyManagement(): GuardianPowers {
    return GuardianPowers.create({
      ...this.props,
      hasPropertyManagementPowers: false,
    });
  }

  /**
   * Grant marriage consent power
   */
  public grantMarriageConsent(): GuardianPowers {
    return GuardianPowers.create({
      ...this.props,
      canConsentToMarriage: true,
    });
  }

  /**
   * Update restrictions
   */
  public updateRestrictions(restrictions: string[]): GuardianPowers {
    return GuardianPowers.create({
      ...this.props,
      restrictions,
    });
  }

  /**
   * Add restriction
   */
  public addRestriction(restriction: string): GuardianPowers {
    if (this.hasRestriction(restriction)) {
      return this; // Already exists
    }

    return GuardianPowers.create({
      ...this.props,
      restrictions: [...this.props.restrictions, restriction],
    });
  }

  /**
   * Remove restriction
   */
  public removeRestriction(restriction: string): GuardianPowers {
    return GuardianPowers.create({
      ...this.props,
      restrictions: this.props.restrictions.filter(
        (r) => !r.toLowerCase().includes(restriction.toLowerCase()),
      ),
    });
  }

  /**
   * Update special instructions
   */
  public updateSpecialInstructions(instructions: string): GuardianPowers {
    return GuardianPowers.create({
      ...this.props,
      specialInstructions: instructions,
    });
  }

  // === SERIALIZATION ===

  public toJSON(): Record<string, any> {
    return {
      hasPropertyManagementPowers: this.props.hasPropertyManagementPowers,
      canConsentToMedical: this.props.canConsentToMedical,
      canConsentToMarriage: this.props.canConsentToMarriage,
      canMakeLegalDecisions: this.props.canMakeLegalDecisions,
      canMakeEducationalDecisions: this.props.canMakeEducationalDecisions,
      restrictions: [...this.props.restrictions],
      specialInstructions: this.props.specialInstructions,

      // Computed properties
      hasRestrictions: this.hasRestrictions(),
      isMinimalPowers: this.isMinimalPowers(),
      isFullPowers: this.isFullPowers(),
      requiresBond: this.requiresBond(),
      grantedPowersCount: this.countGrantedPowers(),
      powerLevel: this.getPowerLevel(),
    };
  }

  public toString(): string {
    const powers: string[] = [];
    if (this.props.hasPropertyManagementPowers) powers.push('Property');
    if (this.props.canConsentToMedical) powers.push('Medical');
    if (this.props.canConsentToMarriage) powers.push('Marriage');
    if (this.props.canMakeLegalDecisions) powers.push('Legal');
    if (this.props.canMakeEducationalDecisions) powers.push('Education');

    return powers.length > 0 ? powers.join(', ') : 'No Powers';
  }
}
