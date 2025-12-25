import { ApiProperty } from '@nestjs/swagger';

class RecommendationDto {
  @ApiProperty({ enum: ['HIGH', 'MEDIUM', 'LOW'] })
  priority: 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  actionLink?: string;
}

class AnalysisSectionDto {
  @ApiProperty()
  status: string; // PASS, WARNING, FAIL

  @ApiProperty({ type: [String] })
  issues: string[];
}

class PolygamyAnalysisDto extends AnalysisSectionDto {
  @ApiProperty()
  isPolygamous: boolean;

  @ApiProperty()
  definedHouses: number;
}

export class SuccessionAnalysisDto {
  @ApiProperty()
  familyId: string;

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty()
  overallScore: number;

  @ApiProperty({ enum: ['NOT_READY', 'PARTIAL', 'READY_TO_FILE'] })
  readinessLevel: string;

  @ApiProperty({ type: AnalysisSectionDto })
  dependencyAnalysis: AnalysisSectionDto;

  @ApiProperty({ type: PolygamyAnalysisDto })
  polygamyAnalysis: PolygamyAnalysisDto;

  @ApiProperty({ type: [RecommendationDto] })
  recommendations: RecommendationDto[];
}
