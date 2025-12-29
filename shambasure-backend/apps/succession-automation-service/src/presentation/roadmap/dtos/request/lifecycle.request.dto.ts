// src/succession-automation/src/presentation/roadmap/dtos/request/lifecycle.request.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class GenerateRoadmapRequestDto {
  @ApiProperty({
    description: 'The Estate ID this roadmap belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @ApiProperty({
    description: 'The Readiness Assessment ID used to configure the roadmap context',
    example: '987fcdeb-51a2-43d7-9012-345678901234',
  })
  @IsUUID()
  @IsNotEmpty()
  readinessAssessmentId: string;

  @ApiProperty({
    description: 'The User ID of the designated Executor',
    example: 'user-uuid-123',
  })
  @IsUUID()
  @IsNotEmpty()
  executorId: string;

  @ApiProperty({
    description: 'Full name of the executor for official forms',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  executorName: string;

  @ApiProperty({
    description: 'Current estimated value of the estate in KES (determines court jurisdiction)',
    example: 5000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  estateValueKES: number;
}

export class RegenerateRoadmapRequestDto {
  @ApiProperty({
    description: 'Reason for regenerating the roadmap (Audit trail)',
    example: 'A valid Will was discovered, changing regime to TESTATE',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Updated estate value if that triggered the change',
    example: 15000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  updatedEstateValueKES?: number;
}

export class OptimizeRoadmapRequestDto {
  @ApiPropertyOptional({
    description: 'The primary goal for AI optimization',
    enum: ['SPEED', 'COST', 'LEGAL_SAFETY'],
    example: 'SPEED',
  })
  @IsOptional()
  @IsString()
  optimizationFocus?: 'SPEED' | 'COST' | 'LEGAL_SAFETY';
}
