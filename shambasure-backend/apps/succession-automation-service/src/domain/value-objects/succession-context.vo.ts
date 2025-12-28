// src/succession-automation/src/domain/value-objects/succession-context.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Succession Context Value Object
 *
 * PURPOSE: The "Lens" through which we view the entire case.
 * This single object determines:
 * - Which court to file in (High Court vs Kadhi's Court)
 * - Which forms to generate (P&A 1 vs P&A 80 vs Islamic forms)
 * - Which compliance rules to apply (S.40 polygamy vs standard)
 * - Which legal sections govern distribution
 *
 * LEGAL CONTEXT:
 * - Regime: Does a valid Will exist? (TESTATE vs INTESTATE)
 * - Marriage: Monogamous vs Polygamous (triggers S.40 LSA)
 * - Religion: Statutory vs Islamic vs Hindu (different court jurisdictions)
 *
 * IMMUTABILITY: Once established, the context should not change unless
 * fundamental facts change (e.g., a Will is discovered after initial filing).
 */

export enum SuccessionRegime {
  TESTATE = 'TESTATE', // Valid Will exists
  INTESTATE = 'INTESTATE', // No Will
  PARTIALLY_INTESTATE = 'PARTIALLY_INTESTATE', // Will exists but doesn't cover all assets
  CUSTOMARY = 'CUSTOMARY', // Managed by elders (rare but valid)
}

export enum SuccessionMarriageType {
  MONOGAMOUS = 'MONOGAMOUS',
  POLYGAMOUS = 'POLYGAMOUS', // Triggers S.40 Logic
  COHABITATION = 'COHABITATION', // Triggers S.3(5) & S.29 Logic (Likely Dispute)
  SINGLE = 'SINGLE',
}

export enum SuccessionReligion {
  STATUTORY = 'STATUTORY', // Law of Succession Act (General)
  ISLAMIC = 'ISLAMIC', // Subject to Sharia (Kadhi's Court)
  HINDU = 'HINDU', // Hindu Succession Act
  AFRICAN_CUSTOMARY = 'AFRICAN_CUSTOMARY', // Customary Law
  CHRISTIAN = 'CHRISTIAN', // Often Statutory
}

interface SuccessionContextProps {
  regime: SuccessionRegime;
  marriageType: SuccessionMarriageType;
  religion: SuccessionReligion;
  isMinorInvolved: boolean; // Children Act applies
  hasDisputedAssets: boolean; // May require special handling
  estimatedComplexityScore: number; // 1-10 (used for task prioritization)
}

export class SuccessionContext extends ValueObject<SuccessionContextProps> {
  private constructor(props: SuccessionContextProps) {
    super(props);
  }

  protected validate(): void {
    const { regime, marriageType, religion, estimatedComplexityScore } = this.props;

    if (!Object.values(SuccessionRegime).includes(regime)) {
      throw new ValueObjectValidationError(`Invalid SuccessionRegime: ${regime}`, 'regime');
    }

    if (!Object.values(SuccessionMarriageType).includes(marriageType)) {
      throw new ValueObjectValidationError(
        `Invalid SuccessionMarriageType: ${marriageType}`,
        'marriageType',
      );
    }

    if (!Object.values(SuccessionReligion).includes(religion)) {
      throw new ValueObjectValidationError(`Invalid SuccessionReligion: ${religion}`, 'religion');
    }

    if (estimatedComplexityScore < 1 || estimatedComplexityScore > 10) {
      throw new ValueObjectValidationError(
        'Complexity score must be between 1 and 10',
        'estimatedComplexityScore',
      );
    }

    // BUSINESS RULE: Islamic cases must go to Kadhi's Court
    if (religion === SuccessionReligion.ISLAMIC && regime === SuccessionRegime.TESTATE) {
      // Note: Islamic Wills (Wasiyya) have special rules (max 1/3 of estate)
      // This is a warning, not an error - we allow it but flag it
    }

    // BUSINESS RULE: Customary succession is rare and needs special handling
    if (regime === SuccessionRegime.CUSTOMARY && religion === SuccessionReligion.STATUTORY) {
      throw new ValueObjectValidationError(
        'Customary regime cannot be combined with Statutory religion',
        'regime',
      );
    }
  }

  // ==================== GETTERS ====================

  get regime(): SuccessionRegime {
    return this.props.regime;
  }

  get marriageType(): SuccessionMarriageType {
    return this.props.marriageType;
  }

  get religion(): SuccessionReligion {
    return this.props.religion;
  }

  get isMinorInvolved(): boolean {
    return this.props.isMinorInvolved;
  }

  get hasDisputedAssets(): boolean {
    return this.props.hasDisputedAssets;
  }

  get estimatedComplexityScore(): number {
    return this.props.estimatedComplexityScore;
  }

  // ==================== DERIVED PROPERTIES (Business Logic) ====================

  /**
   * Should this case be filed in Kadhi's Court?
   * LEGAL BASIS: Article 170 of Constitution - Kadhi's Courts have jurisdiction
   * over Islamic personal law including succession.
   */
  public requiresKadhisCourt(): boolean {
    return this.props.religion === SuccessionReligion.ISLAMIC;
  }

  /**
   * Should this case be filed in High Court vs Magistrate's Court?
   * LEGAL BASIS: Section 56 LSA - Jurisdiction based on estate value
   * (Magistrate: < KES 5M, High Court: >= KES 5M)
   *
   * Note: Complexity can override value (e.g., disputed polygamous estate)
   */
  public requiresHighCourt(estateValueKES: number): boolean {
    const VALUE_THRESHOLD = 5_000_000; // KES 5 Million

    if (estateValueKES >= VALUE_THRESHOLD) {
      return true;
    }

    // Complexity override: Polygamous cases with disputes
    if (
      this.props.marriageType === SuccessionMarriageType.POLYGAMOUS &&
      this.props.hasDisputedAssets
    ) {
      return true;
    }

    // Cohabitation cases often need High Court interpretation
    if (
      this.props.marriageType === SuccessionMarriageType.COHABITATION &&
      this.props.estimatedComplexityScore >= 7
    ) {
      return true;
    }

    return false;
  }

  /**
   * Does Section 40 LSA (Polygamy) apply?
   */
  public isSection40Applicable(): boolean {
    return this.props.marriageType === SuccessionMarriageType.POLYGAMOUS;
  }

  /**
   * Does Section 29 LSA (Dependants) need special attention?
   * (Cohabitation partners, disabled children, etc.)
   */
  public requiresDependantAnalysis(): boolean {
    return (
      this.props.marriageType === SuccessionMarriageType.COHABITATION ||
      this.props.isMinorInvolved ||
      this.props.regime === SuccessionRegime.INTESTATE
    );
  }

  /**
   * Is this a "simple" case or "complex" case?
   * Simple: Monogamous, no minors, clear Will, low value
   * Complex: Polygamous, disputed, cohabitation, high value
   */
  public isSimpleCase(): boolean {
    return (
      this.props.estimatedComplexityScore <= 3 &&
      this.props.marriageType === SuccessionMarriageType.MONOGAMOUS &&
      !this.props.hasDisputedAssets &&
      !this.props.isMinorInvolved
    );
  }

  /**
   * Generate a human-readable case classification
   * Used for UI display and logging
   */
  public toCaseClassification(): string {
    const parts: string[] = [];

    // Regime
    parts.push(this.props.regime);

    // Marriage context
    if (this.props.marriageType !== SuccessionMarriageType.SINGLE) {
      parts.push(this.props.marriageType);
    }

    // Religious context (if not statutory)
    if (this.props.religion !== SuccessionReligion.STATUTORY) {
      parts.push(this.props.religion);
    }

    // Special flags
    if (this.props.isMinorInvolved) {
      parts.push('WITH_MINORS');
    }

    if (this.props.hasDisputedAssets) {
      parts.push('DISPUTED');
    }

    return parts.join('_');
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a standard Statutory Intestate case (most common)
   */
  public static createStandardIntestate(
    marriageType: SuccessionMarriageType,
    hasMinors: boolean,
  ): SuccessionContext {
    return new SuccessionContext({
      regime: SuccessionRegime.INTESTATE,
      marriageType,
      religion: SuccessionReligion.STATUTORY,
      isMinorInvolved: hasMinors,
      hasDisputedAssets: false,
      estimatedComplexityScore: hasMinors ? 4 : 2,
    });
  }

  /**
   * Create an Islamic case (Kadhi's Court)
   */
  public static createIslamicCase(regime: SuccessionRegime, hasWill: boolean): SuccessionContext {
    return new SuccessionContext({
      regime,
      marriageType: SuccessionMarriageType.MONOGAMOUS, // Default, can be overridden
      religion: SuccessionReligion.ISLAMIC,
      isMinorInvolved: false, // Will be detected separately
      hasDisputedAssets: false,
      estimatedComplexityScore: hasWill ? 5 : 6,
    });
  }

  /**
   * Create a Polygamous case (Section 40)
   */
  public static createPolygamousCase(
    regime: SuccessionRegime,
    numberOfHouses: number,
  ): SuccessionContext {
    return new SuccessionContext({
      regime,
      marriageType: SuccessionMarriageType.POLYGAMOUS,
      religion: SuccessionReligion.STATUTORY,
      isMinorInvolved: true, // Polygamous families usually have children
      hasDisputedAssets: numberOfHouses > 2, // More houses = more disputes
      estimatedComplexityScore: Math.min(10, 5 + numberOfHouses),
    });
  }

  /**
   * Generic factory with all parameters
   */
  public static create(props: SuccessionContextProps): SuccessionContext {
    return new SuccessionContext(props);
  }

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    return {
      regime: this.props.regime,
      marriageType: this.props.marriageType,
      religion: this.props.religion,
      isMinorInvolved: this.props.isMinorInvolved,
      hasDisputedAssets: this.props.hasDisputedAssets,
      estimatedComplexityScore: this.props.estimatedComplexityScore,
      // Derived properties for convenience
      requiresKadhisCourt: this.requiresKadhisCourt(),
      isSection40Applicable: this.isSection40Applicable(),
      caseClassification: this.toCaseClassification(),
    };
  }

  /**
   * Deserialize from JSON (for read models)
   */
  public static fromJSON(json: Record<string, any>): SuccessionContext {
    return new SuccessionContext({
      regime: json.regime as SuccessionRegime,
      marriageType: json.marriageType as SuccessionMarriageType,
      religion: json.religion as SuccessionReligion,
      isMinorInvolved: json.isMinorInvolved,
      hasDisputedAssets: json.hasDisputedAssets,
      estimatedComplexityScore: json.estimatedComplexityScore,
    });
  }
}
