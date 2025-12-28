// src/succession-automation/src/domain/value-objects/kenyan-form-type.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Kenyan Form Type Value Object
 *
 * PURPOSE: Represents the specific P&A (Probate & Administration) forms
 * required under Kenyan succession law.
 *
 * LEGAL CONTEXT:
 * Each form serves a specific purpose in the succession process:
 * - P&A 1: Petition for Grant of Probate (Testate - with Will)
 * - P&A 5: Petition for Summary Administration (Small estates < KES 500k)
 * - P&A 80: Petition for Letters of Administration (Intestate - no Will)
 * - P&A 12: Affidavit of Means (Financial capacity of applicant)
 * - P&A 38: Consent Form (Beneficiaries/Family consent)
 * - P&A 57: Guarantee Form (Surety bond for administrator)
 * - Chief's Letter: Customary requirement for intestate cases
 *
 * FORM SELECTION LOGIC:
 * The system automatically selects forms based on SuccessionContext:
 * - Testate → P&A 1
 * - Intestate → P&A 80 + Chief's Letter
 * - Islamic → Modified forms for Kadhi's Court
 * - Estate < KES 500k → P&A 5 (simplified)
 */

export enum KenyanFormTypeEnum {
  // Primary Petitions
  PA1_PETITION = 'PA1_PETITION', // Grant of Probate (Testate)
  PA5_PETITION_SUMMARY = 'PA5_PETITION_SUMMARY', // Summary Administration (Small estates)
  PA80_PETITION_INTESTATE = 'PA80_PETITION_INTESTATE', // Letters of Administration (Intestate)

  // Supporting Documents
  PA12_AFFIDAVIT_MEANS = 'PA12_AFFIDAVIT_MEANS', // Financial capacity
  PA38_CONSENT = 'PA38_CONSENT', // Family consent
  PA57_GUARANTEE = 'PA57_GUARANTEE', // Surety bond

  // Customary Documents
  CHIEFS_LETTER_TEMPLATE = 'CHIEFS_LETTER_TEMPLATE', // Template for Chief's letter

  // Islamic-Specific (Kadhi's Court)
  ISLAMIC_PETITION = 'ISLAMIC_PETITION',
  ISLAMIC_CONSENT = 'ISLAMIC_CONSENT',

  // Additional Documents
  AFFIDAVIT_DUE_EXECUTION = 'AFFIDAVIT_DUE_EXECUTION', // Will execution verification
  NOTICE_TO_CREDITORS = 'NOTICE_TO_CREDITORS', // Public notice
  INVENTORY_ASSETS = 'INVENTORY_ASSETS', // Asset schedule

  // Court Orders (Templates)
  GRANT_OF_PROBATE = 'GRANT_OF_PROBATE',
  LETTERS_OF_ADMINISTRATION = 'LETTERS_OF_ADMINISTRATION',
}

interface KenyanFormTypeProps {
  formType: KenyanFormTypeEnum;
  displayName: string;
  description: string;
  legalBasis: string;
  isRequired: boolean; // Mandatory vs optional
  courtType: 'HIGH_COURT' | 'MAGISTRATE' | 'KADHIS_COURT' | 'ANY';
  applicableRegimes: string[]; // Which succession regimes need this?
  estimatedPages: number;
  requiresNotarization: boolean;
  requiresCourtStamp: boolean;
  filingFee?: number; // KES amount
}

export class KenyanFormType extends ValueObject<KenyanFormTypeProps> {
  private constructor(props: KenyanFormTypeProps) {
    super(props);
  }

  protected validate(): void {
    const { formType, displayName, description, legalBasis, estimatedPages } = this.props;

    if (!Object.values(KenyanFormTypeEnum).includes(formType)) {
      throw new ValueObjectValidationError(`Invalid KenyanFormTypeEnum: ${formType}`, 'formType');
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

    if (this.props.applicableRegimes.length === 0) {
      throw new ValueObjectValidationError(
        'At least one applicable regime is required',
        'applicableRegimes',
      );
    }
  }

  // ==================== GETTERS ====================

  get formType(): KenyanFormTypeEnum {
    return this.props.formType;
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

  get isRequired(): boolean {
    return this.props.isRequired;
  }

  get courtType(): string {
    return this.props.courtType;
  }

  get applicableRegimes(): string[] {
    return [...this.props.applicableRegimes];
  }

  get estimatedPages(): number {
    return this.props.estimatedPages;
  }

  get requiresNotarization(): boolean {
    return this.props.requiresNotarization;
  }

  get requiresCourtStamp(): boolean {
    return this.props.requiresCourtStamp;
  }

  get filingFee(): number | undefined {
    return this.props.filingFee;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Is this a primary petition (vs supporting document)?
   */
  public isPrimaryPetition(): boolean {
    return [
      KenyanFormTypeEnum.PA1_PETITION,
      KenyanFormTypeEnum.PA5_PETITION_SUMMARY,
      KenyanFormTypeEnum.PA80_PETITION_INTESTATE,
      KenyanFormTypeEnum.ISLAMIC_PETITION,
    ].includes(this.props.formType);
  }

  /**
   * Is this form applicable for a specific succession regime?
   */
  public isApplicableForRegime(regime: string): boolean {
    return (
      this.props.applicableRegimes.includes(regime) || this.props.applicableRegimes.includes('ALL')
    );
  }

  /**
   * Can this form be used in the specified court?
   */
  public isValidForCourt(courtType: string): boolean {
    return this.props.courtType === 'ANY' || this.props.courtType === courtType;
  }

  /**
   * Get form code (e.g., "P&A 1")
   */
  public getFormCode(): string {
    const codeMap: Record<KenyanFormTypeEnum, string> = {
      [KenyanFormTypeEnum.PA1_PETITION]: 'P&A 1',
      [KenyanFormTypeEnum.PA5_PETITION_SUMMARY]: 'P&A 5',
      [KenyanFormTypeEnum.PA80_PETITION_INTESTATE]: 'P&A 80',
      [KenyanFormTypeEnum.PA12_AFFIDAVIT_MEANS]: 'P&A 12',
      [KenyanFormTypeEnum.PA38_CONSENT]: 'P&A 38',
      [KenyanFormTypeEnum.PA57_GUARANTEE]: 'P&A 57',
      [KenyanFormTypeEnum.CHIEFS_LETTER_TEMPLATE]: "Chief's Letter",
      [KenyanFormTypeEnum.ISLAMIC_PETITION]: 'Islamic Petition',
      [KenyanFormTypeEnum.ISLAMIC_CONSENT]: 'Islamic Consent',
      [KenyanFormTypeEnum.AFFIDAVIT_DUE_EXECUTION]: 'Affidavit of Due Execution',
      [KenyanFormTypeEnum.NOTICE_TO_CREDITORS]: 'Notice to Creditors',
      [KenyanFormTypeEnum.INVENTORY_ASSETS]: 'Inventory of Assets',
      [KenyanFormTypeEnum.GRANT_OF_PROBATE]: 'Grant of Probate',
      [KenyanFormTypeEnum.LETTERS_OF_ADMINISTRATION]: 'Letters of Administration',
    };
    return codeMap[this.props.formType] || this.props.formType;
  }

  // ==================== FACTORY METHODS (Pre-defined Forms) ====================

  /**
   * P&A 1: Petition for Grant of Probate (Testate)
   */
  public static createPA1Petition(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.PA1_PETITION,
      displayName: 'Petition for Grant of Probate',
      description: 'Primary form for applying for Grant of Probate when deceased left a valid Will',
      legalBasis: 'S.56 LSA - Application for Grant of Probate',
      isRequired: true,
      courtType: 'HIGH_COURT',
      applicableRegimes: ['TESTATE'],
      estimatedPages: 4,
      requiresNotarization: false,
      requiresCourtStamp: true,
      filingFee: 1000,
    });
  }

  /**
   * P&A 5: Petition for Summary Administration (Small estates)
   */
  public static createPA5PetitionSummary(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.PA5_PETITION_SUMMARY,
      displayName: 'Petition for Summary Administration',
      description: 'Simplified form for small estates (value < KES 500,000)',
      legalBasis: 'S.79 LSA - Summary Administration for small estates',
      isRequired: true,
      courtType: 'MAGISTRATE',
      applicableRegimes: ['TESTATE', 'INTESTATE'],
      estimatedPages: 2,
      requiresNotarization: false,
      requiresCourtStamp: true,
      filingFee: 500,
    });
  }

  /**
   * P&A 80: Petition for Letters of Administration (Intestate)
   */
  public static createPA80PetitionIntestate(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.PA80_PETITION_INTESTATE,
      displayName: 'Petition for Letters of Administration',
      description: 'Primary form for intestate succession (no Will)',
      legalBasis: 'S.56 LSA - Application for Letters of Administration',
      isRequired: true,
      courtType: 'HIGH_COURT',
      applicableRegimes: ['INTESTATE'],
      estimatedPages: 3,
      requiresNotarization: false,
      requiresCourtStamp: true,
      filingFee: 1000,
    });
  }

  /**
   * P&A 12: Affidavit of Means
   */
  public static createPA12AffidavitMeans(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.PA12_AFFIDAVIT_MEANS,
      displayName: 'Affidavit of Means',
      description: "Declaration of applicant's financial capacity",
      legalBasis: 'Court Practice Direction - Financial disclosure',
      isRequired: false,
      courtType: 'ANY',
      applicableRegimes: ['ALL'],
      estimatedPages: 1,
      requiresNotarization: true,
      requiresCourtStamp: false,
      filingFee: 0,
    });
  }

  /**
   * P&A 38: Consent Form
   */
  public static createPA38Consent(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.PA38_CONSENT,
      displayName: 'Consent Form',
      description: 'Family members and beneficiaries consent to the application',
      legalBasis: 'S.56 LSA - Consent of beneficiaries',
      isRequired: true,
      courtType: 'ANY',
      applicableRegimes: ['ALL'],
      estimatedPages: 1,
      requiresNotarization: false,
      requiresCourtStamp: false,
      filingFee: 0,
    });
  }

  /**
   * P&A 57: Guarantee Form
   */
  public static createPA57Guarantee(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.PA57_GUARANTEE,
      displayName: 'Guarantee Form',
      description: 'Surety bond guaranteeing proper administration',
      legalBasis: 'S.72 LSA - Security by administrator',
      isRequired: false,
      courtType: 'ANY',
      applicableRegimes: ['INTESTATE'],
      estimatedPages: 2,
      requiresNotarization: true,
      requiresCourtStamp: true,
      filingFee: 0,
    });
  }

  /**
   * Chief's Letter Template
   */
  public static createChiefsLetterTemplate(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.CHIEFS_LETTER_TEMPLATE,
      displayName: 'Letter from Area Chief',
      description: 'Customary verification of family structure and next of kin',
      legalBasis: 'Customary requirement for intestate cases',
      isRequired: true,
      courtType: 'ANY',
      applicableRegimes: ['INTESTATE'],
      estimatedPages: 1,
      requiresNotarization: false,
      requiresCourtStamp: false,
      filingFee: 0,
    });
  }

  /**
   * Islamic Petition (Kadhi's Court)
   */
  public static createIslamicPetition(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.ISLAMIC_PETITION,
      displayName: 'Islamic Succession Petition',
      description: "Petition for succession under Islamic law (Kadhi's Court)",
      legalBasis: "Article 170 Constitution - Kadhi's Court jurisdiction",
      isRequired: true,
      courtType: 'KADHIS_COURT',
      applicableRegimes: ['TESTATE', 'INTESTATE'],
      estimatedPages: 3,
      requiresNotarization: false,
      requiresCourtStamp: true,
      filingFee: 1000,
    });
  }

  /**
   * Affidavit of Due Execution (Will verification)
   */
  public static createAffidavitDueExecution(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.AFFIDAVIT_DUE_EXECUTION,
      displayName: 'Affidavit of Due Execution',
      description: 'Witness affidavit confirming proper execution of Will',
      legalBasis: 'S.11 LSA - Proof of Will execution',
      isRequired: true,
      courtType: 'ANY',
      applicableRegimes: ['TESTATE'],
      estimatedPages: 2,
      requiresNotarization: true,
      requiresCourtStamp: false,
      filingFee: 0,
    });
  }

  /**
   * Notice to Creditors
   */
  public static createNoticeToCreditors(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.NOTICE_TO_CREDITORS,
      displayName: 'Notice to Creditors',
      description: 'Public notice inviting creditors to submit claims',
      legalBasis: 'S.45 LSA - Settlement of debts',
      isRequired: true,
      courtType: 'ANY',
      applicableRegimes: ['ALL'],
      estimatedPages: 1,
      requiresNotarization: false,
      requiresCourtStamp: false,
      filingFee: 0,
    });
  }

  /**
   * Inventory of Assets
   */
  public static createInventoryAssets(): KenyanFormType {
    return new KenyanFormType({
      formType: KenyanFormTypeEnum.INVENTORY_ASSETS,
      displayName: 'Inventory of Assets',
      description: 'Detailed schedule of all estate assets and liabilities',
      legalBasis: 'S.83 LSA - Executor duties',
      isRequired: true,
      courtType: 'ANY',
      applicableRegimes: ['ALL'],
      estimatedPages: 3,
      requiresNotarization: false,
      requiresCourtStamp: false,
      filingFee: 0,
    });
  }

  /**
   * Generic factory
   */
  public static create(props: KenyanFormTypeProps): KenyanFormType {
    return new KenyanFormType(props);
  }

  // ==================== FORM SELECTION LOGIC ====================

  /**
   * Get all forms required for a specific succession context
   * This is the core logic used by FormStrategyService
   */
  public static getRequiredFormsForContext(
    regime: string,
    religion: string,
    estateValueKES: number,
    hasMinors: boolean,
  ): KenyanFormType[] {
    const forms: KenyanFormType[] = [];

    // Islamic cases → Kadhi's Court
    if (religion === 'ISLAMIC') {
      forms.push(KenyanFormType.createIslamicPetition());
      forms.push(KenyanFormType.createPA38Consent());
      forms.push(KenyanFormType.createInventoryAssets());
      return forms;
    }

    // Small estates → Summary Administration
    if (estateValueKES < 500_000) {
      forms.push(KenyanFormType.createPA5PetitionSummary());
      forms.push(KenyanFormType.createPA38Consent());
      forms.push(KenyanFormType.createInventoryAssets());
      return forms;
    }

    // Testate (with Will)
    if (regime === 'TESTATE') {
      forms.push(KenyanFormType.createPA1Petition());
      forms.push(KenyanFormType.createAffidavitDueExecution());
      forms.push(KenyanFormType.createPA38Consent());
      forms.push(KenyanFormType.createInventoryAssets());
      forms.push(KenyanFormType.createNoticeToCreditors());
      return forms;
    }

    // Intestate (no Will)
    if (regime === 'INTESTATE') {
      forms.push(KenyanFormType.createPA80PetitionIntestate());
      forms.push(KenyanFormType.createChiefsLetterTemplate());
      forms.push(KenyanFormType.createPA38Consent());
      forms.push(KenyanFormType.createPA57Guarantee()); // Often required
      forms.push(KenyanFormType.createInventoryAssets());
      forms.push(KenyanFormType.createNoticeToCreditors());
      return forms;
    }

    return forms;
  }

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    return {
      formType: this.props.formType,
      formCode: this.getFormCode(),
      displayName: this.props.displayName,
      description: this.props.description,
      legalBasis: this.props.legalBasis,
      isRequired: this.props.isRequired,
      courtType: this.props.courtType,
      applicableRegimes: this.props.applicableRegimes,
      estimatedPages: this.props.estimatedPages,
      requiresNotarization: this.props.requiresNotarization,
      requiresCourtStamp: this.props.requiresCourtStamp,
      filingFee: this.props.filingFee,
      // Derived
      isPrimaryPetition: this.isPrimaryPetition(),
    };
  }

  public static fromJSON(json: Record<string, any>): KenyanFormType {
    return new KenyanFormType({
      formType: json.formType as KenyanFormTypeEnum,
      displayName: json.displayName,
      description: json.description,
      legalBasis: json.legalBasis,
      isRequired: json.isRequired,
      courtType: json.courtType,
      applicableRegimes: json.applicableRegimes,
      estimatedPages: json.estimatedPages,
      requiresNotarization: json.requiresNotarization,
      requiresCourtStamp: json.requiresCourtStamp,
      filingFee: json.filingFee,
    });
  }
}
