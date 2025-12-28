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
 *
 * LEGAL CONTEXT:
 * - S.83 LSA: Executors must account for their actions
 * - Court disputes: Need to prove when we detected a risk
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

  // Estate Service Sources
  ESTATE_SERVICE = 'ESTATE_SERVICE',
  WILL_SERVICE = 'WILL_SERVICE',

  // Infrastructure Sources
  DOCUMENT_SERVICE = 'DOCUMENT_SERVICE',
  EXTERNAL_REGISTRY = 'EXTERNAL_REGISTRY',

  // System-Level Sources
  COMPLIANCE_ENGINE = 'COMPLIANCE_ENGINE',
  USER_INPUT = 'USER_INPUT',
}

interface RiskSourceProps {
  sourceType: RiskSourceType;
  sourceEntityId?: string; // UUID of the specific entity (e.g., FamilyMember ID)
  sourceEntityType?: string; // Type name (e.g., "FamilyMember", "Asset", "Will")
  serviceName?: string; // Bounded context name (e.g., "family-service")
  detectionMethod: string; // How was this detected? (e.g., "RULE_ENGINE", "API_VALIDATION")
  legalBasis?: string; // Which law section? (e.g., "S.71 Children Act")
  detectedAt: Date;
}

export class RiskSource extends ValueObject<RiskSourceProps> {
  private constructor(props: RiskSourceProps) {
    super(props);
  }

  protected validate(): void {
    const { sourceType, detectionMethod, detectedAt } = this.props;

    if (!Object.values(RiskSourceType).includes(sourceType)) {
      throw new ValueObjectValidationError(`Invalid RiskSourceType: ${sourceType}`, 'sourceType');
    }

    if (!detectionMethod || detectionMethod.trim().length === 0) {
      throw new ValueObjectValidationError('Detection method is required', 'detectionMethod');
    }

    if (!(detectedAt instanceof Date) || isNaN(detectedAt.getTime())) {
      throw new ValueObjectValidationError('Invalid detection timestamp', 'detectedAt');
    }

    // BUSINESS RULE: If we reference an entity, we need both ID and Type
    if (this.props.sourceEntityId && !this.props.sourceEntityType) {
      throw new ValueObjectValidationError(
        'sourceEntityType is required when sourceEntityId is provided',
        'sourceEntityType',
      );
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

  get serviceName(): string | undefined {
    return this.props.serviceName;
  }

  get detectionMethod(): string {
    return this.props.detectionMethod;
  }

  get legalBasis(): string | undefined {
    return this.props.legalBasis;
  }

  get detectedAt(): Date {
    return this.props.detectedAt;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Is this risk from an external service (cross-bounded-context)?
   */
  public isExternalSource(): boolean {
    return [
      RiskSourceType.FAMILY_SERVICE,
      RiskSourceType.ESTATE_SERVICE,
      RiskSourceType.DOCUMENT_SERVICE,
    ].includes(this.props.sourceType);
  }

  /**
   * Is this risk from an external registry (KRA, Lands)?
   */
  public isRegistrySource(): boolean {
    return this.props.sourceType === RiskSourceType.EXTERNAL_REGISTRY;
  }

  /**
   * Can this risk be auto-resolved by listening to events?
   * (e.g., GuardianAppointed event will resolve "Minor without guardian")
   */
  public isEventResolvable(): boolean {
    return this.isExternalSource() && !!this.props.sourceEntityId;
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
      this.props.detectionMethod,
    ];
    return parts.join(':');
  }

  /**
   * Get a human-readable description of where this risk came from
   */
  public toDescription(): string {
    const parts: string[] = [];

    // Source type
    parts.push(`Source: ${this.props.sourceType}`);

    // Entity reference
    if (this.props.sourceEntityType && this.props.sourceEntityId) {
      parts.push(
        `Entity: ${this.props.sourceEntityType}[${this.props.sourceEntityId.substring(0, 8)}...]`,
      );
    }

    // Service name
    if (this.props.serviceName) {
      parts.push(`Service: ${this.props.serviceName}`);
    }

    // Detection method
    parts.push(`Detected via: ${this.props.detectionMethod}`);

    // Legal basis
    if (this.props.legalBasis) {
      parts.push(`Legal Basis: ${this.props.legalBasis}`);
    }

    return parts.join(' | ');
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a risk source from Family Service
   */
  public static fromFamilyService(
    entityId: string,
    entityType: string,
    detectionMethod: string,
    legalBasis?: string,
  ): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.FAMILY_SERVICE,
      sourceEntityId: entityId,
      sourceEntityType: entityType,
      serviceName: 'family-service',
      detectionMethod,
      legalBasis,
      detectedAt: new Date(),
    });
  }

  /**
   * Create a risk source from Estate Service
   */
  public static fromEstateService(
    entityId: string,
    entityType: string,
    detectionMethod: string,
    legalBasis?: string,
  ): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.ESTATE_SERVICE,
      sourceEntityId: entityId,
      sourceEntityType: entityType,
      serviceName: 'estate-service',
      detectionMethod,
      legalBasis,
      detectedAt: new Date(),
    });
  }

  /**
   * Create a risk source from Will Service
   */
  public static fromWillService(
    willId: string,
    detectionMethod: string,
    legalBasis?: string,
  ): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.WILL_SERVICE,
      sourceEntityId: willId,
      sourceEntityType: 'Will',
      serviceName: 'estate-service',
      detectionMethod,
      legalBasis,
      detectedAt: new Date(),
    });
  }

  /**
   * Create a risk source from Document Service
   */
  public static fromDocumentService(
    documentId: string,
    documentType: string,
    detectionMethod: string,
  ): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.DOCUMENT_SERVICE,
      sourceEntityId: documentId,
      sourceEntityType: documentType,
      serviceName: 'document-service',
      detectionMethod,
      detectedAt: new Date(),
    });
  }

  /**
   * Create a risk source from External Registry (KRA, Lands)
   */
  public static fromExternalRegistry(
    registryName: string,
    detectionMethod: string,
    referenceNumber?: string,
  ): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.EXTERNAL_REGISTRY,
      sourceEntityId: referenceNumber,
      sourceEntityType: registryName,
      serviceName: registryName,
      detectionMethod,
      detectedAt: new Date(),
    });
  }

  /**
   * Create a risk source from Compliance Engine (internal rules)
   */
  public static fromComplianceEngine(ruleId: string, legalBasis: string): RiskSource {
    return new RiskSource({
      sourceType: RiskSourceType.COMPLIANCE_ENGINE,
      sourceEntityId: ruleId,
      sourceEntityType: 'ComplianceRule',
      serviceName: 'succession-automation',
      detectionMethod: 'RULE_ENGINE',
      legalBasis,
      detectedAt: new Date(),
    });
  }

  /**
   * Generic factory
   */
  public static create(props: RiskSourceProps): RiskSource {
    return new RiskSource(props);
  }

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    return {
      sourceType: this.props.sourceType,
      sourceEntityId: this.props.sourceEntityId,
      sourceEntityType: this.props.sourceEntityType,
      serviceName: this.props.serviceName,
      detectionMethod: this.props.detectionMethod,
      legalBasis: this.props.legalBasis,
      detectedAt: this.props.detectedAt.toISOString(),
      // Derived properties
      fingerprint: this.getFingerprint(),
      description: this.toDescription(),
    };
  }

  /**
   * Deserialize from JSON
   */
  public static fromJSON(json: Record<string, any>): RiskSource {
    return new RiskSource({
      sourceType: json.sourceType as RiskSourceType,
      sourceEntityId: json.sourceEntityId,
      sourceEntityType: json.sourceEntityType,
      serviceName: json.serviceName,
      detectionMethod: json.detectionMethod,
      legalBasis: json.legalBasis,
      detectedAt: new Date(json.detectedAt),
    });
  }
}
