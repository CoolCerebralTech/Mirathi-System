// src/succession-automation/src/infrastructure/persistence/mappers/risk-flag.mapper.ts
import {
  ResolutionMethod,
  RiskCategory,
  RiskFlag,
  RiskSeverity,
  RiskStatus,
} from '../../../domain/entities/risk-flag.entity';
import { DocumentGap } from '../../../domain/value-objects/document-gap.vo';
import {
  DetectionMethod,
  RiskSource,
  RiskSourceType,
} from '../../../domain/value-objects/risk-source.vo';

/**
 * RiskFlag Mapper
 *
 * PURPOSE: Translates between Domain Entity and Prisma Model for Risk Flags
 *
 * UPDATED: Now uses proper reconstitute methods for Value Objects
 */

export class RiskFlagMapper {
  /**
   * Map Domain Entity to Prisma Model for CREATE operations
   */
  public static toPersistenceCreate(domainEntity: RiskFlag, assessmentId: string): any {
    if (!assessmentId) {
      throw new Error('RiskFlag must have assessmentId for persistence');
    }

    // Get props from domain entity
    const props = (domainEntity as any).props;

    // Extract source details
    const source = props.source;
    const sourceJson = source ? source.toJSON() : null;

    // Build the persistence object
    const persistence: any = {
      // --- Core Risk Info ---
      severity: this.mapDomainRiskSeverityToPrisma(props.severity),
      category: this.mapDomainRiskCategoryToPrisma(props.category),
      riskStatus: this.mapDomainRiskStatusToPrisma(props.riskStatus),
      description: props.description,
      legalBasis: props.legalBasis || '',

      // --- Mitigation Steps ---
      mitigationSteps: props.mitigationSteps || [],

      // --- Source Information ---
      sourceType: source?.type || '',
      serviceName: source?.serviceName || '',
      detectionMethod: source?.detectionMethod || '',
      detectionRuleId: props.detectionRuleId || '',
      sourceEntityId: source?.entityId || null,
      sourceEntityType: source?.entityType || null,
      sourceAggregateId: source?.aggregateId || null,
      sourceDetails: sourceJson ? JSON.stringify(sourceJson) : null,

      // --- Risk Impact ---
      isBlocking: props.isBlocking || false,
      impactScore: props.impactScore || 0,

      // --- Affected Scope ---
      affectedEntityIds: props.affectedEntityIds || [],
      affectedAggregateIds: props.affectedAggregateIds || [],

      // --- Document Gap ---
      documentGap: props.documentGap ? JSON.stringify(props.documentGap.toJSON()) : null,

      // --- Resolution Logic ---
      expectedResolutionEvents: props.expectedResolutionEvents || [],
      autoResolveTimeout: props.autoResolveTimeout || null,

      // --- Resolution State ---
      resolvedAt: props.resolvedAt || null,
      resolutionMethod: props.resolutionMethod
        ? this.mapDomainResolutionMethodToPrisma(props.resolutionMethod)
        : null,
      resolvedBy: props.resolvedBy || null,
      resolutionNotes: props.resolutionNotes || null,

      // --- Review Metadata ---
      lastReviewedAt: props.lastReviewedAt || new Date(),
      reviewCount: props.reviewCount || 0,

      // --- Foreign Key ---
      assessmentId: assessmentId,
    };

    return persistence;
  }

  /**
   * Map Domain Entity to Prisma Model for UPDATE operations
   */
  public static toPersistenceUpdate(domainEntity: RiskFlag): any {
    const props = (domainEntity as any).props;

    const updateData: any = {
      // --- Status & Resolution ---
      riskStatus: this.mapDomainRiskStatusToPrisma(props.riskStatus),
      resolvedAt: props.resolvedAt || null,
      resolutionMethod: props.resolutionMethod
        ? this.mapDomainResolutionMethodToPrisma(props.resolutionMethod)
        : null,
      resolvedBy: props.resolvedBy || null,
      resolutionNotes: props.resolutionNotes || null,

      // --- Severity & Impact ---
      severity: this.mapDomainRiskSeverityToPrisma(props.severity),
      isBlocking: props.isBlocking || false,
      impactScore: props.impactScore || 0,

      // --- Mitigation Steps ---
      mitigationSteps: props.mitigationSteps || [],

      // --- Affected Scope ---
      affectedEntityIds: props.affectedEntityIds || [],
      affectedAggregateIds: props.affectedAggregateIds || [],

      // --- Document Gap ---
      documentGap: props.documentGap ? JSON.stringify(props.documentGap.toJSON()) : null,

      // --- Resolution Logic ---
      autoResolveTimeout: props.autoResolveTimeout || null,

      // --- Review Metadata ---
      lastReviewedAt: props.lastReviewedAt || new Date(),
      reviewCount: props.reviewCount || 0,
    };

    return updateData;
  }

  /**
   * Map Prisma Model to Domain Entity for READ operations
   */
  public static toDomain(prismaModel: any): RiskFlag {
    if (!prismaModel) {
      throw new Error('Prisma model cannot be null');
    }

    // Parse JSON fields
    if (prismaModel.sourceDetails && typeof prismaModel.sourceDetails === 'string') {
      try {
        /* empty */
      } catch (error) {
        console.warn('Failed to parse sourceDetails JSON:', error);
      }
    }

    if (prismaModel.documentGap && typeof prismaModel.documentGap === 'string') {
      try {
        /* empty */
      } catch (error) {
        console.warn('Failed to parse documentGap JSON:', error);
      }
    }

    // Build RiskSource value object
    let riskSource: RiskSource;
    if (prismaModel.sourceDetails && typeof prismaModel.sourceDetails === 'string') {
      try {
        const sourceDetails = JSON.parse(prismaModel.sourceDetails);
        riskSource = RiskSource.reconstitute(sourceDetails);
      } catch (error) {
        console.warn('Failed to reconstruct RiskSource from JSON:', error);
        // Fallback to building from individual columns
        riskSource = new RiskSource({
          sourceType: prismaModel.sourceType as RiskSourceType,
          sourceEntityId: prismaModel.sourceEntityId || undefined,
          sourceEntityType: prismaModel.sourceEntityType || undefined,
          sourceAggregateId: prismaModel.sourceAggregateId || undefined,
          serviceName: prismaModel.serviceName || '',
          detectionMethod: prismaModel.detectionMethod as DetectionMethod,
          detectionRuleId: prismaModel.detectionRuleId || '',
          legalReferences: [],
          detectedAt: new Date(),
          resolutionTriggers: [],
          confidenceScore: 0.5,
          requiresManualReview: true,
        });
      }
    } else {
      // Build from individual columns if sourceDetails is not available
      riskSource = new RiskSource({
        sourceType: prismaModel.sourceType as RiskSourceType,
        sourceEntityId: prismaModel.sourceEntityId || undefined,
        sourceEntityType: prismaModel.sourceEntityType || undefined,
        sourceAggregateId: prismaModel.sourceAggregateId || undefined,
        serviceName: prismaModel.serviceName || '',
        detectionMethod: prismaModel.detectionMethod as DetectionMethod,
        detectionRuleId: prismaModel.detectionRuleId || '',
        legalReferences: [],
        detectedAt: new Date(),
        resolutionTriggers: [],
        confidenceScore: 0.5,
        requiresManualReview: true,
      });
    }

    // For DocumentGap:
    let documentGap: DocumentGap | undefined = undefined;
    if (prismaModel.documentGap && typeof prismaModel.documentGap === 'string') {
      try {
        const documentGapData = JSON.parse(prismaModel.documentGap);
        documentGap = DocumentGap.reconstitute(documentGapData);
      } catch (error) {
        console.warn('Failed to reconstruct DocumentGap from JSON:', error);
      }
    }

    // Prepare domain properties
    const domainProps = {
      // --- Core Risk Info ---
      severity: this.mapPrismaRiskSeverityToDomain(prismaModel.severity),
      category: this.mapPrismaRiskCategoryToDomain(prismaModel.category),
      description: prismaModel.description,
      source: riskSource,
      legalBasis: prismaModel.legalBasis,

      // --- Mitigation Steps ---
      mitigationSteps: Array.isArray(prismaModel.mitigationSteps)
        ? prismaModel.mitigationSteps
        : [],

      // --- Document Gap ---
      documentGap: documentGap,

      // --- Affected Scope ---
      affectedEntityIds: Array.isArray(prismaModel.affectedEntityIds)
        ? prismaModel.affectedEntityIds
        : [],
      affectedAggregateIds: Array.isArray(prismaModel.affectedAggregateIds)
        ? prismaModel.affectedAggregateIds
        : [],

      // --- Risk Status ---
      riskStatus: this.mapPrismaRiskStatusToDomain(prismaModel.riskStatus),

      // --- Resolution Details ---
      resolvedAt: prismaModel.resolvedAt || undefined,
      resolutionMethod: prismaModel.resolutionMethod
        ? this.mapPrismaResolutionMethodToDomain(prismaModel.resolutionMethod)
        : undefined,
      resolutionNotes: prismaModel.resolutionNotes || undefined,
      resolvedBy: prismaModel.resolvedBy || undefined,

      // --- Resolution Logic ---
      expectedResolutionEvents: Array.isArray(prismaModel.expectedResolutionEvents)
        ? prismaModel.expectedResolutionEvents
        : [],
      autoResolveTimeout: prismaModel.autoResolveTimeout || undefined,

      // --- Risk Impact ---
      isBlocking: prismaModel.isBlocking || false,
      impactScore: prismaModel.impactScore || 0,

      // --- Detection Info ---
      detectionRuleId: prismaModel.detectionRuleId || '',

      // --- Review Metadata ---
      lastReviewedAt: prismaModel.lastReviewedAt || new Date(),
      reviewCount: prismaModel.reviewCount || 0,
    };

    // Get timestamps
    const createdAt = prismaModel.createdAt || new Date();
    const updatedAt = prismaModel.updatedAt || new Date();

    // Reconstitute the domain entity
    return RiskFlag.reconstitute(prismaModel.id, domainProps, createdAt, updatedAt);
  }

  /**
   * Map multiple Prisma models to Domain Entities
   */
  public static toDomainArray(prismaModels: any[]): RiskFlag[] {
    return prismaModels.map((model) => this.toDomain(model));
  }

  /**
   * Extract ID for persistence operations
   */
  public static getPersistenceId(domainEntity: RiskFlag): string | null {
    return domainEntity.id ? domainEntity.id.toString() : null;
  }

  // ==================== ENUM MAPPING HELPERS ====================

  /**
   * Map Domain RiskSeverity to Prisma string
   */
  private static mapDomainRiskSeverityToPrisma(severity: RiskSeverity): string {
    const mapping: Record<RiskSeverity, string> = {
      [RiskSeverity.CRITICAL]: 'CRITICAL',
      [RiskSeverity.HIGH]: 'HIGH',
      [RiskSeverity.MEDIUM]: 'MEDIUM',
      [RiskSeverity.LOW]: 'LOW',
    };

    const prismaSeverity = mapping[severity];
    if (!prismaSeverity) {
      throw new Error(`Invalid RiskSeverity: ${severity}`);
    }
    return prismaSeverity;
  }

  /**
   * Map Prisma RiskSeverity string to Domain
   */
  private static mapPrismaRiskSeverityToDomain(severity: string): RiskSeverity {
    const mapping: Record<string, RiskSeverity> = {
      CRITICAL: RiskSeverity.CRITICAL,
      HIGH: RiskSeverity.HIGH,
      MEDIUM: RiskSeverity.MEDIUM,
      LOW: RiskSeverity.LOW,
    };

    const domainSeverity = mapping[severity];
    if (!domainSeverity) {
      throw new Error(`Invalid Prisma RiskSeverity: ${severity}`);
    }
    return domainSeverity;
  }

  /**
   * Map Domain RiskCategory to Prisma string
   */
  private static mapDomainRiskCategoryToPrisma(category: RiskCategory): string {
    const mapping: Record<RiskCategory, string> = {
      [RiskCategory.MISSING_DOCUMENT]: 'MISSING_DOCUMENT',
      [RiskCategory.INVALID_DOCUMENT]: 'INVALID_DOCUMENT',
      [RiskCategory.EXPIRED_DOCUMENT]: 'EXPIRED_DOCUMENT',
      [RiskCategory.FORGED_DOCUMENT]: 'FORGED_DOCUMENT',
      [RiskCategory.MINOR_WITHOUT_GUARDIAN]: 'MINOR_WITHOUT_GUARDIAN',
      [RiskCategory.UNDEFINED_POLYGAMOUS_STRUCTURE]: 'UNDEFINED_POLYGAMOUS_STRUCTURE',
      [RiskCategory.DISPUTED_RELATIONSHIP]: 'DISPUTED_RELATIONSHIP',
      [RiskCategory.COHABITATION_CLAIM]: 'COHABITATION_CLAIM',
      [RiskCategory.ILLEGITIMATE_CHILD_CLAIM]: 'ILLEGITIMATE_CHILD_CLAIM',
      [RiskCategory.ASSET_VERIFICATION_FAILED]: 'ASSET_VERIFICATION_FAILED',
      [RiskCategory.INSOLVENT_ESTATE]: 'INSOLVENT_ESTATE',
      [RiskCategory.MISSING_ASSET_VALUATION]: 'MISSING_ASSET_VALUATION',
      [RiskCategory.ENCUMBERED_ASSET]: 'ENCUMBERED_ASSET',
      [RiskCategory.FRAUDULENT_ASSET_TRANSFER]: 'FRAUDULENT_ASSET_TRANSFER',
      [RiskCategory.INVALID_WILL_SIGNATURE]: 'INVALID_WILL_SIGNATURE',
      [RiskCategory.MINOR_EXECUTOR]: 'MINOR_EXECUTOR',
      [RiskCategory.BENEFICIARY_AS_WITNESS]: 'BENEFICIARY_AS_WITNESS',
      [RiskCategory.CONTESTED_WILL]: 'CONTESTED_WILL',
      [RiskCategory.UNDUE_INFLUENCE]: 'UNDUE_INFLUENCE',
      [RiskCategory.WRONG_COURT]: 'WRONG_COURT',
      [RiskCategory.NON_RESIDENT_APPLICANT]: 'NON_RESIDENT_APPLICANT',
      [RiskCategory.FORUM_NON_CONVENIENS]: 'FORUM_NON_CONVENIENS',
      [RiskCategory.TAX_CLEARANCE_MISSING]: 'TAX_CLEARANCE_MISSING',
      [RiskCategory.KRA_PIN_MISSING]: 'KRA_PIN_MISSING',
      [RiskCategory.CAPITAL_GAINS_TAX_UNPAID]: 'CAPITAL_GAINS_TAX_UNPAID',
      [RiskCategory.STATUTE_BARRED_DEBT]: 'STATUTE_BARRED_DEBT',
      [RiskCategory.DELAYED_FILING]: 'DELAYED_FILING',
      [RiskCategory.FAMILY_DISPUTE]: 'FAMILY_DISPUTE',
      [RiskCategory.CRIMINAL_INVESTIGATION]: 'CRIMINAL_INVESTIGATION',
      [RiskCategory.BANKRUPTCY_PENDING]: 'BANKRUPTCY_PENDING',
      [RiskCategory.DATA_INCONSISTENCY]: 'DATA_INCONSISTENCY',
      [RiskCategory.EXTERNAL_API_FAILURE]: 'EXTERNAL_API_FAILURE',
    };

    const prismaCategory = mapping[category];
    if (!prismaCategory) {
      throw new Error(`Invalid RiskCategory: ${category}`);
    }
    return prismaCategory;
  }

  /**
   * Map Prisma RiskCategory string to Domain
   */
  private static mapPrismaRiskCategoryToDomain(category: string): RiskCategory {
    const mapping: Record<string, RiskCategory> = {
      MISSING_DOCUMENT: RiskCategory.MISSING_DOCUMENT,
      INVALID_DOCUMENT: RiskCategory.INVALID_DOCUMENT,
      EXPIRED_DOCUMENT: RiskCategory.EXPIRED_DOCUMENT,
      FORGED_DOCUMENT: RiskCategory.FORGED_DOCUMENT,
      MINOR_WITHOUT_GUARDIAN: RiskCategory.MINOR_WITHOUT_GUARDIAN,
      UNDEFINED_POLYGAMOUS_STRUCTURE: RiskCategory.UNDEFINED_POLYGAMOUS_STRUCTURE,
      DISPUTED_RELATIONSHIP: RiskCategory.DISPUTED_RELATIONSHIP,
      COHABITATION_CLAIM: RiskCategory.COHABITATION_CLAIM,
      ILLEGITIMATE_CHILD_CLAIM: RiskCategory.ILLEGITIMATE_CHILD_CLAIM,
      ASSET_VERIFICATION_FAILED: RiskCategory.ASSET_VERIFICATION_FAILED,
      INSOLVENT_ESTATE: RiskCategory.INSOLVENT_ESTATE,
      MISSING_ASSET_VALUATION: RiskCategory.MISSING_ASSET_VALUATION,
      ENCUMBERED_ASSET: RiskCategory.ENCUMBERED_ASSET,
      FRAUDULENT_ASSET_TRANSFER: RiskCategory.FRAUDULENT_ASSET_TRANSFER,
      INVALID_WILL_SIGNATURE: RiskCategory.INVALID_WILL_SIGNATURE,
      MINOR_EXECUTOR: RiskCategory.MINOR_EXECUTOR,
      BENEFICIARY_AS_WITNESS: RiskCategory.BENEFICIARY_AS_WITNESS,
      CONTESTED_WILL: RiskCategory.CONTESTED_WILL,
      UNDUE_INFLUENCE: RiskCategory.UNDUE_INFLUENCE,
      WRONG_COURT: RiskCategory.WRONG_COURT,
      NON_RESIDENT_APPLICANT: RiskCategory.NON_RESIDENT_APPLICANT,
      FORUM_NON_CONVENIENS: RiskCategory.FORUM_NON_CONVENIENS,
      TAX_CLEARANCE_MISSING: RiskCategory.TAX_CLEARANCE_MISSING,
      KRA_PIN_MISSING: RiskCategory.KRA_PIN_MISSING,
      CAPITAL_GAINS_TAX_UNPAID: RiskCategory.CAPITAL_GAINS_TAX_UNPAID,
      STATUTE_BARRED_DEBT: RiskCategory.STATUTE_BARRED_DEBT,
      DELAYED_FILING: RiskCategory.DELAYED_FILING,
      FAMILY_DISPUTE: RiskCategory.FAMILY_DISPUTE,
      CRIMINAL_INVESTIGATION: RiskCategory.CRIMINAL_INVESTIGATION,
      BANKRUPTCY_PENDING: RiskCategory.BANKRUPTCY_PENDING,
      DATA_INCONSISTENCY: RiskCategory.DATA_INCONSISTENCY,
      EXTERNAL_API_FAILURE: RiskCategory.EXTERNAL_API_FAILURE,
    };

    const domainCategory = mapping[category];
    if (!domainCategory) {
      throw new Error(`Invalid Prisma RiskCategory: ${category}`);
    }
    return domainCategory;
  }

  /**
   * Map Domain RiskStatus to Prisma string
   */
  private static mapDomainRiskStatusToPrisma(status: RiskStatus): string {
    const mapping: Record<RiskStatus, string> = {
      [RiskStatus.ACTIVE]: 'ACTIVE',
      [RiskStatus.RESOLVED]: 'RESOLVED',
      [RiskStatus.SUPERSEDED]: 'SUPERSEDED',
      [RiskStatus.EXPIRED]: 'EXPIRED',
      [RiskStatus.DISPUTED]: 'DISPUTED',
    };

    const prismaStatus = mapping[status];
    if (!prismaStatus) {
      throw new Error(`Invalid RiskStatus: ${status}`);
    }
    return prismaStatus;
  }

  /**
   * Map Prisma RiskStatus string to Domain
   */
  private static mapPrismaRiskStatusToDomain(status: string): RiskStatus {
    const mapping: Record<string, RiskStatus> = {
      ACTIVE: RiskStatus.ACTIVE,
      RESOLVED: RiskStatus.RESOLVED,
      SUPERSEDED: RiskStatus.SUPERSEDED,
      EXPIRED: RiskStatus.EXPIRED,
      DISPUTED: RiskStatus.DISPUTED,
    };

    const domainStatus = mapping[status];
    if (!domainStatus) {
      throw new Error(`Invalid Prisma RiskStatus: ${status}`);
    }
    return domainStatus;
  }

  /**
   * Map Domain ResolutionMethod to Prisma string
   */
  private static mapDomainResolutionMethodToPrisma(method: ResolutionMethod): string {
    const mapping: Record<ResolutionMethod, string> = {
      [ResolutionMethod.EVENT_DRIVEN]: 'EVENT_DRIVEN',
      [ResolutionMethod.MANUAL_RESOLUTION]: 'MANUAL_RESOLUTION',
      [ResolutionMethod.SYSTEM_AUTO_RESOLVE]: 'SYSTEM_AUTO_RESOLVE',
      [ResolutionMethod.COURT_ORDER]: 'COURT_ORDER',
      [ResolutionMethod.TIME_BASED]: 'TIME_BASED',
      [ResolutionMethod.ADMIN_OVERRIDE]: 'ADMIN_OVERRIDE',
    };

    const prismaMethod = mapping[method];
    if (!prismaMethod) {
      throw new Error(`Invalid ResolutionMethod: ${method}`);
    }
    return prismaMethod;
  }

  /**
   * Map Prisma ResolutionMethod string to Domain
   */
  private static mapPrismaResolutionMethodToDomain(method: string): ResolutionMethod {
    const mapping: Record<string, ResolutionMethod> = {
      EVENT_DRIVEN: ResolutionMethod.EVENT_DRIVEN,
      MANUAL_RESOLUTION: ResolutionMethod.MANUAL_RESOLUTION,
      SYSTEM_AUTO_RESOLVE: ResolutionMethod.SYSTEM_AUTO_RESOLVE,
      COURT_ORDER: ResolutionMethod.COURT_ORDER,
      TIME_BASED: ResolutionMethod.TIME_BASED,
      ADMIN_OVERRIDE: ResolutionMethod.ADMIN_OVERRIDE,
    };

    const domainMethod = mapping[method];
    if (!domainMethod) {
      throw new Error(`Invalid Prisma ResolutionMethod: ${method}`);
    }
    return domainMethod;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract domain entity IDs from Prisma models
   */
  public static extractIds(prismaModels: any[]): string[] {
    return prismaModels.map((model) => model.id);
  }

  /**
   * Check if a risk is currently blocking
   */
  public static isBlocking(prismaModel: any): boolean {
    const severity = prismaModel.severity;
    const riskStatus = prismaModel.riskStatus;

    return severity === 'CRITICAL' && riskStatus === 'ACTIVE';
  }

  /**
   * Check if risk should be auto-resolved
   */
  public static shouldAutoResolve(prismaModel: any, now: Date = new Date()): boolean {
    if (prismaModel.riskStatus !== 'ACTIVE') {
      return false;
    }

    if (!prismaModel.autoResolveTimeout) {
      return false;
    }

    const timeout = new Date(prismaModel.autoResolveTimeout);
    return now >= timeout;
  }

  /**
   * Create update data for risk resolution
   */
  public static createResolutionUpdateData(
    method: string,
    resolvedBy: string,
    notes?: string,
  ): any {
    return {
      riskStatus: 'RESOLVED',
      resolvedAt: new Date(),
      resolutionMethod: method,
      resolvedBy,
      resolutionNotes: notes || `Resolved via ${method}`,
      autoResolveTimeout: null,
      lastReviewedAt: new Date(),
      reviewCount: { increment: 1 },
    };
  }

  /**
   * Validate Prisma model before conversion
   */
  public static validatePrismaModel(prismaModel: any): string[] {
    const errors: string[] = [];

    if (!prismaModel.severity) {
      errors.push('severity is required');
    }

    if (!prismaModel.category) {
      errors.push('category is required');
    }

    if (!prismaModel.riskStatus) {
      errors.push('riskStatus is required');
    }

    if (!prismaModel.description) {
      errors.push('description is required');
    }

    if (!prismaModel.legalBasis) {
      errors.push('legalBasis is required');
    }

    if (!prismaModel.assessmentId) {
      errors.push('assessmentId is required');
    }

    return errors;
  }
}

// ==================== TYPE UTILITIES ====================

export interface RiskFlagCreateData {
  severity: string;
  category: string;
  description: string;
  legalBasis: string;
  assessmentId: string;
  detectionRuleId: string;
}

export interface RiskFlagUpdateData {
  riskStatus?: string;
  severity?: string;
  isBlocking?: boolean;
  impactScore?: number;
  resolvedAt?: Date;
  resolutionMethod?: string;
  resolutionNotes?: string;
  autoResolveTimeout?: Date;
}

export interface RiskFlagFilter {
  assessmentId?: string;
  severity?: string[];
  category?: string[];
  riskStatus?: string[];
  isBlocking?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}
