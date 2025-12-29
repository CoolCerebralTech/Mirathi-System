// src/succession-automation/src/domain/value-objects/risk-source.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Risk Source Value Object
 *
 * PURPOSE: Traceability - Every risk must be traceable to its source.
 * This enables:
 * 1. Audit Trail: "Where did this risk come from?"
 * 2. Event Handlers: When Family Service fixes a guardian issue, we know which risk to resolve
 * 3. Legal Defense: "Your Honor, the system flagged this risk because S.71 requires..."
 * 4. Root Cause Analysis: Understand WHY a risk appeared
 * 5. Auto-resolution: Listen for specific events to auto-resolve risks
 *
 * LEGAL CONTEXT:
 * - S.83 LSA: Executors must account for their actions
 * - Court disputes: Need to prove when we detected a risk
 * - Data Provenance: Required for regulatory compliance
 *
 * BOUNDED CONTEXT REFERENCES:
 * - FAMILY_SERVICE: FamilyMember, Marriage, Guardianship
 * - ESTATE_SERVICE: Asset, Will, Debt
 * - DOCUMENT_SERVICE: Missing/Invalid documents
 * - EXTERNAL_REGISTRY: KRA, Lands Registry validation failures
 */

export enum RiskSourceType {
  // Family Service Sources
  FAMILY_SERVICE = 'FAMILY_SERVICE',
  GUARDIANSHIP_SERVICE = 'GUARDIANSHIP_SERVICE',
  MARRIAGE_SERVICE = 'MARRIAGE_SERVICE',

  // Estate Service Sources
  ESTATE_SERVICE = 'ESTATE_SERVICE',
  WILL_SERVICE = 'WILL_SERVICE',
  ASSET_SERVICE = 'ASSET_SERVICE',
  DEBT_SERVICE = 'DEBT_SERVICE',

  // Succession Automation Sources
  COMPLIANCE_ENGINE = 'COMPLIANCE_ENGINE',
  READINESS_ASSESSMENT = 'READINESS_ASSESSMENT',
  FORM_STRATEGY = 'FORM_STRATEGY',

  // External Services
  DOCUMENT_SERVICE = 'DOCUMENT_SERVICE',
  KRA_SERVICE = 'KRA_SERVICE',
  LANDS_REGISTRY = 'LANDS_REGISTRY',
  NTSA_SERVICE = 'NTSA_SERVICE', // National Transport & Safety Authority

  // System & User
  USER_INPUT = 'USER_INPUT',
  SYSTEM_VALIDATION = 'SYSTEM_VALIDATION',
  THIRD_PARTY_API = 'THIRD_PARTY_API',
}

export enum DetectionMethod {
  RULE_ENGINE = 'RULE_ENGINE', // Compliance engine rule triggered
  API_VALIDATION = 'API_VALIDATION', // External API validation
  MANUAL_REVIEW = 'MANUAL_REVIEW', // Human review flagged
  SYSTEM_SCAN = 'SYSTEM_SCAN', // Automated system scan
  EVENT_DRIVEN = 'EVENT_DRIVEN', // Triggered by domain event
  CROSS_CONTEXT_CHECK = 'CROSS_CONTEXT_CHECK', // Data inconsistency between services
  LEGAL_ANALYSIS = 'LEGAL_ANALYSIS', // Legal rule violation
  DATA_INTEGRITY_CHECK = 'DATA_INTEGRITY_CHECK', // Data missing or invalid
}

export enum ResolutionTrigger {
  EVENT_BASED = 'EVENT_BASED', // Automatically resolved by domain event
  MANUAL_ACTION = 'MANUAL_ACTION', // Requires user action
  SYSTEM_AUTO = 'SYSTEM_AUTO', // System automatically fixes
  COURT_ORDER = 'COURT_ORDER', // Requires court order
  TIME_BASED = 'TIME_BASED', // Resolves after time passes
}

interface LegalReference {
  act: string; // e.g., "LSA", "Children Act", "Tax Procedures Act"
  section: string; // e.g., "29", "40", "71"
  subsection?: string; // e.g., "(1)", "(3)(a)"
  description: string; // Human-readable description
  isMandatory: boolean; // Is this a legal requirement or recommendation?
}

interface RiskSourceProps {
  sourceType: RiskSourceType;
  sourceEntityId?: string; // UUID of the specific entity
  sourceEntityType?: string; // Type name (e.g., "FamilyMember", "Asset", "Will")
  sourceAggregateId?: string; // Parent aggregate ID for context
  serviceName: string; // Bounded context name (e.g., "family-service")
  detectionMethod: DetectionMethod;
  detectionRuleId?: string; // Which specific rule detected this
  legalReferences: LegalReference[]; // Array of legal bases
  detectedAt: Date;
  resolutionTriggers: ResolutionTrigger[]; // What can resolve this risk
  expectedResolutionEvents?: string[]; // Domain event types that resolve this
  autoResolveTimeoutHours?: number; // Auto-resolve after X hours if conditions met
  confidenceScore: number; // 0-1, how confident we are about this risk
  requiresManualReview: boolean; // Does this need human review?
  notes?: string; // Additional context for auditors
}

export class RiskSource extends ValueObject<RiskSourceProps> {
  constructor(props: RiskSourceProps) {
    super(props);
  }

  protected validate(): void {
    const {
      sourceType,
      detectionMethod,
      detectedAt,
      confidenceScore,
      legalReferences,
      resolutionTriggers,
      expectedResolutionEvents,
      autoResolveTimeoutHours,
      requiresManualReview,
      serviceName,
    } = this.props;

    // Source type validation
    if (!Object.values(RiskSourceType).includes(sourceType)) {
      throw new ValueObjectValidationError(`Invalid RiskSourceType: ${sourceType}`, 'sourceType');
    }

    // Detection method validation
    if (!Object.values(DetectionMethod).includes(detectionMethod)) {
      throw new ValueObjectValidationError(
        `Invalid DetectionMethod: ${detectionMethod}`,
        'detectionMethod',
      );
    }

    // Timestamp validation
    if (!(detectedAt instanceof Date) || isNaN(detectedAt.getTime())) {
      throw new ValueObjectValidationError('Invalid detection timestamp', 'detectedAt');
    }

    // Confidence score validation
    if (confidenceScore < 0 || confidenceScore > 1) {
      throw new ValueObjectValidationError(
        'Confidence score must be between 0 and 1',
        'confidenceScore',
      );
    }

    // Service name validation
    if (!serviceName || serviceName.trim().length === 0) {
      throw new ValueObjectValidationError('Service name is required', 'serviceName');
    }

    // Legal references validation
    if (!legalReferences || legalReferences.length === 0) {
      throw new ValueObjectValidationError(
        'At least one legal reference is required',
        'legalReferences',
      );
    }

    legalReferences.forEach((ref, index) => {
      if (!ref.act || !ref.section || !ref.description) {
        throw new ValueObjectValidationError(
          `Legal reference at index ${index} is incomplete`,
          'legalReferences',
        );
      }
    });

    // Resolution triggers validation
    if (!resolutionTriggers || resolutionTriggers.length === 0) {
      throw new ValueObjectValidationError(
        'At least one resolution trigger is required',
        'resolutionTriggers',
      );
    }

    resolutionTriggers.forEach((trigger, index) => {
      if (!Object.values(ResolutionTrigger).includes(trigger)) {
        throw new ValueObjectValidationError(
          `Invalid ResolutionTrigger at index ${index}: ${trigger}`,
          'resolutionTriggers',
        );
      }
    });

    // BUSINESS RULE: If event-based resolution, expected events must be provided
    if (resolutionTriggers.includes(ResolutionTrigger.EVENT_BASED)) {
      if (!expectedResolutionEvents || expectedResolutionEvents.length === 0) {
        throw new ValueObjectValidationError(
          'Event-based resolution requires expected resolution events',
          'expectedResolutionEvents',
        );
      }
    }

    // BUSINESS RULE: Auto-resolve timeout validation
    if (autoResolveTimeoutHours !== undefined && autoResolveTimeoutHours < 0) {
      throw new ValueObjectValidationError(
        'Auto-resolve timeout cannot be negative',
        'autoResolveTimeoutHours',
      );
    }

    // BUSINESS RULE: Entity reference consistency
    if (this.props.sourceEntityId && !this.props.sourceEntityType) {
      throw new ValueObjectValidationError(
        'sourceEntityType is required when sourceEntityId is provided',
        'sourceEntityType',
      );
    }

    // BUSINESS RULE: High confidence risks shouldn't require manual review
    if (confidenceScore > 0.9 && requiresManualReview) {
      console.warn('High confidence risk marked for manual review - consider automation');
    }
  }

  // ==================== GETTERS ====================

  get sourceType(): RiskSourceType {
    return this.props.sourceType;
  }

  get sourceEntityId(): string | undefined {
    return this.props.sourceEntityId;
  }

  get sourceEntityType(): string | undefined {
    return this.props.sourceEntityType;
  }

  get sourceAggregateId(): string | undefined {
    return this.props.sourceAggregateId;
  }

  get serviceName(): string {
    return this.props.serviceName;
  }

  get detectionMethod(): DetectionMethod {
    return this.props.detectionMethod;
  }

  get detectionRuleId(): string | undefined {
    return this.props.detectionRuleId;
  }

  get legalReferences(): LegalReference[] {
    return this.props.legalReferences;
  }

  get detectedAt(): Date {
    return this.props.detectedAt;
  }

  get resolutionTriggers(): ResolutionTrigger[] {
    return this.props.resolutionTriggers;
  }

  get expectedResolutionEvents(): string[] | undefined {
    return this.props.expectedResolutionEvents;
  }

  get autoResolveTimeoutHours(): number | undefined {
    return this.props.autoResolveTimeoutHours;
  }

  get confidenceScore(): number {
    return this.props.confidenceScore;
  }

  get requiresManualReview(): boolean {
    return this.props.requiresManualReview;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Is this risk from an external service (cross-bounded-context)?
   */
  public isExternalSource(): boolean {
    return [
      RiskSourceType.FAMILY_SERVICE,
      RiskSourceType.ESTATE_SERVICE,
      RiskSourceType.KRA_SERVICE,
      RiskSourceType.LANDS_REGISTRY,
      RiskSourceType.NTSA_SERVICE,
    ].includes(this.props.sourceType);
  }

  /**
   * Is this risk from an external registry (KRA, Lands, NTSA)?
   */
  public isRegistrySource(): boolean {
    return [
      RiskSourceType.KRA_SERVICE,
      RiskSourceType.LANDS_REGISTRY,
      RiskSourceType.NTSA_SERVICE,
    ].includes(this.props.sourceType);
  }

  /**
   * Can this risk be auto-resolved by listening to events?
   */
  public isEventResolvable(): boolean {
    return this.props.resolutionTriggers.includes(ResolutionTrigger.EVENT_BASED);
  }

  /**
   * Should this risk be auto-resolved after timeout?
   */
  public isTimeoutResolvable(): boolean {
    return (
      this.props.resolutionTriggers.includes(ResolutionTrigger.TIME_BASED) &&
      this.props.autoResolveTimeoutHours !== undefined
    );
  }

  /**
   * When does this risk auto-resolve (if timeout-based)?
   */
  public getAutoResolveTime(): Date | undefined {
    if (!this.isTimeoutResolvable() || !this.props.autoResolveTimeoutHours) {
      return undefined;
    }

    const resolveTime = new Date(this.props.detectedAt);
    resolveTime.setHours(resolveTime.getHours() + this.props.autoResolveTimeoutHours);
    return resolveTime;
  }

  /**
   * Can the system automatically resolve this risk?
   */
  public canAutoResolve(): boolean {
    return (
      this.props.resolutionTriggers.some((trigger) =>
        [
          ResolutionTrigger.EVENT_BASED,
          ResolutionTrigger.SYSTEM_AUTO,
          ResolutionTrigger.TIME_BASED,
        ].includes(trigger),
      ) && !this.props.requiresManualReview
    );
  }

  /**
   * Check if a specific event type would resolve this risk
   */
  public canBeResolvedByEvent(eventType: string): boolean {
    if (!this.isEventResolvable() || !this.props.expectedResolutionEvents) {
      return false;
    }

    return this.props.expectedResolutionEvents.includes(eventType);
  }

  /**
   * Generate a unique fingerprint for this source
   * Used to avoid duplicate risks from the same source
   */
  public getFingerprint(): string {
    const parts = [
      this.props.sourceType,
      this.props.sourceEntityType || 'UNKNOWN',
      this.props.sourceEntityId || 'UNKNOWN',
      this.props.sourceAggregateId || 'UNKNOWN',
      this.props.detectionMethod,
      this.props.detectionRuleId || 'UNKNOWN',
    ];
    return parts.join(':');
  }

  /**
   * Get primary legal basis for display
   */
  public getPrimaryLegalBasis(): string {
    if (this.props.legalReferences.length === 0) {
      return 'No legal basis specified';
    }

    const primary = this.props.legalReferences[0];
    return `${primary.act} S.${primary.section}${primary.subsection || ''}`;
  }

  /**
   * Get all legal bases as formatted string
   */
  public getAllLegalBases(): string {
    return this.props.legalReferences
      .map((ref) => `${ref.act} S.${ref.section}${ref.subsection || ''} - ${ref.description}`)
      .join('; ');
  }

  /**
   * Get a human-readable description of where this risk came from
   */
  public toDescription(): string {
    const parts: string[] = [];

    // Source and entity
    parts.push(`${this.props.sourceType}`);

    if (this.props.sourceEntityType) {
      parts.push(`→ ${this.props.sourceEntityType}`);

      if (this.props.sourceEntityId) {
        parts.push(`[${this.props.sourceEntityId.substring(0, 8)}...]`);
      }
    }

    // Detection method
    parts.push(`(Detected via: ${this.props.detectionMethod})`);

    // Confidence
    parts.push(`Confidence: ${Math.round(this.props.confidenceScore * 100)}%`);

    // Resolution capability
    if (this.canAutoResolve()) {
      parts.push(`[AUTO-RESOLVABLE]`);
    }

    return parts.join(' ');
  }

  /**
   * Check if this risk source is still valid (not expired/stale)
   */
  public isValid(now: Date = new Date()): boolean {
    // If timeout-based and expired, it's no longer valid
    if (this.isTimeoutResolvable()) {
      const autoResolveTime = this.getAutoResolveTime();
      if (autoResolveTime && now > autoResolveTime) {
        return false; // Auto-resolved by timeout
      }
    }

    return true;
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a risk source from Family Service
   */
  public static fromFamilyService(
    entityId: string,
    entityType: string,
    aggregateId: string,
    detectionMethod: DetectionMethod,
    ruleId: string,
    legalReference: LegalReference,
    requiresManualReview: boolean = false,
    confidenceScore: number = 0.95,
  ): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.FAMILY_SERVICE,
      sourceEntityId: entityId,
      sourceEntityType: entityType,
      sourceAggregateId: aggregateId,
      serviceName: 'family-service',
      detectionMethod,
      detectionRuleId: ruleId,
      legalReferences: [legalReference],
      detectedAt: new Date(),
      resolutionTriggers: [ResolutionTrigger.EVENT_BASED, ResolutionTrigger.MANUAL_ACTION],
      expectedResolutionEvents: [`${entityType}Updated`, `${entityType}Verified`],
      autoResolveTimeoutHours: undefined,
      confidenceScore,
      requiresManualReview,
    });
  }

  /**
   * Create a risk source for "Minor without Guardian"
   */
  public static createMinorWithoutGuardianRisk(minorId: string, familyId: string): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.GUARDIANSHIP_SERVICE,
      sourceEntityId: minorId,
      sourceEntityType: 'FamilyMember',
      sourceAggregateId: familyId,
      serviceName: 'family-service',
      detectionMethod: DetectionMethod.RULE_ENGINE,
      detectionRuleId: 'RULE_MINOR_GUARDIAN_REQUIRED',
      legalReferences: [
        {
          act: 'Children Act',
          section: '71',
          description: 'Every minor must have a legal guardian',
          isMandatory: true,
        },
      ],
      detectedAt: new Date(),
      resolutionTriggers: [ResolutionTrigger.EVENT_BASED, ResolutionTrigger.MANUAL_ACTION],
      expectedResolutionEvents: ['GuardianAppointed', 'GuardianshipCreated'],
      autoResolveTimeoutHours: undefined,
      confidenceScore: 0.98,
      requiresManualReview: true,
      notes: 'Minor detected without legal guardian. Required before filing.',
    });
  }

  /**
   * Create a risk source from Estate Service
   */
  public static fromEstateService(
    entityId: string,
    entityType: string,
    aggregateId: string,
    detectionMethod: DetectionMethod,
    ruleId: string,
    legalReference: LegalReference,
    requiresManualReview: boolean = false,
    confidenceScore: number = 0.9,
  ): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.ESTATE_SERVICE,
      sourceEntityId: entityId,
      sourceEntityType: entityType,
      sourceAggregateId: aggregateId,
      serviceName: 'estate-service',
      detectionMethod,
      detectionRuleId: ruleId,
      legalReferences: [legalReference],
      detectedAt: new Date(),
      resolutionTriggers: [ResolutionTrigger.EVENT_BASED, ResolutionTrigger.MANUAL_ACTION],
      expectedResolutionEvents: [`${entityType}Updated`, `${entityType}Verified`],
      autoResolveTimeoutHours: undefined,
      confidenceScore,
      requiresManualReview,
    });
  }

  /**
   * Create a risk source for "Unverified Asset"
   */
  public static createUnverifiedAssetRisk(
    assetId: string,
    estateId: string,
    assetType: string,
  ): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.ASSET_SERVICE,
      sourceEntityId: assetId,
      sourceEntityType: assetType,
      sourceAggregateId: estateId,
      serviceName: 'estate-service',
      detectionMethod: DetectionMethod.SYSTEM_SCAN,
      detectionRuleId: 'RULE_ASSET_VERIFICATION_REQUIRED',
      legalReferences: [
        {
          act: 'LSA',
          section: '83',
          subsection: '(f)',
          description: 'Executor must verify assets of the estate',
          isMandatory: true,
        },
      ],
      detectedAt: new Date(),
      resolutionTriggers: [ResolutionTrigger.EVENT_BASED],
      expectedResolutionEvents: ['AssetVerified', 'AssetUpdated'],
      autoResolveTimeoutHours: 168, // 7 days auto-resolve
      confidenceScore: 0.85,
      requiresManualReview: false,
      notes: `Asset ${assetType} requires verification before distribution.`,
    });
  }

  /**
   * Create a risk source from Will Service
   */
  public static fromWillService(
    willId: string,
    detectionMethod: DetectionMethod,
    ruleId: string,
    legalReferences: LegalReference[],
  ): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.WILL_SERVICE,
      sourceEntityId: willId,
      sourceEntityType: 'Will',
      sourceAggregateId: willId,
      serviceName: 'estate-service',
      detectionMethod,
      detectionRuleId: ruleId,
      legalReferences,
      detectedAt: new Date(),
      resolutionTriggers: [ResolutionTrigger.MANUAL_ACTION, ResolutionTrigger.COURT_ORDER],
      expectedResolutionEvents: ['WillUpdated', 'WillValidated'],
      autoResolveTimeoutHours: undefined,
      confidenceScore: 0.8,
      requiresManualReview: true,
    });
  }

  /**
   * Create a risk source from External Registry (KRA, Lands)
   */
  public static fromExternalRegistry(
    registryName: string,
    referenceNumber: string,
    detectionMethod: DetectionMethod,
    legalReference: LegalReference,
    autoResolveHours: number = 72,
  ): RiskSource {
    return new RiskSource({
      sourceType: this.getRegistrySourceType(registryName),
      sourceEntityId: referenceNumber,
      sourceEntityType: registryName,
      serviceName: registryName,
      detectionMethod,
      detectionRuleId: `REGISTRY_VALIDATION_${registryName}`,
      legalReferences: [legalReference],
      detectedAt: new Date(),
      resolutionTriggers: [ResolutionTrigger.EVENT_BASED, ResolutionTrigger.TIME_BASED],
      expectedResolutionEvents: [`${registryName}Verified`, `${registryName}Updated`],
      autoResolveTimeoutHours: autoResolveHours,
      confidenceScore: 0.95,
      requiresManualReview: false,
    });
  }

  /**
   * Create a risk source from Compliance Engine (internal rules)
   */
  public static fromComplianceEngine(
    ruleId: string,
    legalReferences: LegalReference[],
    requiresManualReview: boolean = true,
    confidenceScore: number = 0.9,
  ): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.COMPLIANCE_ENGINE,
      sourceEntityId: ruleId,
      sourceEntityType: 'ComplianceRule',
      sourceAggregateId: ruleId,
      serviceName: 'succession-automation',
      detectionMethod: DetectionMethod.RULE_ENGINE,
      detectionRuleId: ruleId,
      legalReferences,
      detectedAt: new Date(),
      resolutionTriggers: [ResolutionTrigger.MANUAL_ACTION, ResolutionTrigger.SYSTEM_AUTO],
      expectedResolutionEvents: ['ComplianceRuleUpdated', 'RiskFlagResolved'],
      autoResolveTimeoutHours: undefined,
      confidenceScore,
      requiresManualReview,
    });
  }

  /**
   * Generic factory
   */
  public static create(props: RiskSourceProps): RiskSource {
    return new RiskSource(props);
  }

  // ==================== HELPER METHODS ====================

  private static getRegistrySourceType(registryName: string): RiskSourceType {
    const registryMap: Record<string, RiskSourceType> = {
      KRA: RiskSourceType.KRA_SERVICE,
      'Lands Registry': RiskSourceType.LANDS_REGISTRY,
      NTSA: RiskSourceType.NTSA_SERVICE,
      'Company Registry': RiskSourceType.THIRD_PARTY_API,
      'Court Registry': RiskSourceType.THIRD_PARTY_API,
    };

    return registryMap[registryName] || RiskSourceType.THIRD_PARTY_API;
  }

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    return {
      sourceType: this.props.sourceType,
      sourceEntityId: this.props.sourceEntityId,
      sourceEntityType: this.props.sourceEntityType,
      sourceAggregateId: this.props.sourceAggregateId,
      serviceName: this.props.serviceName,
      detectionMethod: this.props.detectionMethod,
      detectionRuleId: this.props.detectionRuleId,
      legalReferences: this.props.legalReferences,
      detectedAt: this.props.detectedAt.toISOString(),
      resolutionTriggers: this.props.resolutionTriggers,
      expectedResolutionEvents: this.props.expectedResolutionEvents,
      autoResolveTimeoutHours: this.props.autoResolveTimeoutHours,
      confidenceScore: this.props.confidenceScore,
      requiresManualReview: this.props.requiresManualReview,
      notes: this.props.notes,

      // Derived properties for convenience
      fingerprint: this.getFingerprint(),
      description: this.toDescription(),
      primaryLegalBasis: this.getPrimaryLegalBasis(),
      allLegalBases: this.getAllLegalBases(),
      isExternalSource: this.isExternalSource(),
      isRegistrySource: this.isRegistrySource(),
      isEventResolvable: this.isEventResolvable(),
      canAutoResolve: this.canAutoResolve(),
      isValid: this.isValid(),
      autoResolveTime: this.getAutoResolveTime()?.toISOString(),
    };
  }
  /**
   * Reconstitute from persisted data
   * Use this for reconstituting from database JSON
   */
  public static reconstitute(json: Record<string, any>): RiskSource {
    return new RiskSource({
      sourceType: json.sourceType as RiskSourceType,
      sourceEntityId: json.sourceEntityId,
      sourceEntityType: json.sourceEntityType,
      sourceAggregateId: json.sourceAggregateId,
      serviceName: json.serviceName,
      detectionMethod: json.detectionMethod as DetectionMethod,
      detectionRuleId: json.detectionRuleId,
      legalReferences: json.legalReferences as LegalReference[],
      detectedAt: new Date(json.detectedAt),
      resolutionTriggers: json.resolutionTriggers as ResolutionTrigger[],
      expectedResolutionEvents: json.expectedResolutionEvents,
      autoResolveTimeoutHours: json.autoResolveTimeoutHours,
      confidenceScore: json.confidenceScore,
      requiresManualReview: json.requiresManualReview,
      notes: json.notes,
    });
  }
  /**
   * Deserialize from JSON
   */
  public static fromJSON(json: Record<string, any>): RiskSource {
    return new RiskSource({
      sourceType: json.sourceType as RiskSourceType,
      sourceEntityId: json.sourceEntityId,
      sourceEntityType: json.sourceEntityType,
      sourceAggregateId: json.sourceAggregateId,
      serviceName: json.serviceName,
      detectionMethod: json.detectionMethod as DetectionMethod,
      detectionRuleId: json.detectionRuleId,
      legalReferences: json.legalReferences as LegalReference[],
      detectedAt: new Date(json.detectedAt),
      resolutionTriggers: json.resolutionTriggers as ResolutionTrigger[],
      expectedResolutionEvents: json.expectedResolutionEvents,
      autoResolveTimeoutHours: json.autoResolveTimeoutHours,
      confidenceScore: json.confidenceScore,
      requiresManualReview: json.requiresManualReview,
      notes: json.notes,
    });
  }
}
