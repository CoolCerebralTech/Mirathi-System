// src/succession-automation/src/domain/entities/risk-flag.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { DocumentGap } from '../value-objects/document-gap.vo';
import { RiskSource } from '../value-objects/risk-source.vo';

/**
 * Risk Flag Entity
 *
 * PURPOSE: Represents a specific legal risk detected in the succession case.
 * Owned by: ReadinessAssessment Aggregate
 *
 * LEGAL CONTEXT:
 * Each risk corresponds to a rule in Kenyan succession law:
 * - CRITICAL: Blockers (e.g., no Death Cert, minor without guardian)
 * - HIGH: Likely court rejection (e.g., disputed asset, wrong jurisdiction)
 * - MEDIUM: May cause queries (e.g., missing bank statements)
 * - LOW: Good practice (e.g., incomplete beneficiary details)
 *
 * LIFECYCLE:
 * 1. Created when detected by ComplianceEngine
 * 2. Resolved when underlying issue is fixed (via domain events)
 * 3. Never deleted (audit trail) - just marked as resolved
 *
 * TRACEABILITY:
 * - source: Where did this risk come from?
 * - legalBasis: Which law section?
 * - mitigationSteps: What must the user do?
 */

export enum RiskSeverity {
  CRITICAL = 'CRITICAL', // Cannot file (e.g., no Death Cert)
  HIGH = 'HIGH', // Likely court rejection
  MEDIUM = 'MEDIUM', // May cause queries
  LOW = 'LOW', // Best practice warning
}

export enum RiskCategory {
  // Document Issues
  MISSING_DOCUMENT = 'MISSING_DOCUMENT',
  INVALID_DOCUMENT = 'INVALID_DOCUMENT',
  EXPIRED_DOCUMENT = 'EXPIRED_DOCUMENT',

  // Family Structure Issues
  MINOR_WITHOUT_GUARDIAN = 'MINOR_WITHOUT_GUARDIAN',
  UNDEFINED_POLYGAMOUS_STRUCTURE = 'UNDEFINED_POLYGAMOUS_STRUCTURE',
  DISPUTED_RELATIONSHIP = 'DISPUTED_RELATIONSHIP',
  COHABITATION_CLAIM = 'COHABITATION_CLAIM',

  // Estate Issues
  ASSET_VERIFICATION_FAILED = 'ASSET_VERIFICATION_FAILED',
  INSOLVENT_ESTATE = 'INSOLVENT_ESTATE',
  MISSING_ASSET_VALUATION = 'MISSING_ASSET_VALUATION',
  ENCUMBERED_ASSET = 'ENCUMBERED_ASSET',

  // Will Issues
  INVALID_WILL_SIGNATURE = 'INVALID_WILL_SIGNATURE',
  MINOR_EXECUTOR = 'MINOR_EXECUTOR',
  BENEFICIARY_AS_WITNESS = 'BENEFICIARY_AS_WITNESS',
  CONTESTED_WILL = 'CONTESTED_WILL',

  // Jurisdiction Issues
  WRONG_COURT = 'WRONG_COURT',
  NON_RESIDENT_APPLICANT = 'NON_RESIDENT_APPLICANT',

  // Tax & Compliance
  TAX_CLEARANCE_MISSING = 'TAX_CLEARANCE_MISSING',
  KRA_PIN_MISSING = 'KRA_PIN_MISSING',

  // Other
  FAMILY_DISPUTE = 'FAMILY_DISPUTE',
  OTHER = 'OTHER',
}

interface RiskFlagProps {
  severity: RiskSeverity;
  category: RiskCategory;
  description: string;
  source: RiskSource;
  legalBasis?: string; // E.g., "S.71 Children Act"
  mitigationSteps: string[]; // What to do to fix this
  documentGap?: DocumentGap; // If this is a document-related risk
  affectedEntityIds: string[]; // FamilyMember IDs, Asset IDs, etc.
  isResolved: boolean;
  resolvedAt?: Date;
  resolutionNotes?: string;
  autoResolvable: boolean; // Can be resolved by listening to events?
}

export class RiskFlag extends Entity<RiskFlagProps> {
  private constructor(id: UniqueEntityID, props: RiskFlagProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // ==================== GETTERS ====================

  get severity(): RiskSeverity {
    return this.props.severity;
  }

  get category(): RiskCategory {
    return this.props.category;
  }

  get description(): string {
    return this.props.description;
  }

  get source(): RiskSource {
    return this.props.source;
  }

  get legalBasis(): string | undefined {
    return this.props.legalBasis;
  }

  get mitigationSteps(): string[] {
    return [...this.props.mitigationSteps]; // Return copy for immutability
  }

  get documentGap(): DocumentGap | undefined {
    return this.props.documentGap;
  }

  get affectedEntityIds(): string[] {
    return [...this.props.affectedEntityIds];
  }

  get isResolved(): boolean {
    return this.props.isResolved;
  }

  get resolvedAt(): Date | undefined {
    return this.props.resolvedAt;
  }

  get resolutionNotes(): string | undefined {
    return this.props.resolutionNotes;
  }

  get autoResolvable(): boolean {
    return this.props.autoResolvable;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Is this risk blocking the case?
   */
  public isBlocking(): boolean {
    return this.props.severity === RiskSeverity.CRITICAL && !this.props.isResolved;
  }

  /**
   * Is this risk related to a missing document?
   */
  public isDocumentRelated(): boolean {
    return [
      RiskCategory.MISSING_DOCUMENT,
      RiskCategory.INVALID_DOCUMENT,
      RiskCategory.EXPIRED_DOCUMENT,
    ].includes(this.props.category);
  }

  /**
   * Is this risk related to family structure?
   */
  public isFamilyRelated(): boolean {
    return [
      RiskCategory.MINOR_WITHOUT_GUARDIAN,
      RiskCategory.UNDEFINED_POLYGAMOUS_STRUCTURE,
      RiskCategory.DISPUTED_RELATIONSHIP,
      RiskCategory.COHABITATION_CLAIM,
    ].includes(this.props.category);
  }

  /**
   * Get a unique fingerprint for this risk (to avoid duplicates)
   */
  public getFingerprint(): string {
    return `${this.props.category}:${this.props.source.getFingerprint()}`;
  }

  /**
   * Get priority score for sorting (higher = more urgent)
   */
  public getPriorityScore(): number {
    const severityScores = {
      [RiskSeverity.CRITICAL]: 100,
      [RiskSeverity.HIGH]: 75,
      [RiskSeverity.MEDIUM]: 50,
      [RiskSeverity.LOW]: 25,
    };

    let score = severityScores[this.props.severity];

    // Boost score if unresolved
    if (!this.props.isResolved) {
      score += 10;
    }

    // Boost score if blocking
    if (this.isBlocking()) {
      score += 20;
    }

    return score;
  }

  // ==================== BUSINESS LOGIC ====================

  /**
   * Mark this risk as resolved
   * BUSINESS RULE: Can only resolve if not already resolved
   */
  public resolve(resolutionNotes?: string): void {
    this.ensureNotDeleted();

    if (this.props.isResolved) {
      throw new Error(`RiskFlag[${this.id.toString()}] is already resolved`);
    }

    this.updateState({
      isResolved: true,
      resolvedAt: new Date(),
      resolutionNotes: resolutionNotes || 'Resolved via system event',
    });
  }

  /**
   * Re-open a resolved risk (if issue recurs)
   * BUSINESS RULE: Can only re-open if currently resolved
   */
  public reopen(reason: string): void {
    this.ensureNotDeleted();

    if (!this.props.isResolved) {
      throw new Error(`RiskFlag[${this.id.toString()}] is not resolved`);
    }

    this.updateState({
      isResolved: false,
      resolvedAt: undefined,
      resolutionNotes: `Reopened: ${reason}`,
    });
  }

  /**
   * Update severity (if situation worsens/improves)
   */
  public updateSeverity(newSeverity: RiskSeverity, reason: string): void {
    this.ensureNotDeleted();

    if (this.props.severity === newSeverity) {
      return; // No change
    }

    this.updateState({
      severity: newSeverity,
      resolutionNotes: this.props.resolutionNotes
        ? `${this.props.resolutionNotes}\n[Severity changed to ${newSeverity}: ${reason}]`
        : `Severity changed to ${newSeverity}: ${reason}`,
    });
  }

  /**
   * Add affected entity (e.g., new asset found to be disputed)
   */
  public addAffectedEntity(entityId: string): void {
    this.ensureNotDeleted();

    if (this.props.affectedEntityIds.includes(entityId)) {
      return; // Already tracked
    }

    const updatedIds = [...this.props.affectedEntityIds, entityId];
    this.updateState({ affectedEntityIds: updatedIds });
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a new unresolved risk
   */
  public static create(
    props: Omit<RiskFlagProps, 'isResolved' | 'resolvedAt' | 'resolutionNotes'>,
  ): RiskFlag {
    const id = UniqueEntityID.newID();
    return new RiskFlag(id, {
      ...props,
      isResolved: false,
      resolvedAt: undefined,
      resolutionNotes: undefined,
    });
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: RiskFlagProps,
    createdAt: Date,
    updatedAt: Date,
  ): RiskFlag {
    const entity = new RiskFlag(new UniqueEntityID(id), props, createdAt);
    (entity as any)._updatedAt = updatedAt;
    return entity;
  }

  // ==================== PRE-DEFINED RISK FACTORIES ====================

  /**
   * R001: Missing Death Certificate (CRITICAL)
   */
  public static createMissingDeathCert(estateId: string, source: RiskSource): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.MISSING_DOCUMENT,
      description: 'Death Certificate is missing',
      source,
      legalBasis: 'S.56 LSA - Death Certificate is mandatory',
      mitigationSteps: [
        'Visit Civil Registration Office',
        'Bring National ID and KES 50 fee',
        'Processing takes 1-3 days',
      ],
      documentGap: DocumentGap.createDeathCertificateGap(),
      affectedEntityIds: [estateId],
      autoResolvable: true, // Can listen to DocumentUploaded event
    });
  }

  /**
   * R002: Missing Chief's Letter (CRITICAL for Intestate)
   */
  public static createMissingChiefLetter(estateId: string, source: RiskSource): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.MISSING_DOCUMENT,
      description: 'Letter from Area Chief confirming next of kin is required',
      source,
      legalBasis: 'Customary requirement for Intestate cases',
      mitigationSteps: [
        "Visit Chief's office in deceased's home area",
        "Bring Death Certificate and family members' IDs",
        'Chief verifies family tree with elders',
        'Letter issued in 7-14 days',
      ],
      documentGap: DocumentGap.createChiefLetterGap(),
      affectedEntityIds: [estateId],
      autoResolvable: true,
    });
  }

  /**
   * R003: Minor child without guardian (CRITICAL)
   */
  public static createMinorWithoutGuardian(
    familyMemberId: string,
    minorName: string,
    source: RiskSource,
  ): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.MINOR_WITHOUT_GUARDIAN,
      description: `Minor child "${minorName}" has no appointed guardian`,
      source,
      legalBasis: 'S.71 Children Act - Minors must have legal guardian',
      mitigationSteps: [
        'Appoint guardian in Family Tree section',
        'Guardian must be adult (18+)',
        'Guardian must consent (P&A 38)',
        "If disputed, apply to Children's Court",
      ],
      affectedEntityIds: [familyMemberId],
      autoResolvable: true, // Listen to GuardianAppointed event
    });
  }

  /**
   * R004: Non-resident applicant (HIGH)
   */
  public static createNonResidentApplicant(applicantId: string, source: RiskSource): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.HIGH,
      category: RiskCategory.NON_RESIDENT_APPLICANT,
      description: 'Applicant is not a resident of Kenya',
      source,
      legalBasis: 'S.56 LSA - Applicant must be Kenya resident or justify non-residence',
      mitigationSteps: [
        'Provide proof of Kenya residence (utility bill, lease)',
        'If non-resident, file affidavit explaining why',
        'Appoint local advocate as agent',
      ],
      affectedEntityIds: [applicantId],
      autoResolvable: false, // Requires manual verification
    });
  }

  /**
   * R005: Wrong court jurisdiction (CRITICAL)
   */
  public static createWrongCourtJurisdiction(
    estateId: string,
    suggestedCourt: string,
    source: RiskSource,
  ): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.WRONG_COURT,
      description: `This case should be filed in ${suggestedCourt}`,
      source,
      legalBasis: 'S.56 LSA - Jurisdiction based on estate value and nature',
      mitigationSteps: [
        `Change target court to ${suggestedCourt}`,
        'Review estate valuation',
        "If Islamic case, file in Kadhi's Court",
      ],
      affectedEntityIds: [estateId],
      autoResolvable: false, // User must change setting
    });
  }

  /**
   * R006: Will not witnessed properly (CRITICAL)
   */
  public static createInvalidWillSignature(
    willId: string,
    witnessCount: number,
    source: RiskSource,
  ): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.INVALID_WILL_SIGNATURE,
      description: `Will has only ${witnessCount} witness(es). Kenyan law requires 2.`,
      source,
      legalBasis: 'S.11 LSA - Will must be signed by testator and 2 witnesses',
      mitigationSteps: [
        'Add missing witness(es) to Will',
        'Witnesses must be 18+ and not beneficiaries',
        'Witnesses must sign in presence of testator',
      ],
      affectedEntityIds: [willId],
      autoResolvable: true, // Listen to WitnessAdded event
    });
  }

  /**
   * R007: Minor appointed as executor (CRITICAL)
   */
  public static createMinorExecutor(
    willId: string,
    executorId: string,
    executorName: string,
    source: RiskSource,
  ): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.MINOR_EXECUTOR,
      description: `Executor "${executorName}" is a minor (under 18)`,
      source,
      legalBasis: 'S.6 LSA - Executor must be of full age (18+)',
      mitigationSteps: [
        'Remove minor executor from Will',
        'Appoint adult executor',
        'Alternatively, wait until minor turns 18',
      ],
      affectedEntityIds: [willId, executorId],
      autoResolvable: true,
    });
  }

  /**
   * R008: Missing KRA PIN (CRITICAL)
   */
  public static createMissingKraPin(estateId: string, source: RiskSource): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.KRA_PIN_MISSING,
      description: 'KRA PIN for deceased is missing',
      source,
      legalBasis: 'Tax Procedures Act - Required for estate valuation',
      mitigationSteps: [
        'Download PIN certificate from iTax',
        'If deceased had no PIN, apply posthumously',
        'Submit Death Certificate with application',
      ],
      documentGap: DocumentGap.createKraPinGap(),
      affectedEntityIds: [estateId],
      autoResolvable: true,
    });
  }

  /**
   * R009: Undefined polygamous structure (CRITICAL)
   */
  public static createUndefinedPolygamousStructure(familyId: string, source: RiskSource): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.UNDEFINED_POLYGAMOUS_STRUCTURE,
      description: 'Polygamous marriage detected but houses are not defined',
      source,
      legalBasis: 'S.40 LSA - Property distributed by house in polygamous estates',
      mitigationSteps: [
        'Define polygamous houses in Family Tree',
        "Assign children to their mother's house",
        'Allocate assets per house',
        "Document customary arrangement with elders' affidavit",
      ],
      affectedEntityIds: [familyId],
      autoResolvable: true, // Listen to PolygamousHouseCreated
    });
  }

  /**
   * R010: Insolvent estate (CRITICAL)
   */
  public static createInsolventEstate(
    estateId: string,
    totalAssets: number,
    totalDebts: number,
    source: RiskSource,
  ): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.INSOLVENT_ESTATE,
      description: `Estate is insolvent. Assets: KES ${totalAssets.toLocaleString()}, Debts: KES ${totalDebts.toLocaleString()}`,
      source,
      legalBasis: 'S.45 LSA - Debts must be paid before distribution',
      mitigationSteps: [
        'Review all debts for validity',
        'Check if any debts are statute-barred',
        'Consider asset liquidation to cover debts',
        'May need to apply for insolvency proceedings',
      ],
      affectedEntityIds: [estateId],
      autoResolvable: false, // Requires complex financial restructuring
    });
  }

  // ==================== SERIALIZATION ====================

  /**
   * Convert to JSON for persistence
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      severity: this.props.severity,
      category: this.props.category,
      description: this.props.description,
      source: this.props.source.toJSON(),
      legalBasis: this.props.legalBasis,
      mitigationSteps: this.props.mitigationSteps,
      documentGap: this.props.documentGap?.toJSON(),
      affectedEntityIds: this.props.affectedEntityIds,
      isResolved: this.props.isResolved,
      resolvedAt: this.props.resolvedAt?.toISOString(),
      resolutionNotes: this.props.resolutionNotes,
      autoResolvable: this.props.autoResolvable,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Derived
      isBlocking: this.isBlocking(),
      fingerprint: this.getFingerprint(),
      priorityScore: this.getPriorityScore(),
    };
  }
}
