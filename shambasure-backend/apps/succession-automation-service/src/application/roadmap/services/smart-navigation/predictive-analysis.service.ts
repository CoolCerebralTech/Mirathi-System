// src/succession-automation/src/application/roadmap/services/smart-navigation/predictive-analysis.service.ts
import { Injectable } from '@nestjs/common';

import {
  ExecutorRoadmap,
  RoadmapPhase,
} from '../../../../domain/aggregates/executor-roadmap.aggregate';
import { TaskCategory } from '../../../../domain/entities/roadmap-task.entity';
import {
  CourtJurisdiction,
  SuccessionContext,
  SuccessionMarriageType,
} from '../../../../domain/value-objects/succession-context.vo';
import { Result } from '../../../common/result';

export interface TimelinePrediction {
  estimatedCompletionDate: Date;
  totalDurationDays: number;
  confidenceScore: number; // 0-100
  delayFactors: string[];
  phaseEstimates: Record<RoadmapPhase, number>; // Days per phase
}

@Injectable()
export class PredictiveAnalysisService {
  // Base durations in days based on 2024/2025 court observation data
  private static readonly BASE_PHASE_DURATIONS = {
    [RoadmapPhase.PRE_FILING]: 21,
    [RoadmapPhase.FILING]: 45, // Includes gazette notice (30 days)
    [RoadmapPhase.CONFIRMATION]: 30,
    [RoadmapPhase.DISTRIBUTION]: 14,
    [RoadmapPhase.CLOSURE]: 7,
  };

  /**
   * Generates a context-aware timeline prediction for the roadmap.
   */
  public predictTimeline(roadmap: ExecutorRoadmap): Result<TimelinePrediction> {
    try {
      const context = roadmap.successionContext;
      const multipliers = this.calculateMultipliers(context);

      const phaseEstimates: Record<RoadmapPhase, number> = {
        [RoadmapPhase.PRE_FILING]: Math.ceil(
          PredictiveAnalysisService.BASE_PHASE_DURATIONS.PRE_FILING * multipliers.complexity,
        ),
        [RoadmapPhase.FILING]: Math.ceil(this.calculateFilingDuration(context, multipliers.court)),
        [RoadmapPhase.CONFIRMATION]: Math.ceil(
          PredictiveAnalysisService.BASE_PHASE_DURATIONS.CONFIRMATION * multipliers.court,
        ),
        [RoadmapPhase.DISTRIBUTION]: Math.ceil(
          PredictiveAnalysisService.BASE_PHASE_DURATIONS.DISTRIBUTION * multipliers.complexity,
        ),
        [RoadmapPhase.CLOSURE]: Math.ceil(PredictiveAnalysisService.BASE_PHASE_DURATIONS.CLOSURE),
      };

      const totalDuration = Object.values(phaseEstimates).reduce((sum, days) => sum + days, 0);

      const startDate = roadmap.startedAt || new Date();
      const completionDate = new Date(startDate);
      completionDate.setDate(startDate.getDate() + totalDuration);

      return Result.ok({
        estimatedCompletionDate: completionDate,
        totalDurationDays: totalDuration,
        confidenceScore: this.calculateConfidence(context),
        delayFactors: multipliers.factors,
        phaseEstimates,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Prediction failed'));
    }
  }

  /**
   * Re-estimates task due dates based on current progress and critical path.
   */
  public suggestTaskDueDates(
    roadmap: ExecutorRoadmap,
    criticalPathIds: string[],
  ): Map<string, Date> {
    const dueDates = new Map<string, Date>();
    const now = new Date();

    // We only update pending/in-progress tasks
    roadmap
      .getPendingTasks()
      .concat(roadmap.getInProgressTasks())
      .forEach((task) => {
        let daysToAdd = 7; // Default buffer

        // 1. Critical Path tasks get tighter deadlines
        if (criticalPathIds.includes(task.id.toString())) {
          daysToAdd = 3;
        }

        // 2. Adjust by Category complexity
        switch (task.category) {
          case TaskCategory.GAZETTE_PUBLICATION:
            daysToAdd = 35; // 30 days mandatory + 5 days processing
            break;
          case TaskCategory.COURT_ATTENDANCE:
            daysToAdd = 14; // Average hearing notice
            break;
          case TaskCategory.CUSTOMARY_DOCUMENTS:
            daysToAdd = 14; // Chief's letter takes time
            break;
        }

        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + daysToAdd);
        dueDates.set(task.id.toString(), dueDate);
      });

    return dueDates;
  }

  // ==================== INTERNAL LOGIC ====================

  private calculateMultipliers(context: SuccessionContext): {
    complexity: number;
    court: number;
    factors: string[];
  } {
    let complexityMult = 1.0;
    let courtMult = 1.0;
    const factors: string[] = [];

    // 1. Marriage Type Impact
    if (context.marriageType === SuccessionMarriageType.POLYGAMOUS) {
      complexityMult += 0.5; // +50% effort for document collection/consent
      factors.push('Polygamy (Section 40) increases documentation time');
    } else if (context.marriageType === SuccessionMarriageType.COHABITATION) {
      complexityMult += 0.3;
      courtMult += 0.4; // Courts scrutinized cohabitation proofs heavily
      factors.push('Cohabitation proof verification delays');
    }

    // 2. Court Jurisdiction Impact
    const court = context.determineCourtJurisdiction();
    if (court === CourtJurisdiction.HIGH_COURT || court === CourtJurisdiction.FAMILY_DIVISION) {
      courtMult += 0.2; // High courts are busier
      factors.push('High Court registry backlog');
    } else if (court === CourtJurisdiction.KADHIS_COURT) {
      // Kadhi's courts are often faster for agreed Islamic estates
      courtMult -= 0.1;
      factors.push("Kadhi's Court streamlined process");
    }

    // 3. Asset/Dispute Impact
    if (context.hasDisputedAssets) {
      courtMult += 0.8; // Disputes nearly double confirmation time
      factors.push('Active asset disputes');
    }
    if (context.isBusinessAssetsInvolved) {
      complexityMult += 0.4;
      factors.push('Business valuation procedures');
    }

    return { complexity: complexityMult, court: courtMult, factors };
  }

  private calculateFilingDuration(context: SuccessionContext, courtMultiplier: number): number {
    const baseFiling = 15; // Prep time
    const gazetteNotice = 30; // Statutory fixed period
    const adminBuffer = 5;

    // Gazette notice is fixed by law, multipliers only affect prep/admin
    return (
      baseFiling * context.estimatedComplexityScore * 0.2 +
      gazetteNotice +
      adminBuffer * courtMultiplier
    );
  }

  private calculateConfidence(context: SuccessionContext): number {
    let score = 90; // Start high

    if (context.hasDisputedAssets) score -= 30; // Disputes make prediction hard
    if (context.isBusinessAssetsInvolved) score -= 10;
    if (context.marriageType === SuccessionMarriageType.COHABITATION) score -= 15;
    if (context.isForeignAssetsInvolved) score -= 20;

    return Math.max(10, score);
  }
}
