// src/succession-automation/src/domain/value-objects/succession-context.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Succession Context Value Object
 *
 * PURPOSE: The "Lens" through which we view the entire case.
 * This single object determines:
 * - Which court to file in (High Court vs Kadhi's Court vs Magistrate's Court)
 * - Which forms to generate (P&A 1 vs P&A 80 vs Islamic forms)
 * - Which compliance rules to apply (S.40 polygamy vs standard)
 * - Which legal sections govern distribution
 * - Document requirements (context-aware)
 * - Task generation (roadmap customization)
 *
 * LEGAL CONTEXT:
 * - Regime: Does a valid Will exist? (TESTATE vs INTESTATE)
 * - Marriage: Monogamous vs Polygamous (triggers S.40 LSA)
 * - Religion: Statutory vs Islamic vs Hindu (different court jurisdictions)
 * - Jurisdiction: Determined by value, complexity, and legal framework
 *
 * IMMUTABILITY: Once established, the context should not change unless
 * fundamental facts change (e.g., a Will is discovered after initial filing).
 */

export enum SuccessionRegime {
  TESTATE = 'TESTATE', // Valid Will exists
  INTESTATE = 'INTESTATE', // No Will
  PARTIALLY_INTESTATE = 'PARTIALLY_INTESTATE', // Will exists but doesn't cover all assets
  CUSTOMARY = 'CUSTOMARY', // Managed by elders under Customary Law
}

export enum SuccessionMarriageType {
  MONOGAMOUS = 'MONOGAMOUS',
  POLYGAMOUS = 'POLYGAMOUS', // Triggers S.40 Logic (by houses)
  COHABITATION = 'COHABITATION', // S.3(5) LSA - "wife" definition
  SINGLE = 'SINGLE',
  SEPARATED = 'SEPARATED', // S.35(3) - Property rights
}

export enum SuccessionReligion {
  STATUTORY = 'STATUTORY', // Law of Succession Act (General)
  ISLAMIC = 'ISLAMIC', // Subject to Sharia (Kadhi's Court) - Muslim Personal Law
  HINDU = 'HINDU', // Hindu Succession Act (Cap 158)
  AFRICAN_CUSTOMARY = 'AFRICAN_CUSTOMARY', // Customary Law (different by community)
  CHRISTIAN = 'CHRISTIAN', // Often Statutory but may have church arbitration
}

export enum CourtJurisdiction {
  HIGH_COURT = 'HIGH_COURT',
  MAGISTRATE_COURT = 'MAGISTRATE_COURT',
  KADHIS_COURT = 'KADHIS_COURT',
  CUSTOMARY_COURT = 'CUSTOMARY_COURT',
  FAMILY_DIVISION = 'FAMILY_DIVISION', // High Court Family Division
  COMMERCIAL_COURT = 'COMMERCIAL_COURT', // For complex business assets
}

export enum CasePriority {
  URGENT = 'URGENT', // 1-2 months: Minors without support, disputed assets
  HIGH = 'HIGH', // 3-4 months: Standard succession with deadlines
  NORMAL = 'NORMAL', // 5-6 months: Regular cases
  LOW = 'LOW', // 6+ months: Uncontested, simple cases
}

interface SuccessionContextProps {
  regime: SuccessionRegime;
  marriageType: SuccessionMarriageType;
  religion: SuccessionReligion;
  isMinorInvolved: boolean;
  hasDisputedAssets: boolean;
  estimatedComplexityScore: number; // 1-10
  totalBeneficiaries: number; // For calculating forms and consents
  estateValueKES?: number; // Optional for court determination
  isEstateInsolvent: boolean; // Assets < Debts (S.45 LSA priority)
  isBusinessAssetsInvolved: boolean; // Requires specialized handling
  isForeignAssetsInvolved: boolean; // Cross-border succession
  isCharitableBequest: boolean; // Wills with charity gifts
  hasDependantsWithDisabilities: boolean; // S.29 LSA consideration
}

export class SuccessionContext extends ValueObject<SuccessionContextProps> {
  // Court jurisdiction thresholds (in KES)
  private static readonly MAGISTRATE_LIMIT = 7_000_000; // Section 48 LSA

  // Islamic law constants
  private static readonly ISLAMIC_MAX_BEQUEST = 1 / 3; // Cannot bequeath more than 1/3 to non-heirs

  constructor(props: SuccessionContextProps) {
    super(props);
  }

  protected validate(): void {
    const {
      regime,
      marriageType,
      religion,
      estimatedComplexityScore,
      totalBeneficiaries,
      estateValueKES,
    } = this.props;

    // Validate enum values
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

    // Validate complexity score
    if (estimatedComplexityScore < 1 || estimatedComplexityScore > 10) {
      throw new ValueObjectValidationError(
        'Complexity score must be between 1 and 10',
        'estimatedComplexityScore',
      );
    }

    // Validate beneficiaries count
    if (totalBeneficiaries < 1) {
      throw new ValueObjectValidationError(
        'There must be at least one beneficiary',
        'totalBeneficiaries',
      );
    }

    // Validate estate value if provided
    if (estateValueKES !== undefined && estateValueKES < 0) {
      throw new ValueObjectValidationError('Estate value cannot be negative', 'estateValueKES');
    }

    // BUSINESS RULE: Customary regime constraints
    if (
      regime === SuccessionRegime.CUSTOMARY &&
      religion !== SuccessionReligion.AFRICAN_CUSTOMARY
    ) {
      throw new ValueObjectValidationError(
        'Customary regime can only be used with African Customary religion',
        'regime',
      );
    }

    // BUSINESS RULE: Hindu succession specific rules
    if (religion === SuccessionReligion.HINDU) {
      if (marriageType === SuccessionMarriageType.POLYGAMOUS) {
        throw new ValueObjectValidationError(
          'Hindu succession does not recognize polygamous marriages',
          'marriageType',
        );
      }
    }

    // BUSINESS RULE: Islamic Will restrictions warning
    if (regime === SuccessionRegime.TESTATE && religion === SuccessionReligion.ISLAMIC) {
      // Islamic Wills (Wasiyya) have special rules - validated separately
      console.warn('Islamic Will detected. Maximum bequest is 1/3 of estate to non-heirs.');
    }

    // BUSINESS RULE: Cohabitation must have duration validation
    if (marriageType === SuccessionMarriageType.COHABITATION) {
      // Additional validation done in isCohabitationValid method
      if (!this.props.isMinorInvolved && this.props.hasDisputedAssets) {
        console.warn('Cohabitation case with disputes - high litigation risk (S.3(5) LSA)');
      }
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

  get totalBeneficiaries(): number {
    return this.props.totalBeneficiaries;
  }

  get estateValueKES(): number | undefined {
    return this.props.estateValueKES;
  }

  get isEstateInsolvent(): boolean {
    return this.props.isEstateInsolvent;
  }

  get isBusinessAssetsInvolved(): boolean {
    return this.props.isBusinessAssetsInvolved;
  }

  get isForeignAssetsInvolved(): boolean {
    return this.props.isForeignAssetsInvolved;
  }

  get isCharitableBequest(): boolean {
    return this.props.isCharitableBequest;
  }

  get hasDependantsWithDisabilities(): boolean {
    return this.props.hasDependantsWithDisabilities;
  }

  // ==================== COURT JURISDICTION LOGIC ====================

  /**
   * Determine the appropriate court jurisdiction based on Kenyan law
   *
   * LEGAL BASIS:
   * - Section 48 LSA: Magistrate's Court up to KES 7M
   * - Article 170 Constitution: Kadhi's Court for Muslims (unlimited jurisdiction)
   * - High Court: Complex cases or above KES 7M for non-Muslims
   * - Commercial Court: Business assets > KES 100M
   */
  public determineCourtJurisdiction(): CourtJurisdiction {
    const estateValue = this.props.estateValueKES || 0;

    // 1. Islamic cases go to Kadhi's Court (unlimited jurisdiction for Muslims)
    if (this.props.religion === SuccessionReligion.ISLAMIC) {
      return CourtJurisdiction.KADHIS_COURT;
    }

    // 2. Hindu cases (High Court only - Hindu Succession Act)
    if (this.props.religion === SuccessionReligion.HINDU) {
      return CourtJurisdiction.HIGH_COURT;
    }

    // 3. Customary law cases (Customary Court or Magistrate's)
    if (this.props.religion === SuccessionReligion.AFRICAN_CUSTOMARY) {
      return CourtJurisdiction.CUSTOMARY_COURT;
    }

    // 4. Commercial Court for large business estates
    if (this.props.isBusinessAssetsInvolved && estateValue > 100_000_000) {
      return CourtJurisdiction.COMMERCIAL_COURT;
    }

    // 5. Family Division for cases with minors or family disputes
    if (this.props.isMinorInvolved || this.props.hasDisputedAssets) {
      return CourtJurisdiction.FAMILY_DIVISION;
    }

    // 6. Magistrate's Court for simple, low-value cases
    if (
      estateValue <= SuccessionContext.MAGISTRATE_LIMIT &&
      this.estimatedComplexityScore <= 3 &&
      !this.props.hasDisputedAssets &&
      !this.props.isMinorInvolved
    ) {
      return CourtJurisdiction.MAGISTRATE_COURT;
    }

    // 7. High Court for everything else
    return CourtJurisdiction.HIGH_COURT;
  }

  /**
   * Determine case priority for scheduling
   */
  public determineCasePriority(): CasePriority {
    if (this.props.isMinorInvolved && this.props.isEstateInsolvent) {
      return CasePriority.URGENT; // Minors without support
    }

    if (this.props.hasDisputedAssets && this.props.estimatedComplexityScore >= 8) {
      return CasePriority.URGENT; // High-risk disputes
    }

    if (this.props.isMinorInvolved || this.props.hasDependantsWithDisabilities) {
      return CasePriority.HIGH; // Vulnerable dependants
    }

    if (this.props.estimatedComplexityScore >= 6) {
      return CasePriority.HIGH; // Complex cases
    }

    if (this.props.regime === SuccessionRegime.INTESTATE && this.props.totalBeneficiaries > 5) {
      return CasePriority.NORMAL; // Large families need timely resolution
    }

    return CasePriority.LOW;
  }

  // ==================== LEGAL VALIDATION METHODS ====================

  /**
   * Check if Islamic Will (Wasiyya) follows Sharia rules
   * LEGAL BASIS: Sharia law limits bequests to 1/3 of estate to non-heirs
   */
  public isIslamicWillValid(bequestPercentage: number): { valid: boolean; reason?: string } {
    if (this.props.religion !== SuccessionReligion.ISLAMIC) {
      return { valid: true }; // Not applicable
    }

    if (this.props.regime !== SuccessionRegime.TESTATE) {
      return { valid: true }; // Not a will-based case
    }

    // Sharia rule: Cannot bequeath more than 1/3 of estate to non-heirs
    if (bequestPercentage > SuccessionContext.ISLAMIC_MAX_BEQUEST) {
      return {
        valid: false,
        reason: `Islamic law (Sharia) limits bequests to maximum ${SuccessionContext.ISLAMIC_MAX_BEQUEST * 100}% of estate for non-heirs`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if cohabitation qualifies under S.3(5) LSA
   * Requirements: Lived together as husband/wife, not married to others
   */
  public isCohabitationValid(durationMonths: number, publiclyAcknowledged: boolean): boolean {
    if (this.props.marriageType !== SuccessionMarriageType.COHABITATION) {
      return false;
    }

    // Legal requirement: At least 2 years cohabitation
    // Must have been publicly acknowledged as husband/wife
    // Not married to anyone else during that period
    return durationMonths >= 24 && publiclyAcknowledged;
  }

  /**
   * Check if Section 35(3) Hotchpot applies
   * Gifts inter vivos to children must be brought into account
   */
  public requiresHotchpotCalculation(): boolean {
    return (
      this.props.regime === SuccessionRegime.INTESTATE &&
      this.props.marriageType === SuccessionMarriageType.MONOGAMOUS &&
      this.props.isMinorInvolved
    );
  }

  // ==================== BUSINESS LOGIC ====================
  /**
   * Getter for property-style access (fixes TypeScript error in ReadinessScore)
   */
  public requiresKadhisCourt(): boolean {
    return this.props.religion === SuccessionReligion.ISLAMIC;
  }
  /**
   * Does Section 40 LSA (Polygamy) apply?
   */
  public isSection40Applicable(): boolean {
    return this.props.marriageType === SuccessionMarriageType.POLYGAMOUS;
  }

  /**
   * Does Section 29 LSA (Dependants) need special attention?
   */
  public requiresDependantAnalysis(): boolean {
    return (
      this.props.marriageType === SuccessionMarriageType.COHABITATION ||
      this.props.isMinorInvolved ||
      this.props.hasDependantsWithDisabilities ||
      this.props.regime === SuccessionRegime.INTESTATE
    );
  }

  /**
   * Determine if consent of all beneficiaries is required
   * LEGAL: P&A 38 form for intestate, specific consents for testate
   */
  public requiresUniversalConsent(): boolean {
    // Intestate cases require consent of all adult beneficiaries
    if (this.props.regime === SuccessionRegime.INTESTATE) {
      return true;
    }

    // Partially intestate requires consent for the intestate portion
    if (this.props.regime === SuccessionRegime.PARTIALLY_INTESTATE) {
      return true;
    }

    // Testate with minors requires guardian consent
    if (this.props.isMinorInvolved) {
      return true;
    }

    return false;
  }

  /**
   * Determine if Guarantee of Sureties (P&A 57) is required
   * Required when minors are beneficiaries
   */
  public requiresGuarantee(): boolean {
    return this.props.isMinorInvolved;
  }

  /**
   * Determine if Gazette Notice is required
   * All succession cases require 30-day gazette notice
   */
  public requiresGazetteNotice(): boolean {
    // All cases require gazette notice except:
    // 1. Small estates under magistrate (< KES 100,000)
    // 2. Islamic estates where all heirs agree (can waive)

    const estateValue = this.props.estateValueKES || 0;

    if (estateValue < 100_000 && !this.props.hasDisputedAssets) {
      return false; // Small estate exemption
    }

    if (
      this.props.religion === SuccessionReligion.ISLAMIC &&
      !this.props.hasDisputedAssets &&
      this.props.totalBeneficiaries <= 3
    ) {
      return false; // Islamic family agreement
    }

    return true;
  }

  /**
   * Generate recommended strategy message for the user
   * This is the "Digital Lawyer" advice
   */
  public generateRecommendedStrategy(): string {
    const court = this.determineCourtJurisdiction();
    const priority = this.determineCasePriority();

    let strategy = `Based on your case analysis:\n\n`;

    // Court recommendation
    strategy += `🏛️ **Court Filing**: File in the ${this.getCourtName(court)}\n`;

    // Timeline
    strategy += `📅 **Expected Timeline**: ${this.getTimelineEstimate(priority)} months\n`;

    // Key documents needed
    strategy += `📋 **Critical Documents**:\n`;
    strategy += `   • Death Certificate (Mandatory)\n`;

    if (
      this.props.regime === SuccessionRegime.INTESTATE &&
      this.props.religion === SuccessionReligion.AFRICAN_CUSTOMARY
    ) {
      strategy += `   • Chief's Letter (Required for intestate customary)\n`;
    }

    if (this.props.regime === SuccessionRegime.TESTATE) {
      strategy += `   • Original Will + 2 Witness IDs\n`;
    }

    if (this.props.isMinorInvolved) {
      strategy += `   • Birth Certificates for minors\n`;
      strategy += `   • Guardian consent letters\n`;
    }

    // Risks
    if (this.props.hasDisputedAssets) {
      strategy += `\n⚠️ **High Risk**: Asset disputes may require mediation before filing.\n`;
    }

    if (this.props.marriageType === SuccessionMarriageType.COHABITATION) {
      strategy += `\n⚠️ **Medium Risk**: Cohabitation claims often face challenges. Gather evidence of cohabitation.\n`;
    }

    // Next steps
    strategy += `\n✅ **Next Steps**:\n`;
    strategy += `   1. Gather all required documents\n`;
    strategy += `   2. Complete family tree information\n`;
    strategy += `   3. Submit for readiness assessment\n`;

    return strategy;
  }

  /**
   * Is this a "simple" case or "complex" case?
   * Simple: Monogamous, no minors, clear Will, low value, no disputes
   * Complex: Polygamous, disputed, cohabitation, high value, minors
   */
  public isSimpleCase(): boolean {
    return (
      this.props.estimatedComplexityScore <= 3 &&
      this.props.marriageType === SuccessionMarriageType.MONOGAMOUS &&
      !this.props.hasDisputedAssets &&
      !this.props.isMinorInvolved &&
      !this.props.isBusinessAssetsInvolved &&
      !this.props.isForeignAssetsInvolved
    );
  }

  // ==================== HELPER METHODS ====================

  private getCourtName(jurisdiction: CourtJurisdiction): string {
    const names = {
      [CourtJurisdiction.HIGH_COURT]: 'High Court of Kenya',
      [CourtJurisdiction.MAGISTRATE_COURT]: "Resident Magistrate's Court",
      [CourtJurisdiction.KADHIS_COURT]: "Kadhi's Court",
      [CourtJurisdiction.CUSTOMARY_COURT]: 'Customary Court',
      [CourtJurisdiction.FAMILY_DIVISION]: 'High Court (Family Division)',
      [CourtJurisdiction.COMMERCIAL_COURT]: 'Commercial & Tax Division',
    };
    return names[jurisdiction];
  }

  private getTimelineEstimate(priority: CasePriority): string {
    const timelines = {
      [CasePriority.URGENT]: '1-2',
      [CasePriority.HIGH]: '3-4',
      [CasePriority.NORMAL]: '5-6',
      [CasePriority.LOW]: '7-8',
    };
    return timelines[priority];
  }

  /**
   * Generate a human-readable case classification
   * Used for UI display, logging, and analytics
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

    // Size classification
    if (this.props.totalBeneficiaries > 10) {
      parts.push('LARGE_FAMILY');
    } else if (this.props.totalBeneficiaries > 5) {
      parts.push('MEDIUM_FAMILY');
    }

    // Special flags
    if (this.props.isMinorInvolved) {
      parts.push('WITH_MINORS');
    }

    if (this.props.hasDisputedAssets) {
      parts.push('DISPUTED');
    }

    if (this.props.isBusinessAssetsInvolved) {
      parts.push('BUSINESS_ASSETS');
    }

    if (this.props.isForeignAssetsInvolved) {
      parts.push('FOREIGN_ASSETS');
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
    beneficiaryCount: number,
  ): SuccessionContext {
    return new SuccessionContext({
      regime: SuccessionRegime.INTESTATE,
      marriageType,
      religion: SuccessionReligion.STATUTORY,
      isMinorInvolved: hasMinors,
      hasDisputedAssets: false,
      estimatedComplexityScore: hasMinors ? 4 : 2,
      totalBeneficiaries: beneficiaryCount,
      isEstateInsolvent: false,
      isBusinessAssetsInvolved: false,
      isForeignAssetsInvolved: false,
      isCharitableBequest: false,
      hasDependantsWithDisabilities: false,
    });
  }

  /**
   * Create an Islamic case (Kadhi's Court)
   */
  public static createIslamicCase(
    regime: SuccessionRegime,
    hasWill: boolean,
    polygamous: boolean = false,
  ): SuccessionContext {
    return new SuccessionContext({
      regime,
      marriageType: polygamous
        ? SuccessionMarriageType.POLYGAMOUS
        : SuccessionMarriageType.MONOGAMOUS,
      religion: SuccessionReligion.ISLAMIC,
      isMinorInvolved: false, // Will be detected separately
      hasDisputedAssets: false,
      estimatedComplexityScore: hasWill ? 5 : 6,
      totalBeneficiaries: polygamous ? 8 : 4, // Estimate
      isEstateInsolvent: false,
      isBusinessAssetsInvolved: false,
      isForeignAssetsInvolved: false,
      isCharitableBequest: false,
      hasDependantsWithDisabilities: false,
    });
  }

  /**
   * Create a Polygamous case (Section 40)
   */
  public static createPolygamousCase(
    regime: SuccessionRegime,
    numberOfHouses: number,
    estateValueKES?: number,
  ): SuccessionContext {
    return new SuccessionContext({
      regime,
      marriageType: SuccessionMarriageType.POLYGAMOUS,
      religion: SuccessionReligion.STATUTORY,
      isMinorInvolved: true, // Polygamous families usually have children
      hasDisputedAssets: numberOfHouses > 2, // More houses = more disputes
      estimatedComplexityScore: Math.min(10, 5 + numberOfHouses),
      totalBeneficiaries: numberOfHouses * 3, // Estimate: 3 beneficiaries per house
      estateValueKES,
      isEstateInsolvent: false,
      isBusinessAssetsInvolved: false,
      isForeignAssetsInvolved: false,
      isCharitableBequest: false,
      hasDependantsWithDisabilities: false,
    });
  }

  /**
   * Create a complex business succession case
   */
  public static createBusinessSuccessionCase(
    regime: SuccessionRegime,
    estateValueKES: number,
    businessTypes: string[],
  ): SuccessionContext {
    return new SuccessionContext({
      regime,
      marriageType: SuccessionMarriageType.MONOGAMOUS,
      religion: SuccessionReligion.STATUTORY,
      isMinorInvolved: false,
      hasDisputedAssets: false,
      estimatedComplexityScore: 9,
      totalBeneficiaries: 3, // Typically family members
      estateValueKES,
      isEstateInsolvent: false,
      isBusinessAssetsInvolved: true,
      isForeignAssetsInvolved: businessTypes.includes('FOREIGN'),
      isCharitableBequest: false,
      hasDependantsWithDisabilities: false,
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
      totalBeneficiaries: this.props.totalBeneficiaries,
      estateValueKES: this.props.estateValueKES,
      isEstateInsolvent: this.props.isEstateInsolvent,
      isBusinessAssetsInvolved: this.props.isBusinessAssetsInvolved,
      isForeignAssetsInvolved: this.props.isForeignAssetsInvolved,
      isCharitableBequest: this.props.isCharitableBequest,
      hasDependantsWithDisabilities: this.props.hasDependantsWithDisabilities,

      // Derived properties for convenience
      courtJurisdiction: this.determineCourtJurisdiction(),
      casePriority: this.determineCasePriority(),
      isSection40Applicable: this.isSection40Applicable(),
      requiresDependantAnalysis: this.requiresDependantAnalysis(),
      requiresUniversalConsent: this.requiresUniversalConsent(),
      requiresGuarantee: this.requiresGuarantee(),
      requiresGazetteNotice: this.requiresGazetteNotice(),
      caseClassification: this.toCaseClassification(),
      isSimpleCase: this.isSimpleCase(),
    };
  }

  /**
   * Deserialize from JSON (for read models and event replay)
   */
  public static fromJSON(json: Record<string, any>): SuccessionContext {
    return new SuccessionContext({
      regime: json.regime as SuccessionRegime,
      marriageType: json.marriageType as SuccessionMarriageType,
      religion: json.religion as SuccessionReligion,
      isMinorInvolved: json.isMinorInvolved,
      hasDisputedAssets: json.hasDisputedAssets,
      estimatedComplexityScore: json.estimatedComplexityScore,
      totalBeneficiaries: json.totalBeneficiaries,
      estateValueKES: json.estateValueKES,
      isEstateInsolvent: json.isEstateInsolvent,
      isBusinessAssetsInvolved: json.isBusinessAssetsInvolved,
      isForeignAssetsInvolved: json.isForeignAssetsInvolved,
      isCharitableBequest: json.isCharitableBequest,
      hasDependantsWithDisabilities: json.hasDependantsWithDisabilities,
    });
  }
}
