// src/succession-automation/src/application/roadmap/queries/dtos/dashboard.dtos.ts
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * QUERY: Get Executor Dashboard
 *
 * Fetches the high-level view:
 * - Current Phase Progress
 * - Readiness Score
 * - Next Immediate Action
 * - Critical Alerts
 */
export class GetRoadmapDashboardDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;
}

/**
 * QUERY: Get Roadmap Analytics
 *
 * Fetches detailed stats for the "Insights" tab:
 * - Estimated completion date (AI predicted)
 * - Efficiency score
 * - Cost estimates vs actuals
 */
export class GetRoadmapAnalyticsDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;
}

/**
 * QUERY: Get Critical Path
 *
 * Fetches strictly the sequence of tasks that are blocking the end goal.
 * Used for the "Speed Up My Case" view.
 */
export class GetCriticalPathDto {
  @IsUUID()
  @IsNotEmpty()
  roadmapId: string;
}
