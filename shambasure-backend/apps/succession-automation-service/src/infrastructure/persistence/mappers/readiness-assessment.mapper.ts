// src/succession-automation/src/infrastructure/persistence/mappers/readiness-assessment.mapper.ts
import { Prisma } from '@prisma/client';

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
 * Interface representing the Raw Prisma Model Structure.
 * Matches schema.prisma 'ReadinessAssessment' EXACTLY.
 */
export interface PrismaReadinessAssessmentModel {
  id: string;
  estateId: string;
  familyId: string | null;

  // --- Flattened Succession Context Fields (Schema) ---
  contextRegime: string; // Enum
  contextMarriage: string; // Enum
  contextReligion: string; // Enum
  isMinorInvolved: boolean;
  hasDisputedAssets: boolean;
  isBusinessAssetsInvolved: boolean;
  isForeignAssetsInvolved: boolean;
  isEstateInsolvent: boolean;
  hasDependantsWithDisabilities: boolean;
  targetCourtJurisdiction: string; // Enum
  estimatedComplexityScore: number;

  // --- Readiness Score Fields (Schema) ---
  // NOTE: Schema has 'readinessScore' as Int, not 'readinessScoreValue'
  readinessScore: number; // Int column in schema
  riskBreakdown: Prisma.JsonValue; // Json column in schema
  status: string; // Enum
  filingConfidence: string; // Enum
  nextMilestone: string | null;
  estimatedDaysToReady: number | null;

  // --- Other Fields ---
  missingDocuments: Prisma.JsonValue; // Json
  blockingIssues: string[]; // String[] array
  recommendedStrategy: string | null;

  // --- Lifecycle ---
  lastAssessedAt: Date;
  lastRecalculationTrigger: string | null;
  isComplete: boolean;
  completedAt: Date | null;
  totalRecalculations: number;

  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ReadinessAssessment Mapper
 *
 * Translates between the Domain Aggregate (which uses nested Value Objects)
 * and the Prisma Persistence Model (which uses flattened columns and specific JSON fields).
 */
export class ReadinessAssessmentMapper {
  /**
   * Map Domain Aggregate to Prisma Persistence Data
   */
  public static toPersistence(domainAggregate: ReadinessAssessment): {
    assessment: any;
    risks: any[];
  } {
    const props = (domainAggregate as any).props;
    const context = props.successionContext;
    const score = props.readinessScore;

    // 1. Map Document Gaps
    const missingDocumentsJson = props.missingDocuments
      ? props.missingDocuments.map((doc: DocumentGap) => doc.toJSON())
      : [];

    // 2. Build Assessment Object (Flattening VOs into Schema Columns)
    const assessmentPersistence = {
      id: domainAggregate.id.toString(),
      estateId: props.estateId,
      familyId: props.familyId || null,

      // --- SuccessionContext (Flattened) ---
      contextRegime: context?.regime,
      contextMarriage: context?.marriageType,
      contextReligion: context?.religion,
      isMinorInvolved: context?.isMinorInvolved || false,
      hasDisputedAssets: context?.hasDisputedAssets || false,
      isBusinessAssetsInvolved: context?.isBusinessAssetsInvolved || false,
      isForeignAssetsInvolved: context?.isForeignAssetsInvolved || false,
      isEstateInsolvent: context?.isEstateInsolvent || false,
      hasDependantsWithDisabilities: context?.hasDependantsWithDisabilities || false,
      targetCourtJurisdiction: context?.determineCourtJurisdiction() || 'HIGH_COURT',
      estimatedComplexityScore: context?.estimatedComplexityScore || 1,

      // --- ReadinessScore (Split between Int and Json) ---
      // FIXED: Use 'readinessScore' instead of 'readinessScoreValue'
      readinessScore: score?.score || 0, // Int column
      riskBreakdown: score?.riskBreakdown || {}, // Json column
      status: score?.status || 'IN_PROGRESS', // Enum string
      filingConfidence: score?.filingConfidence || 'LOW', // Enum string
      nextMilestone: score?.nextMilestone || null,
      estimatedDaysToReady: score?.estimatedDaysToReady || null,

      // --- Other Fields ---
      missingDocuments: missingDocumentsJson,
      blockingIssues: props.blockingIssues || [],
      recommendedStrategy: props.recommendedStrategy || null,

      lastAssessedAt: props.lastAssessedAt,
      lastRecalculationTrigger: props.lastRecalculationTrigger || null,
      isComplete: props.isComplete || false,
      completedAt: props.completedAt || null,
      totalRecalculations: props.totalRecalculations || 0,
      version: props.version || 1,

      updatedAt: new Date(),
    };

    // 3. Map Risks
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
   * Map Prisma Model to Domain Aggregate
   */
  public static toDomain(
    raw: PrismaReadinessAssessmentModel,
    prismaRisks: PrismaRiskFlagModel[] = [],
  ): ReadinessAssessment {
    if (!raw) {
      throw new Error('ReadinessAssessmentMapper: Prisma assessment cannot be null.');
    }

    // 1. Reconstruct SuccessionContext VO from flattened columns
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
    };
    const successionContext = SuccessionContext.fromJSON(contextProps);

    // 2. Reconstruct ReadinessScore VO from mixed columns
    const riskBreakdown = this.parseJsonField(raw.riskBreakdown);
    const scoreProps = {
      score: raw.readinessScore, // FIXED: Use 'readinessScore' instead of 'readinessScoreValue'
      status: raw.status,
      filingConfidence: raw.filingConfidence,
      riskBreakdown: riskBreakdown || { critical: 0, high: 0, medium: 0, low: 0 },
      calculatedAt: raw.lastAssessedAt, // Use assessment time
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

    return ReadinessAssessment.reconstitute(
      raw.id,
      domainProps,
      raw.createdAt,
      raw.updatedAt,
      raw.version,
    );
  }

  // ==================== HELPERS ====================

  private static parseJsonField(field: Prisma.JsonValue): any {
    if (field === null || field === undefined) return null;
    if (typeof field === 'object') return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.warn('ReadinessAssessmentMapper: Failed to parse JSON string:', e);
        return null;
      }
    }
    return null;
  }
}
