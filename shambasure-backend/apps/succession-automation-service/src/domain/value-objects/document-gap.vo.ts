// src/succession-automation/src/domain/value-objects/document-gap.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Document Gap Value Object
 *
 * PURPOSE: Represents a missing or invalid document that blocks the filing.
 * This is a TRANSIENT value object (not stored in DB).
 * It's calculated on-the-fly during readiness assessment.
 *
 * LEGAL CONTEXT:
 * The "Fatal 10" includes several document-based blockers:
 * 1. Missing Death Certificate (CRITICAL)
 * 2. Missing Letter from Chief (INTESTATE cases only)
 * 3. Missing Consent Forms (P&A 38)
 * 4. Invalid Will signatures (< 2 witnesses)
 * 5. Missing KRA PIN for deceased
 *
 * Each gap has:
 * - A unique type (e.g., "DEATH_CERT")
 * - A severity (CRITICAL, HIGH, MEDIUM)
 * - Instructions on how to obtain it
 * - Legal basis (which section requires it)
 */

export enum DocumentGapType {
  // Critical Identity Documents
  DEATH_CERTIFICATE = 'DEATH_CERTIFICATE',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  NATIONAL_ID = 'NATIONAL_ID',

  // Succession-Specific Documents
  CHIEF_LETTER = 'CHIEF_LETTER', // Required for Intestate cases
  MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
  DIVORCE_DECREE = 'DIVORCE_DECREE',

  // Will-Related Documents
  ORIGINAL_WILL = 'ORIGINAL_WILL',
  WITNESS_ID = 'WITNESS_ID',
  EXECUTOR_CONSENT = 'EXECUTOR_CONSENT',

  // Tax & Financial Documents
  KRA_PIN_CERTIFICATE = 'KRA_PIN_CERTIFICATE',
  TAX_CLEARANCE = 'TAX_CLEARANCE',
  BANK_STATEMENT = 'BANK_STATEMENT',

  // Asset Documents
  TITLE_DEED = 'TITLE_DEED',
  VALUATION_REPORT = 'VALUATION_REPORT',
  VEHICLE_LOGBOOK = 'VEHICLE_LOGBOOK',

  // Consent & Affidavits
  FAMILY_CONSENT = 'FAMILY_CONSENT', // P&A 38
  AFFIDAVIT_OF_MEANS = 'AFFIDAVIT_OF_MEANS', // P&A 12
  GUARANTEE = 'GUARANTEE', // P&A 57

  // Guardianship Documents
  GUARDIANSHIP_ORDER = 'GUARDIANSHIP_ORDER',
  COURT_ORDER = 'COURT_ORDER',

  // Other
  OTHER = 'OTHER',
}

export enum DocumentGapSeverity {
  CRITICAL = 'CRITICAL', // Blocks filing entirely
  HIGH = 'HIGH', // Will likely cause rejection
  MEDIUM = 'MEDIUM', // May cause queries
  LOW = 'LOW', // Good to have
}

interface DocumentGapProps {
  type: DocumentGapType;
  severity: DocumentGapSeverity;
  description: string;
  legalBasis?: string; // E.g., "S.56 LSA requires..."
  obtainingInstructions: string; // How to get this document
  estimatedTimeDays: number; // How long to obtain
  alternativeOptions?: string; // If any (e.g., "Court affidavit in lieu")
  isWaivable: boolean; // Can court waive this?
}

export class DocumentGap extends ValueObject<DocumentGapProps> {
  private constructor(props: DocumentGapProps) {
    super(props);
  }

  protected validate(): void {
    const { type, severity, description, obtainingInstructions, estimatedTimeDays } = this.props;

    if (!Object.values(DocumentGapType).includes(type)) {
      throw new ValueObjectValidationError(`Invalid DocumentGapType: ${type}`, 'type');
    }

    if (!Object.values(DocumentGapSeverity).includes(severity)) {
      throw new ValueObjectValidationError(`Invalid DocumentGapSeverity: ${severity}`, 'severity');
    }

    if (!description || description.trim().length === 0) {
      throw new ValueObjectValidationError('Description is required', 'description');
    }

    if (!obtainingInstructions || obtainingInstructions.trim().length === 0) {
      throw new ValueObjectValidationError(
        'Obtaining instructions are required',
        'obtainingInstructions',
      );
    }

    if (estimatedTimeDays < 0) {
      throw new ValueObjectValidationError(
        'Estimated time cannot be negative',
        'estimatedTimeDays',
      );
    }

    // BUSINESS RULE: CRITICAL gaps cannot be waivable
    if (severity === DocumentGapSeverity.CRITICAL && this.props.isWaivable) {
      throw new ValueObjectValidationError(
        'Critical document gaps cannot be waivable',
        'isWaivable',
      );
    }
  }

  // ==================== GETTERS ====================

  get type(): DocumentGapType {
    return this.props.type;
  }

  get severity(): DocumentGapSeverity {
    return this.props.severity;
  }

  get description(): string {
    return this.props.description;
  }

  get legalBasis(): string | undefined {
    return this.props.legalBasis;
  }

  get obtainingInstructions(): string {
    return this.props.obtainingInstructions;
  }

  get estimatedTimeDays(): number {
    return this.props.estimatedTimeDays;
  }

  get alternativeOptions(): string | undefined {
    return this.props.alternativeOptions;
  }

  get isWaivable(): boolean {
    return this.props.isWaivable;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Is this a blocking gap?
   */
  public isBlocking(): boolean {
    return this.props.severity === DocumentGapSeverity.CRITICAL;
  }

  /**
   * Can this gap be resolved quickly (< 7 days)?
   */
  public isQuickFix(): boolean {
    return this.props.estimatedTimeDays <= 7;
  }

  /**
   * Get a prioritized sort order (for UI lists)
   */
  public getPriorityScore(): number {
    const severityScores = {
      [DocumentGapSeverity.CRITICAL]: 100,
      [DocumentGapSeverity.HIGH]: 75,
      [DocumentGapSeverity.MEDIUM]: 50,
      [DocumentGapSeverity.LOW]: 25,
    };

    return severityScores[this.props.severity];
  }

  /**
   * Get a user-friendly urgency message
   */
  public getUrgencyMessage(): string {
    if (this.isBlocking()) {
      return `⛔ CRITICAL: You cannot file without this document.`;
    }

    if (this.props.severity === DocumentGapSeverity.HIGH) {
      return `⚠️ HIGH PRIORITY: Filing without this will likely cause rejection.`;
    }

    if (this.props.severity === DocumentGapSeverity.MEDIUM) {
      return `⚡ RECOMMENDED: Filing without this may cause delays.`;
    }

    return `💡 OPTIONAL: Having this will strengthen your case.`;
  }

  // ==================== FACTORY METHODS (Pre-defined Gaps) ====================

  /**
   * CRITICAL: Missing Death Certificate
   */
  public static createDeathCertificateGap(): DocumentGap {
    return new DocumentGap({
      type: DocumentGapType.DEATH_CERTIFICATE,
      severity: DocumentGapSeverity.CRITICAL,
      description: 'Death Certificate is missing',
      legalBasis: 'S.56 LSA - Death Certificate is mandatory for all succession cases',
      obtainingInstructions:
        '1. Visit the Civil Registration Office where death was registered\n' +
        '2. Bring your National ID and KES 50 fee\n' +
        '3. Processing takes 1-3 days',
      estimatedTimeDays: 3,
      alternativeOptions:
        'If death occurred outside Kenya, obtain a certified copy from that country and have it apostilled',
      isWaivable: false,
    });
  }

  /**
   * CRITICAL: Missing Chief's Letter (Intestate cases only)
   */
  public static createChiefLetterGap(): DocumentGap {
    return new DocumentGap({
      type: DocumentGapType.CHIEF_LETTER,
      severity: DocumentGapSeverity.CRITICAL,
      description: 'Letter from Area Chief confirming next of kin',
      legalBasis: 'Customary requirement for Intestate cases - confirms family structure',
      obtainingInstructions:
        "1. Visit the Chief's office in the deceased's home area\n" +
        '2. Bring Death Certificate and National IDs of family members\n' +
        '3. Chief will verify family tree with local elders\n' +
        '4. Letter issued within 7-14 days',
      estimatedTimeDays: 10,
      alternativeOptions: 'If Chief is unavailable, Assistant Chief or DO can issue the letter',
      isWaivable: false,
    });
  }

  /**
   * CRITICAL: Missing KRA PIN
   */
  public static createKraPinGap(): DocumentGap {
    return new DocumentGap({
      type: DocumentGapType.KRA_PIN_CERTIFICATE,
      severity: DocumentGapSeverity.CRITICAL,
      description: 'KRA PIN Certificate for deceased is missing',
      legalBasis: 'Tax Procedures Act - Required for all estate valuations',
      obtainingInstructions:
        '1. Visit iTax portal (www.itax.kra.go.ke)\n' +
        "2. Download PIN certificate using deceased's details\n" +
        '3. If deceased had no PIN, apply for posthumous PIN with Death Certificate',
      estimatedTimeDays: 1,
      alternativeOptions: 'Court affidavit explaining why PIN was never obtained',
      isWaivable: false,
    });
  }

  /**
   * HIGH: Missing Will (for Testate cases)
   */
  public static createOriginalWillGap(): DocumentGap {
    return new DocumentGap({
      type: DocumentGapType.ORIGINAL_WILL,
      severity: DocumentGapSeverity.CRITICAL,
      description: 'Original Will document is missing',
      legalBasis: 'S.11 LSA - Original Will must be produced for Grant of Probate',
      obtainingInstructions:
        '1. Check with lawyer who drafted it\n' +
        '2. Check safe deposit boxes\n' +
        '3. Check with named Executor\n' +
        '4. If lost, file affidavit explaining circumstances',
      estimatedTimeDays: 14,
      alternativeOptions:
        'If Will is lost, court may accept certified copy with affidavit explaining loss',
      isWaivable: true,
    });
  }

  /**
   * HIGH: Missing Marriage Certificate (for spouse claims)
   */
  public static createMarriageCertificateGap(): DocumentGap {
    return new DocumentGap({
      type: DocumentGapType.MARRIAGE_CERTIFICATE,
      severity: DocumentGapSeverity.HIGH,
      description: 'Marriage Certificate is missing',
      legalBasis: 'S.35 LSA - Spouse must prove marriage to claim share',
      obtainingInstructions:
        "1. Visit the Registrar of Marriages (AG's Chambers)\n" +
        '2. Request certified copy with marriage registration number\n' +
        '3. Fee: KES 1,000\n' +
        '4. Processing: 3-7 days',
      estimatedTimeDays: 7,
      alternativeOptions: 'If customary marriage, provide affidavits from elders and family',
      isWaivable: true,
    });
  }

  /**
   * MEDIUM: Missing Valuation Report (for high-value assets)
   */
  public static createValuationReportGap(): DocumentGap {
    return new DocumentGap({
      type: DocumentGapType.VALUATION_REPORT,
      severity: DocumentGapSeverity.MEDIUM,
      description: 'Professional valuation report for assets',
      legalBasis: 'Court Practice Direction - Required for estates > KES 5M',
      obtainingInstructions:
        '1. Hire a registered valuer (list available from Valuers Registration Board)\n' +
        '2. Valuer inspects property\n' +
        '3. Report issued within 14-21 days\n' +
        '4. Cost: KES 20,000 - 50,000 depending on assets',
      estimatedTimeDays: 21,
      alternativeOptions: 'For lower-value estates, sworn affidavit of value may suffice',
      isWaivable: true,
    });
  }

  /**
   * Generic factory
   */
  public static create(props: DocumentGapProps): DocumentGap {
    return new DocumentGap(props);
  }

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    return {
      type: this.props.type,
      severity: this.props.severity,
      description: this.props.description,
      legalBasis: this.props.legalBasis,
      obtainingInstructions: this.props.obtainingInstructions,
      estimatedTimeDays: this.props.estimatedTimeDays,
      alternativeOptions: this.props.alternativeOptions,
      isWaivable: this.props.isWaivable,
      // Derived properties
      isBlocking: this.isBlocking(),
      isQuickFix: this.isQuickFix(),
      priorityScore: this.getPriorityScore(),
      urgencyMessage: this.getUrgencyMessage(),
    };
  }
  /**
   * Reconstitute from persisted data
   * Use this for reconstituting from database JSON
   */
  public static reconstitute(json: Record<string, any>): DocumentGap {
    return new DocumentGap({
      type: json.type as DocumentGapType,
      severity: json.severity as DocumentGapSeverity,
      description: json.description,
      legalBasis: json.legalBasis,
      obtainingInstructions: json.obtainingInstructions,
      estimatedTimeDays: json.estimatedTimeDays,
      alternativeOptions: json.alternativeOptions,
      isWaivable: json.isWaivable,
    });
  }
  /**
   * Deserialize from JSON
   */
  public static fromJSON(json: Record<string, any>): DocumentGap {
    return new DocumentGap({
      type: json.type as DocumentGapType,
      severity: json.severity as DocumentGapSeverity,
      description: json.description,
      legalBasis: json.legalBasis,
      obtainingInstructions: json.obtainingInstructions,
      estimatedTimeDays: json.estimatedTimeDays,
      alternativeOptions: json.alternativeOptions,
      isWaivable: json.isWaivable,
    });
  }
}
