// src/succession-automation/src/infrastructure/persistence/mappers/readiness-assessment.mapper.ts
import {
  ReadinessAssessment,
  ReadinessAssessmentProps,
} from '../../../domain/aggregates/readiness-assessment.aggregate';
import { RiskFlag } from '../../../domain/entities/risk-flag.entity';
import { DocumentGap } from '../../../domain/value-objects/document-gap.vo';
import { ReadinessScore } from '../../../domain/value-objects/readiness-score.vo';
import { SuccessionContext } from '../../../domain/value-objects/succession-context.vo';
import { PrismaRiskFlagModel, RiskFlagMapper } from './risk-flag.mapper';

/**
 * Interface representing the Raw Prisma Model Structure
 * Based on schema.prisma: model ReadinessAssessment
 */
export interface PrismaReadinessAssessmentModel {
  id: string;
  estateId: string;
  familyId: string | null;

  // JSON Value Objects
  successionContext: any; // Json
  readinessScore: any; // Json

  // JSON Arrays
  riskBreakdown: any; // Json (part of Score usually, but if stored flat in schema check schema)
  // Schema says 'riskBreakdown' is a Json field, likely stored separately or part of Score.
  // Based on aggregate, riskBreakdown is inside ReadinessScore VO.
  // However, schema definition shows: riskBreakdown Json
  // We will map it if it exists as a separate column.

  missingDocuments: any; // Json (DocumentGap[])

  // Arrays
  blockingIssues: string[]; // String[]

  // Strategy
  recommendedStrategy: string | null;

  // Context Flags (Denormalized for indexing)
  contextRegime: string; // Enum
  contextMarriage: string; // Enum
  contextReligion: string; // Enum
  isMinorInvolved: boolean;
  hasDisputedAssets: boolean;
  isBusinessAssetsInvolved: boolean;
  isForeignAssetsInvolved: boolean;
  isEstateInsolvent: boolean;
  hasDependantsWithDisabilities: boolean;

  // Derived Context
  targetCourtJurisdiction: string; // Enum
  estimatedComplexityScore: number;

  // Derived Score Fields (Denormalized)
  readinessScoreValue: number; // Int (mapped from readinessScore in schema?)
  // Schema says: readinessScore Int @default(0)
  status: string; // Enum ReadinessStatus
  filingConfidence: string; // Enum FilingConfidence

  // Note: Schema definition actually has `readinessScore Int` AND `riskBreakdown Json`
  // But Domain has `readinessScore: ReadinessScore` VO which contains score + breakdown.
  // We need to map carefully.

  nextMilestone: string | null;
  estimatedDaysToReady: number | null;

  // Lifecycle
  lastAssessedAt: Date;
  lastRecalculationTrigger: string | null;
  totalRecalculations: number;

  isComplete: boolean;
  completedAt: Date | null;
  version: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * ReadinessAssessment Mapper
 *
 * PURPOSE: Translates between ReadinessAssessment Aggregate Root and Prisma Models.
 * HANDLES: Aggregate reconstruction, Value Object hydration (JSON vs Columns), Child Entity mapping.
 */
export class ReadinessAssessmentMapper {
  /**
   * Map Domain Aggregate to Prisma Model for CREATE/UPDATE operations
   * Returns tuple: [AssessmentData, RiskData[]]
   */
  public static toPersistence(domainAggregate: ReadinessAssessment): {
    assessment: any;
    risks: any[];
  } {
    const props = (domainAggregate as any).props;
    const context = props.successionContext;
    const score = props.readinessScore;

    // 1. Prepare JSON Objects
    // NOTE: Prisma handles object serialization.

    // Domain `ReadinessScore` VO contains score, status, breakdown, etc.
    // Schema separates `readinessScore` (Int) and `riskBreakdown` (Json).
    // We map accordingly.

    const missingDocumentsJson = props.missingDocuments
      ? props.missingDocuments.map((doc: DocumentGap) => doc.toJSON())
      : [];

    // 2. Build Assessment Persistence Object
    const assessmentPersistence = {
      id: domainAggregate.id.toString(),
      estateId: props.estateId,
      familyId: props.familyId || null,

      // --- Context (Value Object -> JSON) ---
      // Although schema has denormalized flags, we likely store full context too if schema supports it.
      // Based on schema provided earlier: `successionContext Json` DOES NOT EXIST in schema provided.
      // Schema has denormalized fields: contextRegime, contextMarriage, contextReligion.
      // We map VO properties to these columns.
      contextRegime: context?.regime,
      contextMarriage: context?.marriageType,
      contextReligion: context?.religion,

      // Denormalized Context Flags
      isMinorInvolved: context?.isMinorInvolved || false,
      hasDisputedAssets: context?.hasDisputedAssets || false,
      isBusinessAssetsInvolved: context?.isBusinessAssetsInvolved || false,
      isForeignAssetsInvolved: context?.isForeignAssetsInvolved || false,
      isEstateInsolvent: context?.isEstateInsolvent || false,
      hasDependantsWithDisabilities: context?.hasDependantsWithDisabilities || false,

      targetCourtJurisdiction: context?.determineCourtJurisdiction() || 'HIGH_COURT',
      estimatedComplexityScore: context?.estimatedComplexityScore || 1,

      // --- Score & Risk (Value Object -> Columns/JSON) ---
      readinessScore: score?.score || 0, // Int column
      status: score?.status || 'IN_PROGRESS', // Enum column
      filingConfidence: score?.filingConfidence || 'LOW', // Enum column
      riskBreakdown: score?.riskBreakdown || {}, // Json column

      nextMilestone: score?.nextMilestone || null,
      estimatedDaysToReady: score?.estimatedDaysToReady || null,

      // --- Document Gaps ---
      missingDocuments: missingDocumentsJson, // Json column

      // --- Blocking Issues ---
      blockingIssues: props.blockingIssues || [], // String[] column

      // --- Strategy ---
      recommendedStrategy: props.recommendedStrategy || null,

      // --- Lifecycle ---
      lastAssessedAt: props.lastAssessedAt,
      lastRecalculationTrigger: props.lastRecalculationTrigger || null,
      isComplete: props.isComplete || false,
      completedAt: props.completedAt || null,
      totalRecalculations: props.totalRecalculations || 0,

      // --- Version ---
      version: props.version || 1,

      updatedAt: new Date(),
    };

    // 3. Map Risks (Child Entities)
    const risksPersistence: any[] = [];
    if (props.riskFlags && Array.isArray(props.riskFlags)) {
      props.riskFlags.forEach((risk: RiskFlag) => {
        try {
          const riskData = RiskFlagMapper.toPersistence(risk, domainAggregate.id.toString());
          risksPersistence.push(riskData);
        } catch (error) {
          console.warn(`Failed to map risk flag ${risk.id.toString()}:`, error);
        }
      });
    }

    return {
      assessment: assessmentPersistence,
      risks: risksPersistence,
    };
  }

  /**
   * Map Prisma Model to Domain Aggregate for READ operations
   * Reconstructs Aggregate including Child Risks.
   */
  public static toDomain(
    raw: PrismaReadinessAssessmentModel,
    prismaRisks: PrismaRiskFlagModel[] = [],
  ): ReadinessAssessment {
    if (!raw) {
      throw new Error('ReadinessAssessmentMapper: Prisma assessment cannot be null');
    }

    // 1. Reconstruct SuccessionContext Value Object from Denormalized Columns
    // Since schema stores context flattened, we rebuild the VO props.
    // Assuming SuccessionContext.fromJSON can handle this partial reconstruction or we map manually.
    const contextProps = {
      regime: raw.contextRegime,
      marriageType: raw.contextMarriage,
      religion: raw.contextReligion,
      isMinorInvolved: raw.isMinorInvolved,
      hasDisputedAssets: raw.hasDisputedAssets,
      isBusinessAssetsInvolved: raw.isBusinessAssetsInvolved,
      isForeignAssetsInvolved: raw.isForeignAssetsInvolved,
      isEstateInsolvent: raw.isEstateInsolvent,
      hasDependantsWithDisabilities: raw.hasDependantsWithDisabilities,
      // estimatedComplexityScore might need to be recalculated or passed if VO accepts it
    };
    const successionContext = SuccessionContext.fromJSON(contextProps);

    // 2. Reconstruct ReadinessScore Value Object
    const riskBreakdown = this.parseJsonField(raw.riskBreakdown);
    const scoreProps = {
      score: raw.readinessScoreValue, // Mapped from 'readinessScore' int column
      status: raw.status,
      filingConfidence: raw.filingConfidence,
      riskBreakdown: riskBreakdown || { critical: 0, high: 0, medium: 0, low: 0 },
      calculatedAt: raw.lastAssessedAt, // Use assessment time as score time
      context: successionContext, // Link context
      nextMilestone: raw.nextMilestone,
      estimatedDaysToReady: raw.estimatedDaysToReady,
      version: 1, // Default
    };
    const readinessScore = ReadinessScore.fromJSON(scoreProps);

    // 3. Reconstruct Missing Documents
    const missingDocsJson = this.parseJsonField(raw.missingDocuments);
    let missingDocuments: DocumentGap[] = [];
    if (Array.isArray(missingDocsJson)) {
      missingDocuments = missingDocsJson.map((d) => DocumentGap.fromJSON(d));
    }

    // 4. Convert Child Risks
    const riskFlags: RiskFlag[] = prismaRisks.map((r) => RiskFlagMapper.toDomain(r));

    // 5. Prepare Domain Props
    const domainProps: ReadinessAssessmentProps = {
      estateId: raw.estateId,
      familyId: raw.familyId || undefined,

      successionContext,
      readinessScore,

      riskFlags,
      missingDocuments,
      blockingIssues: raw.blockingIssues || [],

      recommendedStrategy: raw.recommendedStrategy || '',

      lastAssessedAt: raw.lastAssessedAt,
      lastRecalculationTrigger: raw.lastRecalculationTrigger || undefined,

      isComplete: raw.isComplete,
      completedAt: raw.completedAt || undefined,
      totalRecalculations: raw.totalRecalculations,

      version: raw.version,
    };

    // 6. Reconstitute Aggregate
    return ReadinessAssessment.reconstitute(
      raw.id,
      domainProps,
      raw.createdAt,
      raw.updatedAt,
      raw.version,
    );
  }

  // ==================== HELPERS ====================

  /**
   * Safe JSON parser
   */
  private static parseJsonField(field: any): any {
    if (field === null || field === undefined) return null;
    if (typeof field === 'object') return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.warn('ReadinessAssessmentMapper: Failed to parse JSON string', e);
        return null;
      }
    }
    return null;
  }
}
