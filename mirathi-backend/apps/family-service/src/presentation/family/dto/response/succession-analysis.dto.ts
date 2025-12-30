import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class RecommendationDto {
  @ApiProperty({ enum: ['HIGH', 'MEDIUM', 'LOW'] })
  priority: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  actionLink?: string;
}

class DependencyAnalysisDto {
  @ApiProperty({ enum: ['PASS', 'WARNING', 'FAIL'] })
  status: string;

  @ApiProperty()
  potentialClaimantsCount: number;

  @ApiProperty({ type: [String] })
  claimantNames: string[];

  @ApiProperty({ type: [String] })
  issues: string[];
}

class PolygamyAnalysisDto {
  @ApiProperty()
  isPolygamous: boolean;

  @ApiProperty({ enum: ['NOT_APPLICABLE', 'PASS', 'FAIL'] })
  status: string;

  @ApiProperty()
  definedHouses: number;

  @ApiProperty({ type: [String] })
  issues: string[];
}

class DataIntegrityDto {
  @ApiProperty()
  verifiedMembersPercentage: number;

  @ApiProperty({ type: [String] })
  missingCriticalDocuments: string[];
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

  @ApiProperty({ type: DependencyAnalysisDto })
  dependencyAnalysis: DependencyAnalysisDto;

  @ApiProperty({ type: PolygamyAnalysisDto })
  polygamyAnalysis: PolygamyAnalysisDto;

  @ApiProperty({ type: DataIntegrityDto })
  dataIntegrity: DataIntegrityDto;

  @ApiProperty({ type: [RecommendationDto] })
  recommendations: RecommendationDto[];
}
