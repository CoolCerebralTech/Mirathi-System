// services/succession-context-factory.service.ts
import { Injectable } from '@nestjs/common';
import {
  CourtJurisdiction,
  MarriageType,
  SuccessionRegime,
  SuccessionReligion,
} from '@prisma/client';

import { ExecutorRoadmap } from '../entities/executor-roadmap.entity';
import { ProbatePreview } from '../entities/probate-preview.entity';
import { ReadinessAssessment } from '../entities/readiness-assessment.entity';
import { SuccessionContext } from '../value-objects/succession-context.vo';

export interface SuccessionAggregateInput {
  userId: string;
  estateId: string;
  hasWill: boolean;
  estateValue: number;
  religion: SuccessionReligion;
  marriageType: MarriageType;
  isPolygamous: boolean;
  numberOfWives: number;
  numberOfChildren: number;
  hasMinors: boolean;
}

@Injectable()
export class SuccessionContextFactoryService {
  createCompleteSuccessionAggregate(input: SuccessionAggregateInput): {
    context: SuccessionContext;
    assessment: ReadinessAssessment;
    roadmap: ExecutorRoadmap;
    preview: ProbatePreview;
  } {
    // 1. Create Succession Context
    const context = new SuccessionContext(
      input.hasWill ? SuccessionRegime.TESTATE : SuccessionRegime.INTESTATE,
      input.religion,
      input.marriageType,
      input.estateValue,
      input.hasMinors,
      input.isPolygamous,
      input.numberOfWives,
      input.numberOfChildren,
    );

    // 2. Create Readiness Assessment
    const assessment = ReadinessAssessment.create(input.userId, input.estateId, context);

    // 3. Create Executor Roadmap
    const roadmap = ExecutorRoadmap.create(input.userId, input.estateId, context);

    // 4. Create Probate Preview (initial 0 score)
    const preview = ProbatePreview.create(
      input.userId,
      input.estateId,
      context,
      0, // Initial score
    );

    return { context, assessment, roadmap, preview };
  }

  /**
   * Determines if guardianship is mandatory
   */
  isGuardianshipMandatory(context: SuccessionContext): boolean {
    return context.requiresGuardianship();
  }

  /**
   * Gets the jurisdiction description for user display
   */
  getJurisdictionDescription(court: CourtJurisdiction): string {
    const descriptions: Record<CourtJurisdiction, string> = {
      [CourtJurisdiction.HIGH_COURT]: 'High Court (Estate > KES 500,000 or complex)',
      [CourtJurisdiction.MAGISTRATE_COURT]: 'Magistrate Court (Estate ≤ KES 500,000)',
      [CourtJurisdiction.KADHIS_COURT]: "Kadhi's Court (Islamic succession)",
      [CourtJurisdiction.CUSTOMARY_COURT]: 'Customary Court (Traditional law)',
    };
    return descriptions[court];
  }

  /**
   * Estimates timeline based on complexity
   */
  estimateTimeline(context: SuccessionContext): {
    minimumDays: number;
    maximumDays: number;
    averageDays: number;
  } {
    let base = 90; // Base timeline in days

    if (context.isComplexCase()) base += 60;
    if (context.targetCourt === CourtJurisdiction.HIGH_COURT) base += 30;
    if (context.isPolygamous) base += 60;
    if (context.hasMinors) base += 90;

    return {
      minimumDays: base - 30,
      maximumDays: base + 90,
      averageDays: base,
    };
  }
}
