import { ApiProperty } from '@nestjs/swagger';

export class RiskFactorDto {
  @ApiProperty() code: string;
  @ApiProperty() description: string;
  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  severity: string;
  @ApiProperty() detectedAt: Date;
}

export class RecommendationDto {
  @ApiProperty() priority: number;
  @ApiProperty() title: string;
  @ApiProperty() action: string;
  @ApiProperty() legalReference: string;
}

export class RiskAssessmentResponseDto {
  @ApiProperty() guardianshipId: string;
  @ApiProperty() generatedAt: Date;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  overallRiskLevel: string;

  @ApiProperty({ description: 'Risk Score 0-100 (Higher is riskier)' })
  riskScore: number;

  @ApiProperty({ type: [RiskFactorDto] })
  activeAlerts: RiskFactorDto[];

  @ApiProperty({ type: [RecommendationDto] })
  automatedRecommendations: RecommendationDto[];
}
