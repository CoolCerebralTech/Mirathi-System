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
 * Interface representing the Raw Prisma Model Structure
 * Based on schema.prisma: model RiskFlag
 */
export interface PrismaRiskFlagModel {
  id: string;
  assessmentId: string;
  severity: string; // Enum string
  category: string; // Enum string
  riskStatus: string; // Enum string
  description: string;
  legalBasis: string;
  mitigationSteps: string[];

  // Flattened Source Fields
  sourceType: string; // Enum string
  serviceName: string;
  detectionMethod: string; // Enum string
  detectionRuleId: string;
  sourceEntityId: string | null;
  sourceEntityType: string | null;
  sourceAggregateId: string | null;
  sourceDetails: any; // Json

  isBlocking: boolean;
  impactScore: number;
  affectedEntityIds: string[];
  affectedAggregateIds: string[];
  documentGap: any; // Json

  expectedResolutionEvents: string[];
  autoResolveTimeout: Date | null;

  // Resolution
  isResolved: boolean; // Computed in Prisma, but stored
  resolvedAt: Date | null;
  resolutionMethod: string | null; // Enum string
  resolvedBy: string | null;
  resolutionNotes: string | null;

  lastReviewedAt: Date;
  reviewCount: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * RiskFlag Mapper
 *
 * RESPONSIBILITY:
 * Handles bidirectional mapping between Domain Entities and Persistence Models.
 * Ensures Value Objects (RiskSource, DocumentGap) are correctly serialized/hydrated.
 */
export class RiskFlagMapper {
  /**
   * Map Domain Entity to Prisma Persistence Object (Create/Update Input)
   */
  public static toPersistence(domainEntity: RiskFlag, assessmentId?: string): any {
    // 1. Validate required foreign keys for creation
    // Note: specific checks usually happen in the Service, but we enforce integrity here
    if (!assessmentId && !domainEntity.id) {
      // logic for update or create check
    }

    const source = domainEntity.source;
    const documentGap = domainEntity.documentGap;

    // 2. Construct the Persistence Object
    // We intentionally do NOT use JSON.stringify on 'sourceDetails' and 'documentGap'
    // because Prisma Client handles object-to-json serialization automatically.
    return {
      // --- IDs ---
      id: domainEntity.id.toString(),
      ...(assessmentId ? { assessmentId } : {}),

      // --- Enums & Core Data ---
      severity: domainEntity.severity, // Maps directly to Prisma Enum if names match
      category: domainEntity.category, // Maps directly
      riskStatus: domainEntity.riskStatus, // Maps directly
      description: domainEntity.description,
      legalBasis: domainEntity.legalBasis,
      mitigationSteps: domainEntity.mitigationSteps,

      // --- Flattened Source Data (For SQL Indexing) ---
      // FIX: Updated to match correct Getters in RiskSource Value Object
      sourceType: source.sourceType,
      serviceName: source.serviceName,
      detectionMethod: source.detectionMethod,
      detectionRuleId: domainEntity.detectionRuleId, // Rule ID is on Entity root
      sourceEntityId: source.sourceEntityId || null,
      sourceEntityType: source.sourceEntityType || null,
      sourceAggregateId: source.sourceAggregateId || null,

      // --- Rich Source Data (Full Value Object) ---
      sourceDetails: source.toJSON(),

      // --- Impact ---
      isBlocking: domainEntity.isBlocking,
      impactScore: domainEntity.impactScore,
      affectedEntityIds: domainEntity.affectedEntityIds,
      affectedAggregateIds: domainEntity.affectedAggregateIds,

      // --- Document Gap (Value Object) ---
      documentGap: documentGap ? documentGap.toJSON() : null,

      // --- Resolution Logic ---
      expectedResolutionEvents: domainEntity.expectedResolutionEvents,
      autoResolveTimeout: domainEntity.autoResolveTimeout || null,

      // --- Resolution State ---
      isResolved: domainEntity.isResolved,
      resolvedAt: domainEntity.resolvedAt || null,
      resolutionMethod: domainEntity.resolutionMethod || null,
      resolvedBy: domainEntity.resolvedBy || null,
      resolutionNotes: domainEntity.resolutionNotes || null,

      // --- Review Metadata ---
      lastReviewedAt: domainEntity.lastReviewedAt,
      reviewCount: domainEntity.reviewCount,

      // Timestamps handled by Prisma usually, but passing them for consistency
      updatedAt: new Date(),
    };
  }

  /**
   * Map Prisma Model to Domain Entity
   */
  public static toDomain(raw: PrismaRiskFlagModel): RiskFlag {
    if (!raw) {
      throw new Error('RiskFlagMapper: Cannot map null persistence model to domain.');
    }

    // 1. Reconstitute RiskSource Value Object
    let riskSource: RiskSource;

    // Handle JSON field: Prisma returns an Object, but sometimes it might be a string in weird raw query edge cases
    const sourceJson = this.parseJsonField(raw.sourceDetails);

    if (sourceJson) {
      // Preferred: Reconstitute from full JSON object
      riskSource = RiskSource.reconstitute(sourceJson);
    } else {
      // Fallback: Reconstruct from flattened columns (Legacy support or data repair)
      riskSource = new RiskSource({
        sourceType: raw.sourceType as RiskSourceType,
        sourceEntityId: raw.sourceEntityId || undefined,
        sourceEntityType: raw.sourceEntityType || undefined,
        sourceAggregateId: raw.sourceAggregateId || undefined,
        serviceName: raw.serviceName,
        detectionMethod: raw.detectionMethod as DetectionMethod,
        detectionRuleId: raw.detectionRuleId,
        legalReferences: [], // Lost in flattening
        detectedAt: raw.createdAt, // Approximation
        resolutionTriggers: [], // Lost in flattening
        confidenceScore: 0.5, // Default
        requiresManualReview: true,
      });
    }

    // 2. Reconstitute DocumentGap Value Object
    let documentGap: DocumentGap | undefined;
    const docGapJson = this.parseJsonField(raw.documentGap);

    if (docGapJson) {
      documentGap = DocumentGap.reconstitute(docGapJson);
    }

    // 3. Prepare Domain Props
    // We explicitly cast Enums to ensure strict type compatibility
    const props = {
      severity: raw.severity as RiskSeverity,
      category: raw.category as RiskCategory,
      description: raw.description,
      source: riskSource,
      legalBasis: raw.legalBasis,
      mitigationSteps: raw.mitigationSteps,
      documentGap: documentGap,
      affectedEntityIds: raw.affectedEntityIds,
      affectedAggregateIds: raw.affectedAggregateIds,
      riskStatus: raw.riskStatus as RiskStatus,
      resolvedAt: raw.resolvedAt || undefined,
      resolutionMethod: raw.resolutionMethod
        ? (raw.resolutionMethod as ResolutionMethod)
        : undefined,
      resolutionNotes: raw.resolutionNotes || undefined,
      resolvedBy: raw.resolvedBy || undefined,
      expectedResolutionEvents: raw.expectedResolutionEvents,
      autoResolveTimeout: raw.autoResolveTimeout || undefined,
      isBlocking: raw.isBlocking,
      impactScore: raw.impactScore,
      detectionRuleId: raw.detectionRuleId,
      lastReviewedAt: raw.lastReviewedAt,
      reviewCount: raw.reviewCount,
    };

    // 4. Reconstitute Entity
    // Note: We use the Entity's static reconstitute method to bypass logic validation that runs on create()
    return RiskFlag.reconstitute(raw.id, props, raw.createdAt, raw.updatedAt);
  }

  /**
   * Helper to safely parse Prisma JSON fields
   * Handles cases where data might be an Object (standard) or String (raw query)
   */
  private static parseJsonField(field: any): any {
    if (field === null || field === undefined) {
      return null;
    }

    if (typeof field === 'object') {
      return field;
    }

    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.error(`RiskFlagMapper: Failed to parse JSON string: ${field}`, e);
        return null;
      }
    }

    return null;
  }
}
