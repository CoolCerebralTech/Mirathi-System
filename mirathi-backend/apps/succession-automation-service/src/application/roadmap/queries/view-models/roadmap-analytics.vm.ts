// src/succession-automation/src/application/roadmap/queries/view-models/roadmap-analytics.vm.ts
import { ExecutorRoadmap } from '../../../../domain/aggregates/executor-roadmap.aggregate';

export class RoadmapAnalyticsVm {
  // Time
  estimatedCompletionDate?: string;
  totalDurationDays: number;
  daysRemaining: number;
  isOnTrack: boolean;

  // Cost
  estimatedCostKES: number;
  costBreakdown: string; // Simplification for VM

  // Performance
  efficiencyScore: number;
  complexityScore: number;
  riskExposure: number;

  // AI Insights
  predictedBottlenecks: string[];
  recommendedAccelerations: string[];

  // Comparison (Gamification)
  percentileRanking?: number; // "You are faster than 80% of executors"

  static fromAggregate(roadmap: ExecutorRoadmap): RoadmapAnalyticsVm {
    const analytics = roadmap.analytics;
    const now = new Date();

    const daysRemaining = roadmap.estimatedCompletionDate
      ? Math.ceil(
          (roadmap.estimatedCompletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      estimatedCompletionDate: roadmap.estimatedCompletionDate?.toISOString(),
      totalDurationDays: analytics.estimatedTotalTimeDays,
      daysRemaining: Math.max(0, daysRemaining),
      isOnTrack: (analytics.efficiencyScore || 0) >= 80,

      estimatedCostKES: analytics.estimatedCostKES,
      costBreakdown: 'Includes court filing fees, gazette notice, and administrative costs.',

      efficiencyScore: analytics.efficiencyScore || 0,
      complexityScore: analytics.complexityScore,
      riskExposure: analytics.riskExposure,

      predictedBottlenecks: analytics.predictedBottlenecks,
      recommendedAccelerations: analytics.recommendedAccelerations,

      percentileRanking: analytics.efficiencyScore, // Placeholder mapping
    };
  }
}
