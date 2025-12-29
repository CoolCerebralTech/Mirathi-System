// src/succession-automation/src/application/roadmap/services/smart-navigation/efficiency-scorer.service.ts
import { Injectable } from '@nestjs/common';

import {
  ExecutorRoadmap,
  RoadmapStatus,
} from '../../../../domain/aggregates/executor-roadmap.aggregate';
import { TaskStatus } from '../../../../domain/entities/roadmap-task.entity';
import { Result } from '../../../common/result';

export interface EfficiencyReport {
  overallScore: number; // 0-100
  velocityScore: number; // Speed of execution
  reliabilityScore: number; // Meeting deadlines
  engagementScore: number; // Login/Activity frequency
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  feedback: string[];
}

@Injectable()
export class EfficiencyScorerService {
  public calculateEfficiency(roadmap: ExecutorRoadmap): Result<EfficiencyReport> {
    try {
      const velocity = this.calculateVelocityScore(roadmap);
      const reliability = this.calculateReliabilityScore(roadmap);
      const engagement = this.calculateEngagementScore(roadmap);

      // Weighted average
      // Reliability (Deadlines) is most important for legal safety
      const overallScore = Math.round(velocity * 0.3 + reliability * 0.5 + engagement * 0.2);

      return Result.ok({
        overallScore,
        velocityScore: velocity,
        reliabilityScore: reliability,
        engagementScore: engagement,
        trend: this.determineTrend(roadmap),
        feedback: this.generateFeedback(velocity, reliability, engagement, roadmap),
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Scoring failed'));
    }
  }

  // ==================== SCORING LOGIC ====================

  private calculateVelocityScore(roadmap: ExecutorRoadmap): number {
    const completedTasks = roadmap.completedTasks;
    if (completedTasks === 0) return 50; // Neutral start

    const totalTimeHours = roadmap.totalTimeSpentHours;
    // Assume avg task should take ~2 hours of active work (just a heuristic baseline)
    const expectedTime = completedTasks * 2;

    const ratio = expectedTime / (totalTimeHours || 1);

    // Cap at 100, normalize around 1.0 ratio
    return Math.min(100, Math.max(0, Math.round(ratio * 80)));
  }

  private calculateReliabilityScore(roadmap: ExecutorRoadmap): number {
    const totalTasks = roadmap.totalTasks;
    const overdueCount = roadmap.overdueTasks;

    if (totalTasks === 0) return 100;

    // Heavy penalty for overdue tasks
    const penalty = (overdueCount / totalTasks) * 100 * 2;
    return Math.min(100, Math.max(0, Math.round(100 - penalty)));
  }

  private calculateEngagementScore(roadmap: ExecutorRoadmap): number {
    const daysInactive = roadmap.daysInactive;

    if (daysInactive <= 2) return 100;
    if (daysInactive <= 7) return 80;
    if (daysInactive <= 14) return 50;
    if (daysInactive <= 30) return 20;
    return 0;
  }

  private determineTrend(roadmap: ExecutorRoadmap): 'IMPROVING' | 'DECLINING' | 'STABLE' {
    // In a real system, we'd compare with previous snapshot.
    // Here, we infer from recent activity.
    if (roadmap.status === RoadmapStatus.BLOCKED) return 'DECLINING';
    if (roadmap.daysInactive > 10) return 'DECLINING';
    if (roadmap.getTasksByStatus(TaskStatus.COMPLETED).length > 0 && roadmap.daysInactive < 3)
      return 'IMPROVING';
    return 'STABLE';
  }

  private generateFeedback(
    vel: number,
    rel: number,
    eng: number,
    roadmap: ExecutorRoadmap,
  ): string[] {
    const feedback: string[] = [];

    if (rel < 60) {
      feedback.push(
        '⚠️ You have multiple overdue tasks. Focus on clearing deadlines to avoid legal delays.',
      );
    }
    if (eng < 40) {
      feedback.push(
        '📉 Long inactivity detected. Succession cases often stall - try to do one small task today.',
      );
    }
    if (vel > 90 && rel > 90) {
      feedback.push('🔥 Excellent progress! You are moving faster than 90% of executors.');
    }
    if (roadmap.blockedTasks > 0) {
      feedback.push(
        `🚫 You have ${roadmap.blockedTasks} blocked tasks. Check the "Risk" tab to resolve them.`,
      );
    }

    return feedback;
  }
}
