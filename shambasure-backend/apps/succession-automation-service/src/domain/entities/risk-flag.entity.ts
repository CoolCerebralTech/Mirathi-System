// src/succession-automation/src/domain/entities/risk-flag.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { DocumentGap } from '../value-objects/document-gap.vo';
import { RiskSource } from '../value-objects/risk-source.vo';

/**
 * Risk Flag Entity
 *
 * INNOVATION: Event-Driven Risk Resolution & Legal Compliance Auditor
 *
 * This entity is the "brain cell" of the Succession Copilot. Each RiskFlag:
 * - Detects specific legal compliance issues (Kenyan succession law)
 * - Can auto-resolve via domain events (event-driven architecture)
 * - Maintains audit trail for court defense
 * - Provides actionable mitigation steps
 * - Integrates with DocumentGap for missing documents
 *
 * LEGAL CONTEXT:
 * Each risk corresponds to a rule in Kenyan law:
 * - CRITICAL: Blockers (S.56 LSA - mandatory documents)
 * - HIGH: Likely rejection (S.40 LSA - polygamy errors)
 * - MEDIUM: Court queries (S.83 LSA - executor duties)
 * - LOW: Best practice (Court practice directions)
 *
 * EVENT-DRIVEN DESIGN:
 * The system listens for events from Family/Estate services:
 * - AssetVerified → Resolves ASSET_VERIFICATION_FAILED
 * - GuardianAppointed → Resolves MINOR_WITHOUT_GUARDIAN
 * - DocumentUploaded → Resolves MISSING_DOCUMENT
 * - WillValidated → Resolves INVALID_WILL_SIGNATURE
 */

export enum RiskSeverity {
  CRITICAL = 'CRITICAL', // Cannot file (e.g., no Death Cert) - S.56 LSA
  HIGH = 'HIGH', // Likely court rejection - S.40 LSA
  MEDIUM = 'MEDIUM', // May cause queries - S.83 LSA
  LOW = 'LOW', // Best practice warning - Court practice directions
}

export enum RiskCategory {
  // Document Issues (S.56 LSA - mandatory documents)
  MISSING_DOCUMENT = 'MISSING_DOCUMENT',
  INVALID_DOCUMENT = 'INVALID_DOCUMENT',
  EXPIRED_DOCUMENT = 'EXPIRED_DOCUMENT',
  FORGED_DOCUMENT = 'FORGED_DOCUMENT',

  // Family Structure Issues (Children Act, S.40 LSA)
  MINOR_WITHOUT_GUARDIAN = 'MINOR_WITHOUT_GUARDIAN', // S.71 Children Act
  UNDEFINED_POLYGAMOUS_STRUCTURE = 'UNDEFINED_POLYGAMOUS_STRUCTURE', // S.40 LSA
  DISPUTED_RELATIONSHIP = 'DISPUTED_RELATIONSHIP',
  COHABITATION_CLAIM = 'COHABITATION_CLAIM', // S.3(5) LSA
  ILLEGITIMATE_CHILD_CLAIM = 'ILLEGITIMATE_CHILD_CLAIM', // S.3(2) LSA

  // Estate Issues (S.83 LSA - executor duties)
  ASSET_VERIFICATION_FAILED = 'ASSET_VERIFICATION_FAILED',
  INSOLVENT_ESTATE = 'INSOLVENT_ESTATE', // S.45 LSA priority
  MISSING_ASSET_VALUATION = 'MISSING_ASSET_VALUATION',
  ENCUMBERED_ASSET = 'ENCUMBERED_ASSET', // Mortgaged/charged assets
  FRAUDULENT_ASSET_TRANSFER = 'FRAUDULENT_ASSET_TRANSFER', // S.45 LSA avoidance

  // Will Issues (S.11 LSA - valid will requirements)
  INVALID_WILL_SIGNATURE = 'INVALID_WILL_SIGNATURE', // < 2 witnesses
  MINOR_EXECUTOR = 'MINOR_EXECUTOR', // S.6 LSA - must be 18+
  BENEFICIARY_AS_WITNESS = 'BENEFICIARY_AS_WITNESS', // S.11(3) LSA
  CONTESTED_WILL = 'CONTESTED_WILL',
  UNDUE_INFLUENCE = 'UNDUE_INFLUENCE', // S.26 LSA challenges

  // Jurisdiction Issues (S.48 LSA - court jurisdiction)
  WRONG_COURT = 'WRONG_COURT', // High vs Magistrate vs Kadhi's
  NON_RESIDENT_APPLICANT = 'NON_RESIDENT_APPLICANT',
  FORUM_NON_CONVENIENS = 'FORUM_NON_CONVENIENS', // Wrong territorial jurisdiction

  // Tax & Compliance (Tax Procedures Act)
  TAX_CLEARANCE_MISSING = 'TAX_CLEARANCE_MISSING',
  KRA_PIN_MISSING = 'KRA_PIN_MISSING',
  CAPITAL_GAINS_TAX_UNPAID = 'CAPITAL_GAINS_TAX_UNPAID',

  // Time-Based Risks (Limitation of Actions Act)
  STATUTE_BARRED_DEBT = 'STATUTE_BARRED_DEBT', // > 6 years old
  DELAYED_FILING = 'DELAYED_FILING', // > 6 months since death

  // Other Legal Risks
  FAMILY_DISPUTE = 'FAMILY_DISPUTE',
  CRIMINAL_INVESTIGATION = 'CRIMINAL_INVESTIGATION', // Murder suspicion etc.
  BANKRUPTCY_PENDING = 'BANKRUPTCY_PENDING',

  // System & Data Risks
  DATA_INCONSISTENCY = 'DATA_INCONSISTENCY', // Cross-service mismatch
  EXTERNAL_API_FAILURE = 'EXTERNAL_API_FAILURE', // KRA/Lands registry down
}

export enum RiskStatus {
  ACTIVE = 'ACTIVE', // Currently blocking/hindering
  RESOLVED = 'RESOLVED', // Issue fixed
  SUPERSEDED = 'SUPERSEDED', // Replaced by another risk
  EXPIRED = 'EXPIRED', // No longer relevant (e.g., statute barred)
  DISPUTED = 'DISPUTED', // User disputes this risk
}

export enum ResolutionMethod {
  EVENT_DRIVEN = 'EVENT_DRIVEN', // Resolved by domain event
  MANUAL_RESOLUTION = 'MANUAL_RESOLUTION', // User fixed manually
  SYSTEM_AUTO_RESOLVE = 'SYSTEM_AUTO_RESOLVE', // System logic fixed it
  COURT_ORDER = 'COURT_ORDER', // Required court intervention
  TIME_BASED = 'TIME_BASED', // Auto-resolved after time
  ADMIN_OVERRIDE = 'ADMIN_OVERRIDE', // Admin overrode the risk
}

interface RiskFlagProps {
  severity: RiskSeverity;
  category: RiskCategory;
  description: string;
  source: RiskSource;
  legalBasis: string; // E.g., "S.56 LSA - Death Certificate mandatory"
  mitigationSteps: string[]; // Step-by-step fixes
  documentGap?: DocumentGap; // Linked document gap (if applicable)
  affectedEntityIds: string[]; // FamilyMember IDs, Asset IDs, etc.
  affectedAggregateIds: string[]; // Parent aggregates (Estate, Family)
  riskStatus: RiskStatus;
  resolvedAt?: Date;
  resolutionMethod?: ResolutionMethod;
  resolutionNotes?: string;
  resolvedBy?: string; // User ID or 'system'
  expectedResolutionEvents: string[]; // Events that resolve this risk
  autoResolveTimeout?: Date; // When to auto-resolve if no action
  isBlocking: boolean; // Derived from severity + context
  impactScore: number; // 1-10, how much this affects readiness
  detectionRuleId: string; // Which compliance rule detected this
  lastReviewedAt: Date; // When risk was last evaluated
  reviewCount: number; // How many times reviewed
}

export class RiskFlag extends Entity<RiskFlagProps> {
  // Risk scoring weights (for impact calculation)
  private static readonly SEVERITY_WEIGHTS = {
    [RiskSeverity.CRITICAL]: 10,
    [RiskSeverity.HIGH]: 7,
    [RiskSeverity.MEDIUM]: 4,
    [RiskSeverity.LOW]: 1,
  };

  // Auto-resolve timeouts by severity
  private static readonly AUTO_RESOLVE_TIMEOUTS = {
    [RiskSeverity.CRITICAL]: 30 * 24 * 60 * 60 * 1000, // 30 days
    [RiskSeverity.HIGH]: 60 * 24 * 60 * 60 * 1000, // 60 days
    [RiskSeverity.MEDIUM]: 90 * 24 * 60 * 60 * 1000, // 90 days
    [RiskSeverity.LOW]: 180 * 24 * 60 * 60 * 1000, // 180 days
  };

  private constructor(id: UniqueEntityID, props: RiskFlagProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.ensureAutoResolveTimeout();
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

  get legalBasis(): string {
    return this.props.legalBasis;
  }

  get mitigationSteps(): string[] {
    return [...this.props.mitigationSteps];
  }

  get documentGap(): DocumentGap | undefined {
    return this.props.documentGap;
  }

  get affectedEntityIds(): string[] {
    return [...this.props.affectedEntityIds];
  }

  get affectedAggregateIds(): string[] {
    return [...this.props.affectedAggregateIds];
  }

  get riskStatus(): RiskStatus {
    return this.props.riskStatus;
  }

  get resolvedAt(): Date | undefined {
    return this.props.resolvedAt;
  }

  get resolutionMethod(): ResolutionMethod | undefined {
    return this.props.resolutionMethod;
  }

  get resolutionNotes(): string | undefined {
    return this.props.resolutionNotes;
  }

  get resolvedBy(): string | undefined {
    return this.props.resolvedBy;
  }

  get expectedResolutionEvents(): string[] {
    return [...this.props.expectedResolutionEvents];
  }

  get autoResolveTimeout(): Date | undefined {
    return this.props.autoResolveTimeout;
  }

  get isBlocking(): boolean {
    return this.props.isBlocking;
  }

  get impactScore(): number {
    return this.props.impactScore;
  }

  get detectionRuleId(): string {
    return this.props.detectionRuleId;
  }

  get lastReviewedAt(): Date {
    return this.props.lastReviewedAt;
  }

  get reviewCount(): number {
    return this.props.reviewCount;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Check if this risk is currently blocking the case
   * (Active critical risks are always blocking)
   */
  public isCurrentlyBlocking(): boolean {
    return (
      this.props.riskStatus === RiskStatus.ACTIVE && this.props.severity === RiskSeverity.CRITICAL
    );
  }

  /**
   * Check if risk is resolved
   */
  public get isResolved(): boolean {
    return this.props.riskStatus === RiskStatus.RESOLVED;
  }

  /**
   * Check if risk should be auto-resolved based on timeout
   */
  public shouldAutoResolve(now: Date = new Date()): boolean {
    if (this.props.riskStatus !== RiskStatus.ACTIVE) {
      return false;
    }

    if (!this.props.autoResolveTimeout) {
      return false;
    }

    return now >= this.props.autoResolveTimeout;
  }

  /**
   * Check if specific event resolves this risk
   */
  public canBeResolvedByEvent(eventType: string): boolean {
    return this.props.expectedResolutionEvents.includes(eventType);
  }

  /**
   * Get risk age in days
   */
  public getAgeInDays(now: Date = new Date()): number {
    const ageMs = now.getTime() - this.createdAt.getTime();
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get time until auto-resolve (in days)
   */
  public getDaysUntilAutoResolve(now: Date = new Date()): number | undefined {
    if (!this.props.autoResolveTimeout || this.props.riskStatus !== RiskStatus.ACTIVE) {
      return undefined;
    }

    const timeLeftMs = this.props.autoResolveTimeout.getTime() - now.getTime();
    return Math.max(0, Math.floor(timeLeftMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Get a unique fingerprint for this risk (to avoid duplicates)
   */
  public getFingerprint(): string {
    const parts = [
      this.props.category,
      this.props.detectionRuleId,
      this.props.source.getFingerprint(),
      this.props.affectedEntityIds.join(','),
    ];
    return parts.join(':');
  }

  /**
   * Get priority score for sorting (higher = more urgent)
   */
  public getPriorityScore(): number {
    let score = RiskFlag.SEVERITY_WEIGHTS[this.props.severity] * 10;

    // Active risks are higher priority
    if (this.props.riskStatus === RiskStatus.ACTIVE) {
      score += 20;
    }

    // Blocking risks get highest priority
    if (this.isCurrentlyBlocking()) {
      score += 30;
    }

    // Older risks get higher priority (aging factor)
    const ageInDays = this.getAgeInDays();
    if (ageInDays > 30) {
      score += Math.min(20, ageInDays - 30);
    }

    // High impact risks get boost
    score += this.props.impactScore;

    return score;
  }

  /**
   * Get risk category group
   */
  public getCategoryGroup(): string {
    const groups: Record<RiskCategory, string> = {
      // Document Issues
      [RiskCategory.MISSING_DOCUMENT]: 'DOCUMENT',
      [RiskCategory.INVALID_DOCUMENT]: 'DOCUMENT',
      [RiskCategory.EXPIRED_DOCUMENT]: 'DOCUMENT',
      [RiskCategory.FORGED_DOCUMENT]: 'DOCUMENT',

      // Family Structure
      [RiskCategory.MINOR_WITHOUT_GUARDIAN]: 'FAMILY',
      [RiskCategory.UNDEFINED_POLYGAMOUS_STRUCTURE]: 'FAMILY',
      [RiskCategory.DISPUTED_RELATIONSHIP]: 'FAMILY',
      [RiskCategory.COHABITATION_CLAIM]: 'FAMILY',
      [RiskCategory.ILLEGITIMATE_CHILD_CLAIM]: 'FAMILY',

      // Estate Issues
      [RiskCategory.ASSET_VERIFICATION_FAILED]: 'ESTATE',
      [RiskCategory.INSOLVENT_ESTATE]: 'ESTATE',
      [RiskCategory.MISSING_ASSET_VALUATION]: 'ESTATE',
      [RiskCategory.ENCUMBERED_ASSET]: 'ESTATE',
      [RiskCategory.FRAUDULENT_ASSET_TRANSFER]: 'ESTATE',

      // Will Issues
      [RiskCategory.INVALID_WILL_SIGNATURE]: 'WILL',
      [RiskCategory.MINOR_EXECUTOR]: 'WILL',
      [RiskCategory.BENEFICIARY_AS_WITNESS]: 'WILL',
      [RiskCategory.CONTESTED_WILL]: 'WILL',
      [RiskCategory.UNDUE_INFLUENCE]: 'WILL',

      // Jurisdiction
      [RiskCategory.WRONG_COURT]: 'JURISDICTION',
      [RiskCategory.NON_RESIDENT_APPLICANT]: 'JURISDICTION',
      [RiskCategory.FORUM_NON_CONVENIENS]: 'JURISDICTION',

      // Tax & Compliance
      [RiskCategory.TAX_CLEARANCE_MISSING]: 'TAX',
      [RiskCategory.KRA_PIN_MISSING]: 'TAX',
      [RiskCategory.CAPITAL_GAINS_TAX_UNPAID]: 'TAX',

      // Time-Based
      [RiskCategory.STATUTE_BARRED_DEBT]: 'TIME',
      [RiskCategory.DELAYED_FILING]: 'TIME',

      // Other
      [RiskCategory.FAMILY_DISPUTE]: 'OTHER',
      [RiskCategory.CRIMINAL_INVESTIGATION]: 'OTHER',
      [RiskCategory.BANKRUPTCY_PENDING]: 'OTHER',

      // System
      [RiskCategory.DATA_INCONSISTENCY]: 'SYSTEM',
      [RiskCategory.EXTERNAL_API_FAILURE]: 'SYSTEM',
    };

    return groups[this.props.category] || 'OTHER';
  }

  // ==================== BUSINESS LOGIC ====================

  /**
   * Mark this risk as resolved
   */
  public resolve(method: ResolutionMethod, resolvedBy: string, notes?: string): void {
    this.ensureNotDeleted();

    if (this.props.riskStatus === RiskStatus.RESOLVED) {
      throw new Error(`RiskFlag[${this.id.toString()}] is already resolved`);
    }

    this.updateState({
      riskStatus: RiskStatus.RESOLVED,
      resolvedAt: new Date(),
      resolutionMethod: method,
      resolvedBy,
      resolutionNotes: notes || `Resolved via ${method}`,
      autoResolveTimeout: undefined, // Clear timeout if resolved
      lastReviewedAt: new Date(),
      reviewCount: this.props.reviewCount + 1,
    });
  }

  /**
   * Re-open a resolved risk
   */
  public reopen(reason: string): void {
    this.ensureNotDeleted();

    if (this.props.riskStatus !== RiskStatus.RESOLVED) {
      throw new Error(`RiskFlag[${this.id.toString()}] is not resolved`);
    }

    this.updateState({
      riskStatus: RiskStatus.ACTIVE,
      resolvedAt: undefined,
      resolutionMethod: undefined,
      resolvedBy: undefined,
      resolutionNotes: `Reopened: ${reason}`,
      lastReviewedAt: new Date(),
      reviewCount: this.props.reviewCount + 1,
    });

    this.ensureAutoResolveTimeout();
  }

  /**
   * Mark risk as superseded by another risk
   */
  public markAsSuperseded(supersedingRiskId: string): void {
    this.ensureNotDeleted();

    this.updateState({
      riskStatus: RiskStatus.SUPERSEDED,
      resolutionNotes: `Superseded by risk ${supersedingRiskId}`,
      resolvedAt: new Date(),
      resolutionMethod: ResolutionMethod.SYSTEM_AUTO_RESOLVE,
      resolvedBy: 'system',
      lastReviewedAt: new Date(),
      reviewCount: this.props.reviewCount + 1,
    });
  }

  /**
   * Update severity based on new information
   */
  public updateSeverity(newSeverity: RiskSeverity, reason: string): void {
    this.ensureNotDeleted();

    if (this.props.severity === newSeverity) {
      return;
    }

    const newIsBlocking = newSeverity === RiskSeverity.CRITICAL;

    this.updateState({
      severity: newSeverity,
      isBlocking: newIsBlocking,
      resolutionNotes: this.props.resolutionNotes
        ? `${this.props.resolutionNotes}\n[Severity updated: ${this.props.severity} → ${newSeverity} - ${reason}]`
        : `Severity updated: ${this.props.severity} → ${newSeverity} - ${reason}`,
      lastReviewedAt: new Date(),
      reviewCount: this.props.reviewCount + 1,
    });

    // Update auto-resolve timeout if severity changed
    this.ensureAutoResolveTimeout();
  }

  /**
   * Add affected entity (e.g., new asset found to be disputed)
   */
  public addAffectedEntity(entityId: string, aggregateId: string): void {
    this.ensureNotDeleted();

    const updatedEntityIds = [...this.props.affectedEntityIds];
    const updatedAggregateIds = [...this.props.affectedAggregateIds];

    if (!updatedEntityIds.includes(entityId)) {
      updatedEntityIds.push(entityId);
    }

    if (!updatedAggregateIds.includes(aggregateId)) {
      updatedAggregateIds.push(aggregateId);
    }

    this.updateState({
      affectedEntityIds: updatedEntityIds,
      affectedAggregateIds: updatedAggregateIds,
      lastReviewedAt: new Date(),
      reviewCount: this.props.reviewCount + 1,
    });
  }

  /**
   * User disputes this risk (requires admin review)
   */
  public markAsDisputed(reason: string, userId: string): void {
    this.ensureNotDeleted();

    this.updateState({
      riskStatus: RiskStatus.DISPUTED,
      resolutionNotes: `Disputed by user ${userId}: ${reason}`,
      lastReviewedAt: new Date(),
      reviewCount: this.props.reviewCount + 1,
    });
  }

  /**
   * Review risk (updates timestamps)
   */
  public markAsReviewed(): void {
    this.updateState({
      lastReviewedAt: new Date(),
      reviewCount: this.props.reviewCount + 1,
    });
  }

  // ==================== HELPER METHODS ====================

  /**
   * Ensure auto-resolve timeout is set based on severity
   */
  private ensureAutoResolveTimeout(): void {
    if (this.props.riskStatus !== RiskStatus.ACTIVE) {
      return;
    }

    if (this.props.autoResolveTimeout) {
      return; // Already set
    }

    const timeoutMs = RiskFlag.AUTO_RESOLVE_TIMEOUTS[this.props.severity];
    const autoResolveTimeout = new Date();
    autoResolveTimeout.setTime(autoResolveTimeout.getTime() + timeoutMs);

    this.updateState({
      autoResolveTimeout,
    });
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a new active risk
   */
  public static create(
    props: Omit<RiskFlagProps, 'riskStatus' | 'lastReviewedAt' | 'reviewCount'> & {
      detectionRuleId: string;
    },
  ): RiskFlag {
    const id = UniqueEntityID.newID();

    const fullProps: RiskFlagProps = {
      ...props,
      riskStatus: RiskStatus.ACTIVE,
      lastReviewedAt: new Date(),
      reviewCount: 1,
    };

    return new RiskFlag(id, fullProps);
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
   * R001: Missing Death Certificate (CRITICAL) - S.56 LSA
   */
  public static createMissingDeathCert(estateId: string, source: RiskSource): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.MISSING_DOCUMENT,
      description: 'Death Certificate is missing',
      source,
      legalBasis: 'S.56 LSA - Death Certificate is mandatory for all succession cases',
      mitigationSteps: [
        'Visit Civil Registration Office where death was registered',
        'Bring National ID and KES 50 fee',
        'Processing takes 1-3 days',
        'If death overseas, obtain certified copy and apostille',
      ],
      documentGap: DocumentGap.createDeathCertificateGap(),
      affectedEntityIds: [estateId],
      affectedAggregateIds: [estateId],
      expectedResolutionEvents: ['DeathCertificateUploaded', 'DocumentVerified'],
      isBlocking: true,
      impactScore: 10,
      detectionRuleId: 'RULE_DEATH_CERT_REQUIRED',
    });
  }

  /**
   * R002: Minor without Guardian (CRITICAL) - S.71 Children Act
   */
  public static createMinorWithoutGuardian(
    minorId: string,
    familyId: string,
    minorName: string,
    source: RiskSource,
  ): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.MINOR_WITHOUT_GUARDIAN,
      description: `Minor child "${minorName}" (${minorId.substring(0, 8)}) has no legal guardian`,
      source,
      legalBasis: 'S.71 Children Act - Every minor must have a legal guardian for estate matters',
      mitigationSteps: [
        'Appoint legal guardian in Family section',
        'Guardian must be adult (18+)',
        'Guardian must provide consent (Form P&A 38)',
        "If disputed, apply to Children's Court for appointment",
      ],
      affectedEntityIds: [minorId],
      affectedAggregateIds: [familyId],
      expectedResolutionEvents: ['GuardianAppointed', 'GuardianshipCreated'],
      isBlocking: true,
      impactScore: 9,
      detectionRuleId: 'RULE_MINOR_GUARDIAN_REQUIRED',
    });
  }

  /**
   * R003: Undefined Polygamous Structure (CRITICAL) - S.40 LSA
   */
  public static createUndefinedPolygamousStructure(
    familyId: string,
    wifeCount: number,
    source: RiskSource,
  ): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.UNDEFINED_POLYGAMOUS_STRUCTURE,
      description: `Polygamous marriage with ${wifeCount} wives detected, but houses are not defined for S.40 distribution`,
      source,
      legalBasis: 'S.40 LSA - Polygamous estate must be distributed by house, not per child',
      mitigationSteps: [
        'Define polygamous houses in Family Tree',
        'Assign each wife to a house (House A, House B, etc.)',
        "Assign children to their mother's house",
        'Document customary arrangement with elders affidavit',
        'Calculate distribution per house, not per child',
      ],
      affectedEntityIds: [familyId],
      affectedAggregateIds: [familyId],
      expectedResolutionEvents: ['PolygamousHouseCreated', 'FamilyStructureUpdated'],
      isBlocking: true,
      impactScore: 8,
      detectionRuleId: 'RULE_POLYGAMOUS_HOUSES_REQUIRED',
    });
  }

  /**
   * R004: Will with Invalid Signature (CRITICAL) - S.11 LSA
   */
  public static createInvalidWillSignature(
    willId: string,
    witnessCount: number,
    source: RiskSource,
  ): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.INVALID_WILL_SIGNATURE,
      description: `Will has only ${witnessCount} witness(es). Kenyan law requires 2 competent witnesses.`,
      source,
      legalBasis: 'S.11 LSA - Will must be signed by testator in presence of 2 competent witnesses',
      mitigationSteps: [
        'Add missing witness(es) via affidavit of due execution',
        'Witnesses must be 18+ and not beneficiaries',
        'Witnesses must sign in presence of testator and each other',
        'Consider will re-execution if witnesses unavailable',
      ],
      affectedEntityIds: [willId],
      affectedAggregateIds: [willId],
      expectedResolutionEvents: ['WillReexecuted', 'AdditionalWitnessAdded'],
      isBlocking: true,
      impactScore: 10,
      detectionRuleId: 'RULE_WILL_WITNESSES_REQUIRED',
    });
  }

  /**
   * R005: Insolvent Estate (CRITICAL) - S.45 LSA
   */
  public static createInsolventEstate(
    estateId: string,
    assetValue: number,
    debtValue: number,
    source: RiskSource,
  ): RiskFlag {
    const deficit = debtValue - assetValue;

    return RiskFlag.create({
      severity: RiskSeverity.CRITICAL,
      category: RiskCategory.INSOLVENT_ESTATE,
      description: `Estate insolvent. Assets: KES ${assetValue.toLocaleString()}, Debts: KES ${debtValue.toLocaleString()} (Deficit: KES ${deficit.toLocaleString()})`,
      source,
      legalBasis: 'S.45 LSA - Debts must be paid in priority order before any distribution',
      mitigationSteps: [
        'Review all debts for validity and priority',
        'Check for statute-barred debts (>6 years old)',
        'Consider asset liquidation to cover priority debts',
        'If insolvent, apply for insolvency administration',
        'Beneficiaries receive nothing until debts cleared',
      ],
      affectedEntityIds: [estateId],
      affectedAggregateIds: [estateId],
      expectedResolutionEvents: ['DebtSettled', 'AssetAdded', 'EstateRevalued'],
      isBlocking: true,
      impactScore: 9,
      detectionRuleId: 'RULE_ESTATE_SOLVENCY_REQUIRED',
    });
  }

  /**
   * R006: Missing KRA PIN (HIGH) - Tax Procedures Act
   */
  public static createMissingKraPin(
    deceasedId: string,
    estateId: string,
    source: RiskSource,
  ): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.HIGH,
      category: RiskCategory.KRA_PIN_MISSING,
      description: 'KRA PIN Certificate for deceased is missing',
      source,
      legalBasis: 'Tax Procedures Act - Required for all estate valuations and transfers',
      mitigationSteps: [
        'Download PIN certificate from iTax portal (www.itax.kra.go.ke)',
        "Use deceased's details: ID number, full name, date of birth",
        'If deceased had no PIN, apply for posthumous PIN',
        'Submit Death Certificate with PIN application',
      ],
      documentGap: DocumentGap.createKraPinGap(),
      affectedEntityIds: [deceasedId, estateId],
      affectedAggregateIds: [estateId],
      expectedResolutionEvents: ['KraPinVerified', 'DocumentUploaded'],
      isBlocking: false, // Can file but will face queries
      impactScore: 7,
      detectionRuleId: 'RULE_KRA_PIN_REQUIRED',
    });
  }

  /**
   * R007: Missing Chief's Letter (HIGH) - Customary Law for Intestate
   */
  public static createMissingChiefLetter(estateId: string, source: RiskSource): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.HIGH,
      category: RiskCategory.MISSING_DOCUMENT,
      description: "Chief's letter is missing for intestate succession in rural areas",
      source,
      legalBasis: 'Customary Law - Required for intestate succession in rural communities',
      mitigationSteps: [
        "Visit local Chief's office",
        'Provide details of deceased and family structure',
        'Obtain letter confirming family hierarchy',
        'Have letter signed and stamped by Chief',
        'Include letter with court filing documents',
      ],
      documentGap: DocumentGap.createChiefLetterGap(),
      affectedEntityIds: [estateId],
      affectedAggregateIds: [estateId],
      expectedResolutionEvents: ['ChiefLetterObtained', 'DocumentUploaded'],
      isBlocking: false,
      impactScore: 6,
      detectionRuleId: 'RULE_CHIEF_LETTER_REQUIRED',
    });
  }

  /**
   * R008: Cohabitation Claim Risk (HIGH) - S.3(5) LSA
   */
  public static createCohabitationRisk(
    claimantId: string,
    deceasedId: string,
    durationMonths: number,
    source: RiskSource,
  ): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.HIGH,
      category: RiskCategory.COHABITATION_CLAIM,
      description: `Cohabitation claim by ${claimantId.substring(0, 8)} for ${durationMonths} months. Must prove "wife" status under S.3(5).`,
      source,
      legalBasis: 'S.3(5) LSA - "Wife" includes woman cohabiting with man as husband for 2+ years',
      mitigationSteps: [
        'Gather evidence of cohabitation (lease agreements, utility bills)',
        'Obtain affidavits from neighbors/relatives',
        'Prove public acknowledgment as husband/wife',
        'Check if deceased was married to others during cohabitation',
        'Prepare for likely court challenge from legal family',
      ],
      affectedEntityIds: [claimantId, deceasedId],
      affectedAggregateIds: [deceasedId], // Using deceased as aggregate
      expectedResolutionEvents: ['CohabitationVerified', 'ClaimWithdrawn'],
      isBlocking: false,
      impactScore: 6,
      detectionRuleId: 'RULE_COHABITATION_VALIDATION',
    });
  }

  /**
   * R009: Statute Barred Debt (MEDIUM) - Limitation of Actions Act
   */
  public static createStatuteBarredDebt(
    debtId: string,
    estateId: string,
    debtAgeYears: number,
    source: RiskSource,
  ): RiskFlag {
    return RiskFlag.create({
      severity: RiskSeverity.MEDIUM,
      category: RiskCategory.STATUTE_BARRED_DEBT,
      description: `Debt is ${debtAgeYears} years old. May be statute-barred (>6 years).`,
      source,
      legalBasis: 'Limitation of Actions Act - Unsecured debts barred after 6 years',
      mitigationSteps: [
        'Verify debt acknowledgment within last 6 years',
        'Check for part-payment within limitation period',
        'Consult lawyer on debt validity',
        'May reject debt if statute-barred',
      ],
      affectedEntityIds: [debtId],
      affectedAggregateIds: [estateId],
      expectedResolutionEvents: ['DebtValidated', 'DebtRejected'],
      isBlocking: false,
      impactScore: 3,
      detectionRuleId: 'RULE_DEBT_LIMITATION_CHECK',
    });
  }

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    const now = new Date();

    return {
      id: this.id.toString(),
      severity: this.props.severity,
      category: this.props.category,
      categoryGroup: this.getCategoryGroup(),
      description: this.props.description,
      source: this.props.source.toJSON(),
      legalBasis: this.props.legalBasis,
      mitigationSteps: this.props.mitigationSteps,
      documentGap: this.props.documentGap?.toJSON(),
      affectedEntityIds: this.props.affectedEntityIds,
      affectedAggregateIds: this.props.affectedAggregateIds,
      riskStatus: this.props.riskStatus,
      resolvedAt: this.props.resolvedAt?.toISOString(),
      resolutionMethod: this.props.resolutionMethod,
      resolutionNotes: this.props.resolutionNotes,
      resolvedBy: this.props.resolvedBy,
      expectedResolutionEvents: this.props.expectedResolutionEvents,
      autoResolveTimeout: this.props.autoResolveTimeout?.toISOString(),
      isBlocking: this.props.isBlocking,
      impactScore: this.props.impactScore,
      detectionRuleId: this.props.detectionRuleId,
      lastReviewedAt: this.props.lastReviewedAt.toISOString(),
      reviewCount: this.props.reviewCount,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),

      // Derived properties
      isCurrentlyBlocking: this.isCurrentlyBlocking(),
      shouldAutoResolve: this.shouldAutoResolve(now),
      canAutoResolve: this.props.autoResolveTimeout !== undefined,
      ageInDays: this.getAgeInDays(now),
      daysUntilAutoResolve: this.getDaysUntilAutoResolve(now),
      fingerprint: this.getFingerprint(),
      priorityScore: this.getPriorityScore(),
      isActive: this.props.riskStatus === RiskStatus.ACTIVE,
      isResolved: this.isResolved,
      isDisputed: this.props.riskStatus === RiskStatus.DISPUTED,
    };
  }
}
