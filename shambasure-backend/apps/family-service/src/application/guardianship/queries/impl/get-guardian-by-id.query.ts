// application/guardianship/queries/impl/find-guardianships-by-guardian.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { BaseQuery } from '../base.query';

export class FindGuardianshipsByGuardianQuery extends BaseQuery {
  @ApiProperty({
    description: 'Query name',
    example: 'FindGuardianshipsByGuardianQuery',
  })
  getQueryName(): string {
    return 'FindGuardianshipsByGuardianQuery';
  }

  @ApiProperty({
    description: 'Guardian ID (FamilyMember ID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianId: string;

  @ApiPropertyOptional({
    description: 'Include only active guardianships',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly activeOnly?: boolean = true;

  @ApiPropertyOptional({
    description: 'Filter by ward ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID('4')
  readonly wardId?: string;

  @ApiPropertyOptional({
    description: 'Include compliance check results',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeComplianceCheck?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include performance metrics for guardian',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includePerformanceMetrics?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include denormalized data',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeDenormalizedData?: boolean = true;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianId: string;
      activeOnly?: boolean;
      wardId?: string;
      includeComplianceCheck?: boolean;
      includePerformanceMetrics?: boolean;
      includeDenormalizedData?: boolean;
    },
  ) {
    super(correlationId);
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.guardianId = data.guardianId;
    this.activeOnly = data.activeOnly ?? true;
    this.wardId = data.wardId;
    this.includeComplianceCheck = data.includeComplianceCheck ?? true;
    this.includePerformanceMetrics = data.includePerformanceMetrics ?? false;
    this.includeDenormalizedData = data.includeDenormalizedData ?? true;
  }
}