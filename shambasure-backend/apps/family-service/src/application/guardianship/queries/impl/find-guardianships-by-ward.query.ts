// application/guardianship/queries/impl/find-guardianships-by-ward.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { BaseQuery } from '../base.query';

export class FindGuardianshipsByWardQuery extends BaseQuery {
  @ApiProperty({
    description: 'Query name',
    example: 'FindGuardianshipsByWardQuery',
  })
  getQueryName(): string {
    return 'FindGuardianshipsByWardQuery';
  }

  @ApiProperty({
    description: 'Ward ID (FamilyMember ID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly wardId: string;

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
    description: 'Include compliance check results',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeComplianceCheck?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include historical (terminated) guardianships',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeHistorical?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include denormalized ward data',
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
      wardId: string;
      activeOnly?: boolean;
      includeComplianceCheck?: boolean;
      includeHistorical?: boolean;
      includeDenormalizedData?: boolean;
    },
  ) {
    super(correlationId);
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.wardId = data.wardId;
    this.activeOnly = data.activeOnly ?? true;
    this.includeComplianceCheck = data.includeComplianceCheck ?? true;
    this.includeHistorical = data.includeHistorical ?? false;
    this.includeDenormalizedData = data.includeDenormalizedData ?? true;
  }
}