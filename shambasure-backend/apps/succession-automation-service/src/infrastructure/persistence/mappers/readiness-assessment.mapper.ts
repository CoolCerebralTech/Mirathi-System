// src/succession-automation/src/infrastructure/persistence/mappers/readiness-assessment.mapper.ts
import {
  ReadinessAssessment as PrismaReadinessAssessment,
  RiskFlag as PrismaRiskFlag,
} from '@prisma/client';

import {
  ReadinessAssessment,
  ReadinessAssessmentProps,
} from '../../../domain/aggregates/readiness-assessment.aggregate';
import { RiskFlag } from '../../../domain/entities/risk-flag.entity';
import { DocumentGap } from '../../../domain/value-objects/document-gap.vo';
import { ReadinessScore } from '../../../domain/value-objects/readiness-score.vo';
import { SuccessionContext } from '../../../domain/value-objects/succession-context.vo';
import { RiskFlagMapper } from './risk-flag.mapper';

/**
 * ReadinessAssessment Mapper
 *
 * PURPOSE: Translates between ReadinessAssessment Aggregate Root and Prisma Models
 *
 * COMPLEXITIES HANDLED:
 * 1. Aggregate Root with child entities (RiskFlag)
 * 2. Value Objects (DocumentGap, ReadinessScore, SuccessionContext, RiskSource)
 * 3. Nested arrays and JSON serialization
 * 4. Multiple related Prisma models
 */

export class ReadinessAssessmentMapper {
  /**
   * Map Domain Aggregate to Prisma Model for CREATE operations
   * Returns assessment data and separate risks data
   */
  public static toPersistenceCreate(domainAggregate: ReadinessAssessment): {
    assessment: any;
    risks: any[];
  } {
    // Get props from domain aggregate
    const props = (domainAggregate as any).props;

    // Convert Value Objects to JSON
    const successionContextJson = props.successionContext ? props.successionContext.toJSON() : {};
    const readinessScoreJson = props.readinessScore ? props.readinessScore.toJSON() : {};

    // Convert missing documents to JSON
    const missingDocumentsJson = props.missingDocuments
      ? props.missingDocuments.map((doc: DocumentGap) => doc.toJSON())
      : [];

    // Build assessment persistence object
    const assessmentPersistence: any = {
      // --- Core Identity ---
      estateId: props.estateId,
      familyId: props.familyId || null,

      // --- Context (JSON) ---
      successionContext: JSON.stringify(successionContextJson),
      readinessScore: JSON.stringify(readinessScoreJson),

      // --- Document Gaps (JSON) ---
      missingDocuments:
        missingDocumentsJson.length > 0 ? JSON.stringify(missingDocumentsJson) : null,

      // --- Blocking Issues ---
      blockingIssues: props.blockingIssues || [],

      // --- Strategy ---
      recommendedStrategy: props.recommendedStrategy || '',

      // --- Lifecycle ---
      lastAssessedAt: props.lastAssessedAt,
      lastRecalculationTrigger: props.lastRecalculationTrigger || null,
      isComplete: props.isComplete || false,
      completedAt: props.completedAt || null,
      totalRecalculations: props.totalRecalculations || 0,

      // --- Optimistic Concurrency ---
      version: props.version || 1,

      // --- Derived Fields (for indexing/querying) ---
      isBlocked: props.readinessScore?.isBlocked?.() || false,
      readinessStatus: props.readinessScore?.status || 'IN_PROGRESS',
      filingConfidence: props.readinessScore?.filingConfidence || 'LOW',
      readinessPercentage: props.readinessScore?.score || 0,

      // Context flags (for fast filtering)
      isMinorInvolved: props.successionContext?.isMinorInvolved || false,
      hasDisputedAssets: props.successionContext?.hasDisputedAssets || false,
      isBusinessAssetsInvolved: props.successionContext?.isBusinessAssetsInvolved || false,
      isForeignAssetsInvolved: props.successionContext?.isForeignAssetsInvolved || false,
      isEstateInsolvent: props.successionContext?.isEstateInsolvent || false,
      hasDependantsWithDisabilities:
        props.successionContext?.hasDependantsWithDisabilities || false,

      targetCourtJurisdiction:
        props.successionContext?.determineCourtJurisdiction?.() || 'HIGH_COURT',
      estimatedComplexityScore: props.successionContext?.estimatedComplexityScore || 1,
    };

    // Map risks using RiskFlagMapper
    const risksPersistence: any[] = [];
    if (props.riskFlags && Array.isArray(props.riskFlags)) {
      props.riskFlags.forEach((risk: RiskFlag) => {
        try {
          const riskData = RiskFlagMapper.toPersistenceCreate(risk, domainAggregate.id.toString());
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
   * Map Domain Aggregate to Prisma Model for UPDATE operations
   * Only includes fields that can be updated
   */
  public static toPersistenceUpdate(domainAggregate: ReadinessAssessment): any {
    // Get props from domain aggregate
    const props = (domainAggregate as any).props;

    // Convert Value Objects to JSON
    const successionContextJson = props.successionContext ? props.successionContext.toJSON() : {};
    const readinessScoreJson = props.readinessScore ? props.readinessScore.toJSON() : {};

    // Convert missing documents to JSON
    const missingDocumentsJson = props.missingDocuments
      ? props.missingDocuments.map((doc: DocumentGap) => doc.toJSON())
      : [];

    // Only include fields that can be updated
    const updateData: any = {
      // --- Context ---
      successionContext: JSON.stringify(successionContextJson),
      readinessScore: JSON.stringify(readinessScoreJson),

      // --- Document Gaps ---
      missingDocuments:
        missingDocumentsJson.length > 0 ? JSON.stringify(missingDocumentsJson) : null,

      // --- Blocking Issues ---
      blockingIssues: props.blockingIssues || [],

      // --- Strategy ---
      recommendedStrategy: props.recommendedStrategy || '',

      // --- Lifecycle ---
      lastAssessedAt: props.lastAssessedAt,
      lastRecalculationTrigger: props.lastRecalculationTrigger || null,
      isComplete: props.isComplete || false,
      completedAt: props.completedAt || null,
      totalRecalculations: props.totalRecalculations,

      // --- Version (optimistic concurrency) ---
      version: props.version,

      // --- Derived Fields ---
      isBlocked: props.readinessScore?.isBlocked?.() || false,
      readinessStatus: props.readinessScore?.status || 'IN_PROGRESS',
      filingConfidence: props.readinessScore?.filingConfidence || 'LOW',
      readinessPercentage: props.readinessScore?.score || 0,

      // Context flags
      isMinorInvolved: props.successionContext?.isMinorInvolved || false,
      hasDisputedAssets: props.successionContext?.hasDisputedAssets || false,
      isBusinessAssetsInvolved: props.successionContext?.isBusinessAssetsInvolved || false,
      isForeignAssetsInvolved: props.successionContext?.isForeignAssetsInvolved || false,
      isEstateInsolvent: props.successionContext?.isEstateInsolvent || false,
      hasDependantsWithDisabilities:
        props.successionContext?.hasDependantsWithDisabilities || false,

      targetCourtJurisdiction:
        props.successionContext?.determineCourtJurisdiction?.() || 'HIGH_COURT',
      estimatedComplexityScore: props.successionContext?.estimatedComplexityScore || 1,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    return updateData;
  }

  /**
   * Map Prisma Model to Domain Aggregate for READ operations
   * This reconstructs the entire aggregate with its risk flags
   */
  public static toDomain(
    prismaAssessment: PrismaReadinessAssessment,
    prismaRisks: PrismaRiskFlag[],
  ): ReadinessAssessment {
    if (!prismaAssessment) {
      throw new Error('Prisma assessment cannot be null');
    }

    // Validate required fields
    if (!prismaAssessment.estateId) {
      throw new Error('Prisma ReadinessAssessment must have estateId');
    }

    // Parse JSON fields
    let successionContext: any = null;
    if (
      prismaAssessment.successionContext &&
      typeof prismaAssessment.successionContext === 'string'
    ) {
      try {
        const parsed = JSON.parse(prismaAssessment.successionContext);
        successionContext = SuccessionContext.fromJSON(parsed);
      } catch (error) {
        console.warn('Failed to parse successionContext JSON:', error);
        throw new Error('Invalid successionContext data');
      }
    }

    let readinessScore: any = null;
    if (prismaAssessment.readinessScore && typeof prismaAssessment.readinessScore === 'string') {
      try {
        const parsed = JSON.parse(prismaAssessment.readinessScore);
        readinessScore = ReadinessScore.fromJSON(parsed);
      } catch (error) {
        console.warn('Failed to parse readinessScore JSON:', error);
        throw new Error('Invalid readinessScore data');
      }
    }

    let missingDocuments: DocumentGap[] = [];
    if (
      prismaAssessment.missingDocuments &&
      typeof prismaAssessment.missingDocuments === 'string'
    ) {
      try {
        const parsed = JSON.parse(prismaAssessment.missingDocuments);
        missingDocuments = parsed.map((docJson: any) => DocumentGap.fromJSON(docJson));
      } catch (error) {
        console.warn('Failed to parse missingDocuments JSON:', error);
        missingDocuments = [];
      }
    }

    // Convert risks
    const riskFlags: RiskFlag[] = prismaRisks.map((risk) => {
      try {
        return RiskFlagMapper.toDomain(risk);
      } catch (error) {
        console.warn(`Failed to convert risk flag ${risk.id}:`, error);
        throw error;
      }
    });

    // Prepare domain properties
    const domainProps: ReadinessAssessmentProps = {
      // --- Identity ---
      estateId: prismaAssessment.estateId,
      familyId: prismaAssessment.familyId || undefined,

      // --- Context ---
      successionContext: successionContext,
      readinessScore: readinessScore,

      // --- Risks & Issues ---
      riskFlags: riskFlags,
      missingDocuments: missingDocuments,
      blockingIssues: prismaAssessment.blockingIssues || [],

      // --- Strategy ---
      recommendedStrategy: prismaAssessment.recommendedStrategy,

      // --- Lifecycle ---
      lastAssessedAt: prismaAssessment.lastAssessedAt,
      lastRecalculationTrigger: prismaAssessment.lastRecalculationTrigger || undefined,
      isComplete: prismaAssessment.isComplete,
      completedAt: prismaAssessment.completedAt || undefined,
      totalRecalculations: prismaAssessment.totalRecalculations,

      // --- Version ---
      version: prismaAssessment.version,
    };

    // Reconstitute the domain aggregate
    return ReadinessAssessment.reconstitute(
      prismaAssessment.id,
      domainProps,
      prismaAssessment.createdAt,
      prismaAssessment.updatedAt,
      prismaAssessment.version,
    );
  }

  /**
   * Map multiple Prisma models to Domain Aggregates
   */
  public static async toDomainArray(
    prismaAssessments: PrismaReadinessAssessment[],
    getAllRisksForAssessment: (assessmentId: string) => Promise<PrismaRiskFlag[]>,
  ): Promise<ReadinessAssessment[]> {
    const aggregates: ReadinessAssessment[] = [];

    for (const assessment of prismaAssessments) {
      try {
        // Get all risks for this assessment
        const risks = await getAllRisksForAssessment(assessment.id);

        // Convert to domain
        const aggregate = this.toDomain(assessment, risks);
        aggregates.push(aggregate);
      } catch (error) {
        console.error(`Failed to convert assessment ${assessment.id}:`, error);
        // Continue with other assessments
      }
    }

    return aggregates;
  }

  /**
   * Extract ID for persistence operations
   */
  public static getPersistenceId(domainAggregate: ReadinessAssessment): string | null {
    return domainAggregate.id ? domainAggregate.id.toString() : null;
  }

  /**
   * Get version for optimistic concurrency
   */
  public static getVersion(domainAggregate: ReadinessAssessment): number {
    return domainAggregate.version;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract assessment IDs from Prisma models
   */
  public static extractIds(prismaModels: PrismaReadinessAssessment[]): string[] {
    return prismaModels.map((model) => model.id);
  }

  /**
   * Check if assessment is ready to file
   */
  public static isReadyToFile(prismaModel: PrismaReadinessAssessment): boolean {
    if (!prismaModel.readinessScore || typeof prismaModel.readinessScore !== 'string') {
      return false;
    }

    try {
      const score = JSON.parse(prismaModel.readinessScore);
      return score.status === 'READY_TO_FILE' || score.status === 'READY';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if assessment is blocked
   */
  public static isBlocked(prismaModel: PrismaReadinessAssessment): boolean {
    return prismaModel.isBlocked || prismaAssessment.readinessStatus === 'BLOCKED';
  }

  /**
   * Calculate readiness score from Prisma data
   */
  public static calculateReadinessScore(prismaModel: PrismaReadinessAssessment): number {
    return prismaModel.readinessPercentage || 0;
  }

  /**
   * Check if assessment needs recalculation
   */
  public static needsRecalculation(prismaModel: PrismaReadinessAssessment): boolean {
    // Recalculate if older than 7 days
    const now = new Date();
    const lastAssessed = prismaModel.lastAssessedAt;
    const daysSinceLast = Math.floor(
      (now.getTime() - lastAssessed.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysSinceLast > 7;
  }

  /**
   * Get unresolved risk count
   */
  public static getUnresolvedRiskCount(prismaRisks: PrismaRiskFlag[]): number {
    return prismaRisks.filter((risk) => risk.riskStatus === 'ACTIVE').length;
  }

  /**
   * Get critical risk count
   */
  public static getCriticalRiskCount(prismaRisks: PrismaRiskFlag[]): number {
    return prismaRisks.filter(
      (risk) => risk.riskStatus === 'ACTIVE' && risk.severity === 'CRITICAL',
    ).length;
  }

  /**
   * Create update data for risk resolution
   */
  public static createRiskResolutionUpdateData(
    _riskId: string,
    _resolutionMethod: string,
    _resolvedBy: string,
    _notes?: string,
  ): any {
    return {
      lastAssessedAt: new Date(),
      lastRecalculationTrigger: 'risk_resolved',
      // Note: The actual risk update would be done via RiskFlag repository
    };
  }

  /**
   * Create update data for document gap identified
   */
  public static createDocumentGapUpdateData(
    documentGap: DocumentGap,
    existingGaps: DocumentGap[],
  ): any {
    const allGaps = [...existingGaps, documentGap];
    const missingDocumentsJson = allGaps.map((gap) => gap.toJSON());

    return {
      missingDocuments: JSON.stringify(missingDocumentsJson),
      lastAssessedAt: new Date(),
      lastRecalculationTrigger: 'document_gap_identified',
    };
  }

  /**
   * Validate Prisma model before conversion
   */
  public static validatePrismaModel(prismaModel: PrismaReadinessAssessment): string[] {
    const errors: string[] = [];

    if (!prismaModel.estateId) {
      errors.push('estateId is required');
    }

    if (!prismaModel.successionContext) {
      errors.push('successionContext is required');
    } else {
      try {
        JSON.parse(prismaModel.successionContext as string);
      } catch (error) {
        errors.push('successionContext contains invalid JSON');
      }
    }

    if (!prismaModel.readinessScore) {
      errors.push('readinessScore is required');
    } else {
      try {
        const score = JSON.parse(prismaModel.readinessScore as string);
        if (score.score < 0 || score.score > 100) {
          errors.push('readinessScore.score must be between 0 and 100');
        }
      } catch (error) {
        errors.push('readinessScore contains invalid JSON');
      }
    }

    if (prismaModel.totalRecalculations < 0) {
      errors.push('totalRecalculations cannot be negative');
    }

    if (prismaModel.version < 1) {
      errors.push('version must be at least 1');
    }

    return errors;
  }

  /**
   * Create a mock Prisma ReadinessAssessment for testing
   */
  public static createMockPrismaAssessment(
    overrides: Partial<PrismaReadinessAssessment> = {},
  ): PrismaReadinessAssessment {
    const now = new Date();

    const base: PrismaReadinessAssessment = {
      id: 'assessment-123',
      estateId: 'estate-123',
      familyId: 'family-123',
      successionContext: JSON.stringify({
        regime: 'INTESTATE',
        marriageType: 'MONOGAMOUS',
        religion: 'STATUTORY',
        isMinorInvolved: false,
        hasDisputedAssets: false,
        isBusinessAssetsInvolved: false,
        isForeignAssetsInvolved: false,
        isEstateInsolvent: false,
        hasDependantsWithDisabilities: false,
      }),
      readinessScore: JSON.stringify({
        score: 75,
        status: 'IN_PROGRESS',
        filingConfidence: 'MEDIUM',
        estimatedDaysToReady: 30,
        riskBreakdown: { critical: 0, high: 2, medium: 3, low: 5 },
      }),
      missingDocuments: JSON.stringify([]),
      blockingIssues: ['Missing death certificate', 'No KRA PIN'],
      recommendedStrategy: 'Gather missing documents and submit forms',
      lastAssessedAt: now,
      lastRecalculationTrigger: 'manual_update',
      isComplete: false,
      completedAt: null,
      totalRecalculations: 5,
      version: 2,
      isBlocked: false,
      readinessStatus: 'IN_PROGRESS',
      filingConfidence: 'MEDIUM',
      readinessPercentage: 75,
      isMinorInvolved: false,
      hasDisputedAssets: false,
      isBusinessAssetsInvolved: false,
      isForeignAssetsInvolved: false,
      isEstateInsolvent: false,
      hasDependantsWithDisabilities: false,
      targetCourtJurisdiction: 'HIGH_COURT',
      estimatedComplexityScore: 5,
      createdAt: now,
      updatedAt: now,
    };

    return { ...base, ...overrides };
  }
}

// ==================== TYPE UTILITIES ====================

/**
 * Types for assessment operations
 */
export interface ReadinessAssessmentCreateData {
  estateId: string;
  familyId?: string;
  successionContext: string;
  readinessScore: string;
  recommendedStrategy: string;
}

export interface ReadinessAssessmentUpdateData {
  successionContext?: string;
  readinessScore?: string;
  missingDocuments?: string;
  blockingIssues?: string[];
  recommendedStrategy?: string;
  lastAssessedAt?: Date;
  lastRecalculationTrigger?: string;
  isComplete?: boolean;
  completedAt?: Date;
  totalRecalculations?: number;
  version?: number;
  isBlocked?: boolean;
  readinessStatus?: string;
  filingConfidence?: string;
  readinessPercentage?: number;
}

/**
 * Types for assessment filtering
 */
export interface ReadinessAssessmentFilter {
  estateId?: string;
  familyId?: string;
  isComplete?: boolean;
  isBlocked?: boolean;
  readinessStatus?: string[];
  filingConfidence?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minReadinessPercentage?: number;
  maxReadinessPercentage?: number;
}

/**
 * Types for assessment statistics
 */
export interface ReadinessAssessmentStats {
  totalAssessments: number;
  readyToFile: number;
  blocked: number;
  inProgress: number;
  averageReadinessScore: number;
  averageDaysToReady: number;
  commonBlockingIssues: string[];
}

/**
 * Types for batch assessment operations
 */
export interface ReadinessAssessmentBatchOperation {
  create?: ReadinessAssessmentCreateData[];
  update?: {
    where: { id: string };
    data: ReadinessAssessmentUpdateData;
  }[];
  delete?: string[];
}
