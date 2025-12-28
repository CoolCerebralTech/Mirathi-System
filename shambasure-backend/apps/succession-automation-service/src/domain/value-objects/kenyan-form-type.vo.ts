// src/succession-automation/src/domain/value-objects/kenyan-form-type.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';
import { SuccessionContext } from './succession-context.vo';
import {
  CourtJurisdiction,
  SuccessionMarriageType,
  SuccessionRegime,
  SuccessionReligion,
} from './succession-context.vo';

/**
 * Kenyan Form Type Value Object
 *
 * INNOVATION: Dynamic Form Strategy Engine
 *
 * This VO enables:
 * 1. Context-Aware Form Selection: Automatically picks correct forms based on case specifics
 * 2. Court-Specific Variations: Different forms for High Court vs Kadhi's Court vs Magistrate
 * 3. Conditional Dependencies: Some forms only required if certain conditions met
 * 4. Form Sequencing: Determines filing order and prerequisites
 * 5. Cost Estimation: Calculates total filing fees
 *
 * LEGAL CONTEXT:
 * Each Kenyan court has specific form requirements:
 * - High Court: Standard P&A forms
 * - Kadhi's Court: Islamic-specific forms in Arabic/Kiswahili
 * - Magistrate: Simplified P&A 5 for small estates
 * - Commercial Court: Additional business asset schedules
 *
 * SMART FORM LOGIC:
 * - Estate value > KES 5M → Requires valuation report
 * - Minors involved → Requires P&A 57 (Guarantee)
 * - Disputed assets → Requires additional affidavits
 * - Polygamous → Requires separate consents per house
 */

export enum KenyanFormTypeEnum {
  // ========== PRIMARY PETITIONS ==========
  PA1_PETITION = 'PA1_PETITION', // Grant of Probate (Testate)
  PA5_PETITION_SUMMARY = 'PA5_PETITION_SUMMARY', // Summary Administration (< KES 500k)
  PA80_PETITION_INTESTATE = 'PA80_PETITION_INTESTATE', // Letters of Administration (Intestate)
  PA81_PETITION_ADMINISTRATION = 'PA81_PETITION_ADMINISTRATION', // Administration with Will Annexed

  // ========== ISLAMIC FORMS (KADHI'S COURT) ==========
  ISLAMIC_PETITION = 'ISLAMIC_PETITION',
  ISLAMIC_CONSENT = 'ISLAMIC_CONSENT',
  ISLAMIC_AFFIDAVIT = 'ISLAMIC_AFFIDAVIT',
  ISLAMIC_DISTRIBUTION_PLAN = 'ISLAMIC_DISTRIBUTION_PLAN',

  // ========== SUPPORTING AFFIDAVITS ==========
  PA12_AFFIDAVIT_MEANS = 'PA12_AFFIDAVIT_MEANS', // Financial capacity
  AFFIDAVIT_DUE_EXECUTION = 'AFFIDAVIT_DUE_EXECUTION', // Will execution
  AFFIDAVIT_OF_SEARCH = 'AFFIDAVIT_OF_SEARCH', // No other grants
  AFFIDAVIT_OF_IDENTIFICATION = 'AFFIDAVIT_OF_IDENTIFICATION', // Identify deceased
  AFFIDAVIT_SUPPORTING_POLYGAMY = 'AFFIDAVIT_SUPPORTING_POLYGAMY', // For polygamous cases

  // ========== CONSENTS & GUARANTEES ==========
  PA38_CONSENT = 'PA38_CONSENT', // Family consent
  PA57_GUARANTEE = 'PA57_GUARANTEE', // Surety bond
  CONSENT_MINOR = 'CONSENT_MINOR', // Guardian consent for minor's share
  CONSENT_CREDITOR = 'CONSENT_CREDITOR', // Creditor consent (if debts)

  // ========== NOTICES & SCHEDULES ==========
  NOTICE_TO_CREDITORS = 'NOTICE_TO_CREDITORS',
  GAZETTE_NOTICE = 'GAZETTE_NOTICE',
  INVENTORY_ASSETS = 'INVENTORY_ASSETS',
  SCHEDULE_DEBTS = 'SCHEDULE_DEBTS',
  VALUATION_REPORT = 'VALUATION_REPORT', // For high-value assets

  // ========== CUSTOMARY DOCUMENTS ==========
  CHIEFS_LETTER_TEMPLATE = 'CHIEFS_LETTER_TEMPLATE',
  ELDERS_AFFIDAVIT = 'ELDERS_AFFIDAVIT', // Customary marriage verification

  // ========== COURT ORDERS & GRANTS ==========
  GRANT_OF_PROBATE = 'GRANT_OF_PROBATE',
  GRANT_LETTERS_ADMINISTRATION = 'GRANT_LETTERS_ADMINISTRATION',
  GRANT_ADMINISTRATION_WILL = 'GRANT_ADMINISTRATION_WILL', // With Will Annexed
  CONFIRMATION_GRANT = 'CONFIRMATION_GRANT', // P&A 41

  // ========== DISTRIBUTION DOCUMENTS ==========
  DISTRIBUTION_ACCOUNT = 'DISTRIBUTION_ACCOUNT', // P&A 41
  AFFIDAVIT_COMPLETION = 'AFFIDAVIT_COMPLETION', // After distribution
}

export enum FormCategory {
  PRIMARY_PETITION = 'PRIMARY_PETITION',
  SUPPORTING_AFFIDAVIT = 'SUPPORTING_AFFIDAVIT',
  CONSENT = 'CONSENT',
  GUARANTEE = 'GUARANTEE',
  NOTICE = 'NOTICE',
  SCHEDULE = 'SCHEDULE',
  COURT_ORDER = 'COURT_ORDER',
  CUSTOMARY = 'CUSTOMARY',
  ISLAMIC = 'ISLAMIC',
  DISTRIBUTION = 'DISTRIBUTION',
}

export enum FormPrerequisite {
  DEATH_CERTIFICATE = 'DEATH_CERTIFICATE',
  ID_COPIES = 'ID_COPIES',
  MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
  BIRTH_CERTIFICATES = 'BIRTH_CERTIFICATES',
  KRA_PIN = 'KRA_PIN',
  VALUATION_REPORT = 'VALUATION_REPORT',
  CHIEFS_LETTER = 'CHIEFS_LETTER',
  OTHER_FORMS = 'OTHER_FORMS', // Requires other forms first
}

interface FormDependency {
  formType: KenyanFormTypeEnum;
  isMandatory: boolean;
  condition?: string; // JavaScript condition string for evaluation
}

interface KenyanFormTypeProps {
  formType: KenyanFormTypeEnum;
  formCode: string; // Official court code (e.g., "P&A 1")
  displayName: string;
  description: string;
  legalBasis: string;
  category: FormCategory;
  isRequired: boolean;
  applicableCourts: CourtJurisdiction[]; // Which courts accept this form
  applicableRegimes: SuccessionRegime[]; // Which succession regimes need this
  estimatedPages: number;
  requiresNotarization: boolean;
  requiresCommissionerOaths: boolean; // Commissioner for Oaths
  requiresCourtStamp: boolean;
  filingFee: number; // KES amount (0 if no fee)
  timeToComplete: number; // Estimated hours to complete
  prerequisites: FormPrerequisite[]; // What's needed before this form
  dependencies: FormDependency[]; // Other forms that must accompany this
  conditionalLogic?: string; // JavaScript condition for when this form is required
  courtSpecificInstructions?: Partial<Record<CourtJurisdiction, string>>; // FIXED: Made Partial
  version: string; // Form version (for template updates)
  lastUpdated: Date;
}

export class KenyanFormType extends ValueObject<KenyanFormTypeProps> {
  // Court filing fee schedules (2024 rates)
  private static readonly FEE_SCHEDULE: Record<
    CourtJurisdiction,
    { base: number; perPage: number; stamp: number }
  > = {
    [CourtJurisdiction.HIGH_COURT]: {
      base: 1000,
      perPage: 50,
      stamp: 200,
    },
    [CourtJurisdiction.MAGISTRATE_COURT]: {
      base: 500,
      perPage: 20,
      stamp: 100,
    },
    [CourtJurisdiction.KADHIS_COURT]: {
      base: 750,
      perPage: 30,
      stamp: 150,
    },
    [CourtJurisdiction.CUSTOMARY_COURT]: {
      base: 300,
      perPage: 10,
      stamp: 50,
    },
    [CourtJurisdiction.FAMILY_DIVISION]: {
      base: 1200,
      perPage: 60,
      stamp: 250,
    },
    [CourtJurisdiction.COMMERCIAL_COURT]: {
      base: 2000,
      perPage: 100,
      stamp: 500,
    },
  };

  // Conditional logic helpers
  private static readonly CONDITIONS = {
    HAS_MINORS: 'context.isMinorInvolved',
    HAS_DISPUTES: 'context.hasDisputedAssets',
    IS_POLYGAMOUS: 'context.marriageType === "POLYGAMOUS"',
    IS_ISLAMIC: 'context.religion === "ISLAMIC"',
    ESTATE_OVER_5M: 'estateValue > 5000000',
    ESTATE_UNDER_500K: 'estateValue < 500000',
    HAS_BUSINESS_ASSETS: 'context.isBusinessAssetsInvolved',
    HAS_FOREIGN_ASSETS: 'context.isForeignAssetsInvolved',
    IS_COHABITATION: 'context.marriageType === "COHABITATION"',
  };

  constructor(props: KenyanFormTypeProps) {
    super(props);
  }

  protected validate(): void {
    const {
      formType,
      formCode,
      displayName,
      description,
      legalBasis,
      estimatedPages,
      filingFee,
      timeToComplete,
      version,
      lastUpdated,
    } = this.props;

    // Basic validations
    if (!Object.values(KenyanFormTypeEnum).includes(formType)) {
      throw new ValueObjectValidationError(`Invalid KenyanFormTypeEnum: ${formType}`, 'formType');
    }

    if (!formCode || formCode.trim().length === 0) {
      throw new ValueObjectValidationError('Form code is required', 'formCode');
    }

    if (!displayName || displayName.trim().length === 0) {
      throw new ValueObjectValidationError('Display name is required', 'displayName');
    }

    if (!description || description.trim().length === 0) {
      throw new ValueObjectValidationError('Description is required', 'description');
    }

    if (!legalBasis || legalBasis.trim().length === 0) {
      throw new ValueObjectValidationError('Legal basis is required', 'legalBasis');
    }

    if (estimatedPages < 1) {
      throw new ValueObjectValidationError('Estimated pages must be at least 1', 'estimatedPages');
    }

    if (filingFee < 0) {
      throw new ValueObjectValidationError('Filing fee cannot be negative', 'filingFee');
    }

    if (timeToComplete < 0.5) {
      throw new ValueObjectValidationError(
        'Time to complete must be at least 0.5 hours',
        'timeToComplete',
      );
    }

    if (!version || version.trim().length === 0) {
      throw new ValueObjectValidationError('Version is required', 'version');
    }

    if (!(lastUpdated instanceof Date) || isNaN(lastUpdated.getTime())) {
      throw new ValueObjectValidationError('Invalid last updated date', 'lastUpdated');
    }

    // BUSINESS RULE: Court orders cannot have filing fees (issued by court)
    if (this.props.category === FormCategory.COURT_ORDER && filingFee > 0) {
      throw new ValueObjectValidationError('Court orders cannot have filing fees', 'filingFee');
    }

    // BUSINESS RULE: Required forms must have at least one applicable court
    if (this.props.isRequired && this.props.applicableCourts.length === 0) {
      throw new ValueObjectValidationError(
        'Required forms must be applicable to at least one court',
        'applicableCourts',
      );
    }

    // BUSINESS RULE: Islamic forms only for Kadhi's Court
    if (
      this.props.category === FormCategory.ISLAMIC &&
      !this.props.applicableCourts.includes(CourtJurisdiction.KADHIS_COURT)
    ) {
      throw new ValueObjectValidationError(
        "Islamic forms must be applicable to Kadhi's Court",
        'applicableCourts',
      );
    }
  }

  // ==================== GETTERS ====================

  get formType(): KenyanFormTypeEnum {
    return this.props.formType;
  }

  get formCode(): string {
    return this.props.formCode;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get description(): string {
    return this.props.description;
  }

  get legalBasis(): string {
    return this.props.legalBasis;
  }

  get category(): FormCategory {
    return this.props.category;
  }

  get isRequired(): boolean {
    return this.props.isRequired;
  }

  get applicableCourts(): CourtJurisdiction[] {
    return [...this.props.applicableCourts];
  }

  get applicableRegimes(): SuccessionRegime[] {
    return [...this.props.applicableRegimes];
  }

  get estimatedPages(): number {
    return this.props.estimatedPages;
  }

  get requiresNotarization(): boolean {
    return this.props.requiresNotarization;
  }

  get requiresCommissionerOaths(): boolean {
    return this.props.requiresCommissionerOaths;
  }

  get requiresCourtStamp(): boolean {
    return this.props.requiresCourtStamp;
  }

  get filingFee(): number {
    return this.props.filingFee;
  }

  get timeToComplete(): number {
    return this.props.timeToComplete;
  }

  get prerequisites(): FormPrerequisite[] {
    return [...this.props.prerequisites];
  }

  get dependencies(): FormDependency[] {
    return [...this.props.dependencies];
  }

  get conditionalLogic(): string | undefined {
    return this.props.conditionalLogic;
  }

  get courtSpecificInstructions(): Partial<Record<CourtJurisdiction, string>> | undefined {
    return this.props.courtSpecificInstructions;
  }

  get version(): string {
    return this.props.version;
  }

  get lastUpdated(): Date {
    return this.props.lastUpdated;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Is this form applicable for a specific succession regime?
   */
  public isApplicableForRegime(regime: SuccessionRegime): boolean {
    return (
      this.props.applicableRegimes.includes(regime) ||
      this.props.applicableRegimes.includes(SuccessionRegime.INTESTATE as any)
    ); // All includes
  }

  /**
   * Can this form be used in the specified court?
   */
  public isValidForCourt(court: CourtJurisdiction): boolean {
    return this.props.applicableCourts.includes(court) || this.props.applicableCourts.length === 0; // Empty means all courts
  }

  /**
   * Get total estimated cost for this form in a specific court
   */
  public getEstimatedCost(court: CourtJurisdiction): number {
    const fees =
      KenyanFormType.FEE_SCHEDULE[court] ||
      KenyanFormType.FEE_SCHEDULE[CourtJurisdiction.HIGH_COURT];

    let total = this.props.filingFee;

    // Add per page fees
    total += fees.perPage * this.props.estimatedPages;

    // Add court stamp if required
    if (this.props.requiresCourtStamp) {
      total += fees.stamp;
    }

    return total;
  }

  /**
   * Check if all prerequisites are met
   */
  public prerequisitesMet(availablePrerequisites: FormPrerequisite[]): boolean {
    return this.props.prerequisites.every((prereq) => availablePrerequisites.includes(prereq));
  }

  /**
   * Evaluate conditional logic to determine if form is required
   */
  public evaluateCondition(context: SuccessionContext, estateValue: number): boolean {
    if (!this.props.conditionalLogic) {
      return this.props.isRequired;
    }

    try {
      // Create safe evaluation context
      const evalContext = {
        context,
        estateValue,
        ...KenyanFormType.CONDITIONS,
      };

      // Simple evaluation (in real system, use a safe evaluator like vm2)
      const condition = this.props.conditionalLogic
        .replace('context.isMinorInvolved', String(context.isMinorInvolved))
        .replace('context.hasDisputedAssets', String(context.hasDisputedAssets))
        .replace(
          'context.marriageType === "POLYGAMOUS"',
          String(context.marriageType === SuccessionMarriageType.POLYGAMOUS),
        )
        .replace(
          'context.religion === "ISLAMIC"',
          String(context.religion === SuccessionReligion.ISLAMIC),
        )
        .replace('estateValue > 5000000', String(estateValue > 5000000))
        .replace('estateValue < 500000', String(estateValue < 500000))
        .replace('context.isBusinessAssetsInvolved', String(context.isBusinessAssetsInvolved))
        .replace('context.isForeignAssetsInvolved', String(context.isForeignAssetsInvolved))
        .replace(
          'context.marriageType === "COHABITATION"',
          String(context.marriageType === SuccessionMarriageType.COHABITATION),
        );

      // Simple evaluation (in production, use proper expression evaluator)
      return eval(condition);
    } catch (error) {
      console.warn(`Failed to evaluate condition for ${this.formCode}:`, error);
      return this.props.isRequired;
    }
  }

  /**
   * Get court-specific instructions
   */
  public getInstructionsForCourt(court: CourtJurisdiction): string {
    if (this.props.courtSpecificInstructions && this.props.courtSpecificInstructions[court]) {
      return this.props.courtSpecificInstructions[court];
    }

    // Default instructions
    return `File this ${this.props.formCode} at the ${court} registry during working hours (8:00 AM - 5:00 PM).`;
  }

  /**
   * Get a human-readable summary of requirements
   */
  public getRequirementsSummary(): string {
    const requirements: string[] = [];

    if (this.props.prerequisites.length > 0) {
      requirements.push(`Requires: ${this.props.prerequisites.join(', ')}`);
    }

    if (this.props.requiresNotarization) {
      requirements.push('Must be notarized by Advocate');
    }

    if (this.props.requiresCommissionerOaths) {
      requirements.push('Must be sworn before Commissioner for Oaths');
    }

    if (this.props.requiresCourtStamp) {
      requirements.push('Requires court revenue stamp');
    }

    return requirements.join(' | ');
  }

  /**
   * Get estimated completion timeline
   */
  public getTimelineEstimate(): string {
    if (this.props.timeToComplete <= 1) {
      return '1 hour or less';
    } else if (this.props.timeToComplete <= 4) {
      return `${this.props.timeToComplete} hours`;
    } else if (this.props.timeToComplete <= 8) {
      return '1 business day';
    } else {
      return `${Math.ceil(this.props.timeToComplete / 8)} business days`;
    }
  }

  // ==================== FACTORY METHODS ====================

  /**
   * P&A 1: Petition for Grant of Probate (Testate)
   */
  public static createPA1Petition(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.PA1_PETITION,
      formCode: 'P&A 1',
      displayName: 'Petition for Grant of Probate',
      description: 'Primary form for applying for Grant of Probate when deceased left a valid Will',
      legalBasis: 'Section 56, Law of Succession Act',
      category: FormCategory.PRIMARY_PETITION,
      isRequired: true,
      applicableCourts: [CourtJurisdiction.HIGH_COURT, CourtJurisdiction.FAMILY_DIVISION],
      applicableRegimes: [SuccessionRegime.TESTATE, SuccessionRegime.PARTIALLY_INTESTATE],
      estimatedPages: 4,
      requiresNotarization: false,
      requiresCommissionerOaths: true,
      requiresCourtStamp: true,
      filingFee: 1000,
      timeToComplete: 2,
      prerequisites: [
        FormPrerequisite.DEATH_CERTIFICATE,
        FormPrerequisite.ID_COPIES,
        FormPrerequisite.KRA_PIN,
      ],
      dependencies: [
        { formType: KenyanFormTypeEnum.AFFIDAVIT_DUE_EXECUTION, isMandatory: true },
        { formType: KenyanFormTypeEnum.PA38_CONSENT, isMandatory: true },
        { formType: KenyanFormTypeEnum.INVENTORY_ASSETS, isMandatory: true },
      ],
      conditionalLogic: 'context.regime === "TESTATE" && !context.requiresKadhisCourt()',
      courtSpecificInstructions: {
        [CourtJurisdiction.HIGH_COURT]: 'File in triplicate with original Will attached',
        [CourtJurisdiction.FAMILY_DIVISION]: 'File with Family Division registry, room 12',
      },
      version: '2024.1',
      lastUpdated: new Date('2024-01-15'),
    });
  }

  /**
   * P&A 80: Petition for Letters of Administration (Intestate)
   */
  public static createPA80PetitionIntestate(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.PA80_PETITION_INTESTATE,
      formCode: 'P&A 80',
      displayName: 'Petition for Letters of Administration',
      description: 'Primary form for intestate succession (no Will)',
      legalBasis: 'Section 56, Law of Succession Act',
      category: FormCategory.PRIMARY_PETITION,
      isRequired: true,
      applicableCourts: [
        CourtJurisdiction.HIGH_COURT,
        CourtJurisdiction.FAMILY_DIVISION,
        CourtJurisdiction.MAGISTRATE_COURT,
      ],
      applicableRegimes: [SuccessionRegime.INTESTATE],
      estimatedPages: 3,
      requiresNotarization: false,
      requiresCommissionerOaths: true,
      requiresCourtStamp: true,
      filingFee: 1000,
      timeToComplete: 1.5,
      prerequisites: [
        FormPrerequisite.DEATH_CERTIFICATE,
        FormPrerequisite.ID_COPIES,
        FormPrerequisite.KRA_PIN,
      ],
      dependencies: [
        { formType: KenyanFormTypeEnum.PA38_CONSENT, isMandatory: true },
        { formType: KenyanFormTypeEnum.INVENTORY_ASSETS, isMandatory: true },
        {
          formType: KenyanFormTypeEnum.PA57_GUARANTEE,
          isMandatory: false,
          condition: KenyanFormType.CONDITIONS.HAS_MINORS,
        },
      ],
      conditionalLogic:
        'context.regime === "INTESTATE" && !context.requiresKadhisCourt() && estateValue >= 500000',
      courtSpecificInstructions: {
        [CourtJurisdiction.MAGISTRATE_COURT]: 'For estates under KES 7M only',
        [CourtJurisdiction.HIGH_COURT]: 'File with Probate registry',
      },
      version: '2024.1',
      lastUpdated: new Date('2024-01-15'),
    });
  }

  /**
   * P&A 5: Petition for Summary Administration (Small estates)
   */
  public static createPA5PetitionSummary(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.PA5_PETITION_SUMMARY,
      formCode: 'P&A 5',
      displayName: 'Petition for Summary Administration',
      description: 'Simplified form for small estates (value < KES 500,000)',
      legalBasis: 'Section 79, Law of Succession Act',
      category: FormCategory.PRIMARY_PETITION,
      isRequired: true,
      applicableCourts: [CourtJurisdiction.MAGISTRATE_COURT],
      applicableRegimes: [SuccessionRegime.INTESTATE, SuccessionRegime.TESTATE],
      estimatedPages: 2,
      requiresNotarization: false,
      requiresCommissionerOaths: true,
      requiresCourtStamp: true,
      filingFee: 500,
      timeToComplete: 1,
      prerequisites: [FormPrerequisite.DEATH_CERTIFICATE, FormPrerequisite.ID_COPIES],
      dependencies: [
        { formType: KenyanFormTypeEnum.PA38_CONSENT, isMandatory: true },
        { formType: KenyanFormTypeEnum.INVENTORY_ASSETS, isMandatory: true },
      ],
      conditionalLogic: 'estateValue < 500000',
      courtSpecificInstructions: {
        [CourtJurisdiction.MAGISTRATE_COURT]:
          "File at Resident Magistrate's Court in deceased's area",
      },
      version: '2024.1',
      lastUpdated: new Date('2024-01-15'),
    });
  }

  /**
   * Islamic Petition (Kadhi's Court)
   */
  public static createIslamicPetition(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.ISLAMIC_PETITION,
      formCode: 'Islamic Petition',
      displayName: 'Islamic Succession Petition',
      description: "Petition for succession under Islamic law (Kadhi's Court)",
      legalBasis: "Article 170 Constitution, Kadhi's Court Act",
      category: FormCategory.ISLAMIC,
      isRequired: true,
      applicableCourts: [CourtJurisdiction.KADHIS_COURT],
      applicableRegimes: [SuccessionRegime.INTESTATE, SuccessionRegime.TESTATE],
      estimatedPages: 3,
      requiresNotarization: false,
      requiresCommissionerOaths: false,
      requiresCourtStamp: true,
      filingFee: 750,
      timeToComplete: 2,
      prerequisites: [
        FormPrerequisite.DEATH_CERTIFICATE,
        FormPrerequisite.ID_COPIES,
        FormPrerequisite.MARRIAGE_CERTIFICATE,
      ],
      dependencies: [
        { formType: KenyanFormTypeEnum.ISLAMIC_CONSENT, isMandatory: true },
        { formType: KenyanFormTypeEnum.ISLAMIC_AFFIDAVIT, isMandatory: true },
      ],
      conditionalLogic: 'context.religion === "ISLAMIC"',
      courtSpecificInstructions: {
        [CourtJurisdiction.KADHIS_COURT]: 'Must be in Arabic or Kiswahili. Bring 3 copies.',
      },
      version: '2024.1',
      lastUpdated: new Date('2024-01-15'),
    });
  }

  /**
   * P&A 38: Consent Form
   */
  public static createPA38Consent(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.PA38_CONSENT,
      formCode: 'P&A 38',
      displayName: 'Consent Form',
      description: 'Family members and beneficiaries consent to the application',
      legalBasis: 'Section 56, Law of Succession Act',
      category: FormCategory.CONSENT,
      isRequired: true,
      applicableCourts: [
        CourtJurisdiction.HIGH_COURT,
        CourtJurisdiction.MAGISTRATE_COURT,
        CourtJurisdiction.FAMILY_DIVISION,
      ],
      applicableRegimes: [SuccessionRegime.INTESTATE, SuccessionRegime.TESTATE],
      estimatedPages: 1,
      requiresNotarization: false,
      requiresCommissionerOaths: false,
      requiresCourtStamp: false,
      filingFee: 0,
      timeToComplete: 0.5,
      prerequisites: [FormPrerequisite.ID_COPIES],
      dependencies: [],
      conditionalLogic: '!context.requiresKadhisCourt()',
      version: '2024.1',
      lastUpdated: new Date('2024-01-15'),
    });
  }

  /**
   * P&A 57: Guarantee Form
   */
  public static createPA57Guarantee(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.PA57_GUARANTEE,
      formCode: 'P&A 57',
      displayName: 'Guarantee Form',
      description: 'Surety bond guaranteeing proper administration',
      legalBasis: 'Section 72, Law of Succession Act',
      category: FormCategory.GUARANTEE,
      isRequired: false,
      applicableCourts: [CourtJurisdiction.HIGH_COURT, CourtJurisdiction.MAGISTRATE_COURT],
      applicableRegimes: [SuccessionRegime.INTESTATE],
      estimatedPages: 2,
      requiresNotarization: true,
      requiresCommissionerOaths: false,
      requiresCourtStamp: true,
      filingFee: 0,
      timeToComplete: 1,
      prerequisites: [FormPrerequisite.ID_COPIES],
      dependencies: [],
      conditionalLogic:
        'context.isMinorInvolved || context.hasDisputedAssets || estateValue > 10000000',
      courtSpecificInstructions: {
        [CourtJurisdiction.HIGH_COURT]:
          'Two sureties required, each with property worth estate value',
        [CourtJurisdiction.MAGISTRATE_COURT]: 'One surety required',
      },
      version: '2024.1',
      lastUpdated: new Date('2024-01-15'),
    });
  }

  /**
   * Affidavit Supporting Polygamy (for Section 40 cases)
   */
  public static createAffidavitSupportingPolygamy(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.AFFIDAVIT_SUPPORTING_POLYGAMY,
      formCode: 'Affidavit - Polygamy',
      displayName: 'Affidavit Supporting Polygamous Marriage',
      description: 'Affidavit confirming polygamous marriages under Section 40 LSA',
      legalBasis: 'Section 40, Law of Succession Act',
      category: FormCategory.SUPPORTING_AFFIDAVIT,
      isRequired: false,
      applicableCourts: [CourtJurisdiction.HIGH_COURT, CourtJurisdiction.FAMILY_DIVISION],
      applicableRegimes: [SuccessionRegime.INTESTATE],
      estimatedPages: 2,
      requiresNotarization: true,
      requiresCommissionerOaths: true,
      requiresCourtStamp: false,
      filingFee: 0,
      timeToComplete: 1,
      prerequisites: [FormPrerequisite.MARRIAGE_CERTIFICATE, FormPrerequisite.BIRTH_CERTIFICATES],
      dependencies: [],
      conditionalLogic: 'context.marriageType === "POLYGAMOUS"',
      courtSpecificInstructions: {
        [CourtJurisdiction.HIGH_COURT]: 'Must list all wives and children by house',
        [CourtJurisdiction.FAMILY_DIVISION]: 'Include details of each household',
      },
      version: '2024.1',
      lastUpdated: new Date('2024-01-15'),
    });
  }

  /**
   * Generic factory
   */
  public static create(props: KenyanFormTypeProps): KenyanFormType {
    return new KenyanFormType(props);
  }

  // ==================== FORM STRATEGY ENGINE ====================

  /**
   * Generate complete form bundle for a case
   * This is the core logic used by FormStrategyService
   */
  public static generateFormBundle(
    context: SuccessionContext,
    estateValue: number,
    availablePrerequisites: FormPrerequisite[],
  ): KenyanFormType[] {
    const forms: KenyanFormType[] = [];

    // Get all available form templates
    const allForms = [
      KenyanFormType.createPA1Petition(),
      KenyanFormType.createPA80PetitionIntestate(),
      KenyanFormType.createPA5PetitionSummary(),
      KenyanFormType.createIslamicPetition(),
      KenyanFormType.createPA38Consent(),
      KenyanFormType.createPA57Guarantee(),
      KenyanFormType.createAffidavitSupportingPolygamy(),
      // Add other form factories as needed
    ];

    // Filter forms by context and conditions
    for (const form of allForms) {
      try {
        // Check if form is applicable
        const isApplicable =
          form.isApplicableForRegime(context.regime) &&
          form.isValidForCourt(context.determineCourtJurisdiction()) &&
          form.evaluateCondition(context, estateValue);

        if (isApplicable && form.prerequisitesMet(availablePrerequisites)) {
          forms.push(form);

          // Add mandatory dependencies
          for (const dependency of form.dependencies) {
            if (dependency.isMandatory) {
              const depForm = allForms.find((f) => f.formType === dependency.formType);
              if (depForm && !forms.includes(depForm)) {
                forms.push(depForm);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Error evaluating form ${form.formCode}:`, error);
      }
    }

    // Remove duplicates
    const uniqueForms = Array.from(new Set(forms.map((f) => f.formType))).map(
      (type) => forms.find((f) => f.formType === type)!,
    );

    return uniqueForms;
  }

  /**
   * Calculate total filing fees for a form bundle
   */
  public static calculateTotalFees(forms: KenyanFormType[], court: CourtJurisdiction): number {
    return forms.reduce((total, form) => {
      return total + form.getEstimatedCost(court);
    }, 0);
  }

  /**
   * Generate filing sequence (order of submission)
   */
  public static generateFilingSequence(forms: KenyanFormType[]): KenyanFormType[] {
    // Define priority categories
    const categoryOrder = [
      FormCategory.PRIMARY_PETITION,
      FormCategory.SUPPORTING_AFFIDAVIT,
      FormCategory.CONSENT,
      FormCategory.GUARANTEE,
      FormCategory.NOTICE,
      FormCategory.SCHEDULE,
      FormCategory.CUSTOMARY,
      FormCategory.ISLAMIC,
      FormCategory.DISTRIBUTION,
      FormCategory.COURT_ORDER,
    ];

    return [...forms].sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      // Same category, sort by isRequired
      if (a.isRequired !== b.isRequired) {
        return a.isRequired ? -1 : 1;
      }

      // Same required status, sort by form code
      return a.formCode.localeCompare(b.formCode);
    });
  }

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    return {
      formType: this.props.formType,
      formCode: this.props.formCode,
      displayName: this.props.displayName,
      description: this.props.description,
      legalBasis: this.props.legalBasis,
      category: this.props.category,
      isRequired: this.props.isRequired,
      applicableCourts: this.props.applicableCourts,
      applicableRegimes: this.props.applicableRegimes,
      estimatedPages: this.props.estimatedPages,
      requiresNotarization: this.props.requiresNotarization,
      requiresCommissionerOaths: this.props.requiresCommissionerOaths,
      requiresCourtStamp: this.props.requiresCourtStamp,
      filingFee: this.props.filingFee,
      timeToComplete: this.props.timeToComplete,
      prerequisites: this.props.prerequisites,
      dependencies: this.props.dependencies,
      conditionalLogic: this.props.conditionalLogic,
      courtSpecificInstructions: this.props.courtSpecificInstructions,
      version: this.props.version,
      lastUpdated: this.props.lastUpdated.toISOString(),

      // Derived properties for convenience
      requirementsSummary: this.getRequirementsSummary(),
      timelineEstimate: this.getTimelineEstimate(),
      isPrimaryPetition: this.category === FormCategory.PRIMARY_PETITION,
    };
  }

  public static fromJSON(json: Record<string, any>): KenyanFormType {
    // Parse courtSpecificInstructions
    const courtSpecificInstructions = json.courtSpecificInstructions
      ? Object.entries(json.courtSpecificInstructions).reduce(
          (acc, [key, value]) => {
            acc[key as CourtJurisdiction] = value as string;
            return acc;
          },
          {} as Partial<Record<CourtJurisdiction, string>>,
        )
      : undefined;

    return new KenyanFormType({
      formType: json.formType as KenyanFormTypeEnum,
      formCode: json.formCode,
      displayName: json.displayName,
      description: json.description,
      legalBasis: json.legalBasis,
      category: json.category as FormCategory,
      isRequired: json.isRequired,
      applicableCourts: json.applicableCourts as CourtJurisdiction[],
      applicableRegimes: json.applicableRegimes as SuccessionRegime[],
      estimatedPages: json.estimatedPages,
      requiresNotarization: json.requiresNotarization,
      requiresCommissionerOaths: json.requiresCommissionerOaths,
      requiresCourtStamp: json.requiresCourtStamp,
      filingFee: json.filingFee,
      timeToComplete: json.timeToComplete,
      prerequisites: json.prerequisites as FormPrerequisite[],
      dependencies: json.dependencies as FormDependency[],
      conditionalLogic: json.conditionalLogic,
      courtSpecificInstructions,
      version: json.version,
      lastUpdated: new Date(json.lastUpdated),
    });
  }
}
