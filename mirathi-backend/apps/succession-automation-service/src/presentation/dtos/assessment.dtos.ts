// apps/succession-automation-service/src/presentation/dtos/assessment.dtos.ts
import { ApiProperty } from '@nestjs/swagger';
import { ReadinessStatus, RiskCategory, RiskSeverity } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class SuccessionAssessmentRequestDto {
  @ApiProperty({ description: 'ID of the estate to assess' })
  @IsUUID()
  estateId: string;
}

export class RiskFlagDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty({ enum: RiskSeverity })
  @IsEnum(RiskSeverity)
  severity: RiskSeverity;

  @ApiProperty({ enum: RiskCategory })
  @IsEnum(RiskCategory)
  category: RiskCategory;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  legalBasis?: string;

  @ApiProperty()
  @IsBoolean()
  isResolved: boolean;

  @ApiProperty({ type: [String] })
  @IsArray()
  resolutionSteps: string[];

  @ApiProperty()
  @IsBoolean()
  isBlocking: boolean;
}

export class ReadinessScoreDto {
  @ApiProperty({ description: 'Overall readiness score (0-100)' })
  @IsNumber()
  overall: number;

  @ApiProperty({ description: 'Document score (0-30)' })
  @IsNumber()
  document: number;

  @ApiProperty({ description: 'Legal score (0-30)' })
  @IsNumber()
  legal: number;

  @ApiProperty({ description: 'Family score (0-20)' })
  @IsNumber()
  family: number;

  @ApiProperty({ description: 'Financial score (0-20)' })
  @IsNumber()
  financial: number;

  @ApiProperty({ description: 'Readiness status' })
  @IsEnum(ReadinessStatus)
  status: ReadinessStatus;

  @ApiProperty({ description: 'Whether forms can be generated' })
  @IsBoolean()
  canGenerateForms: boolean;
}

export class SuccessionAssessmentResponseDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsUUID()
  estateId: string;

  @ApiProperty()
  @IsString()
  regime: string;

  @ApiProperty()
  @IsString()
  targetCourt: string;

  @ApiProperty()
  @IsBoolean()
  isComplexCase: boolean;

  @ApiProperty()
  score: ReadinessScoreDto;

  @ApiProperty({ type: [RiskFlagDto] })
  risks: RiskFlagDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  nextStep?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  estimatedDays?: number;

  @ApiProperty()
  @IsNumber()
  criticalRisksCount: number;

  @ApiProperty()
  @IsNumber()
  totalRisksCount: number;
}

export class QuickAssessmentResponseDto {
  @ApiProperty()
  @IsNumber()
  score: number;

  @ApiProperty({ enum: ReadinessStatus })
  @IsEnum(ReadinessStatus)
  status: ReadinessStatus;

  @ApiProperty()
  @IsString()
  nextStep: string;

  @ApiProperty()
  @IsNumber()
  criticalRisks: number;

  @ApiProperty()
  @IsNumber()
  estimatedDays: number;
}

export class ResolveRiskRequestDto {
  @ApiProperty({ description: 'Reason for resolving the risk' })
  @IsString()
  resolutionNotes: string;
}
