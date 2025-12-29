// src/succession-automation/src/presentation/roadmap/dtos/response/roadmap-analytics.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoadmapAnalyticsResponseDto {
  @ApiPropertyOptional({ example: '2025-06-30T00:00:00.000Z' })
  estimatedCompletionDate?: string;

  @ApiProperty({ example: 180, description: 'Total estimated days for process' })
  totalDurationDays: number;

  @ApiProperty({ example: 120, description: 'Days remaining' })
  daysRemaining: number;

  @ApiProperty({ example: true, description: 'Is the executor on schedule?' })
  isOnTrack: boolean;

  @ApiProperty({ example: 25000, description: 'Estimated legal costs in KES' })
  estimatedCostKES: number;

  @ApiProperty({ example: 'Includes court filing fees...' })
  costBreakdown: string;

  @ApiProperty({ example: 85, description: 'User efficiency score (0-100)' })
  efficiencyScore: number;

  @ApiProperty({ example: 5, description: 'Case complexity (1-10)' })
  complexityScore: number;

  @ApiProperty({ example: 20, description: 'Risk exposure level (0-100)' })
  riskExposure: number;

  @ApiProperty({ type: [String], example: ['Missing Chief Letter', 'Court Delay'] })
  predictedBottlenecks: string[];

  @ApiProperty({ type: [String], example: ['Upload Will now to save 5 days'] })
  recommendedAccelerations: string[];

  @ApiPropertyOptional({ example: 80, description: 'Faster than 80% of users' })
  percentileRanking?: number;
}
