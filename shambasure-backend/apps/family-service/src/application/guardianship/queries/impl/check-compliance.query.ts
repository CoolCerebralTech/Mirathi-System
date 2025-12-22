// application/guardianship/queries/impl/check-compliance.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { BaseQuery } from '../base.query';

export class CheckComplianceQuery extends BaseQuery {
  @ApiProperty({
    description: 'Query name',
    example: 'CheckComplianceQuery',
  })
  getQueryName(): string {
    return 'CheckComplianceQuery';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiPropertyOptional({
    description: 'Check S.72 bond compliance only',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly checkBondOnly?: boolean = false;

  @ApiPropertyOptional({
    description: 'Check S.73 annual report compliance only',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly checkReportOnly?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include detailed issue descriptions',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeDetails?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include recommended actions',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeRecommendations?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include historical compliance data',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeHistory?: boolean = false;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      checkBondOnly?: boolean;
      checkReportOnly?: boolean;
      includeDetails?: boolean;
      includeRecommendations?: boolean;
      includeHistory?: boolean;
    },
  ) {
    super(correlationId);
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.guardianshipId = data.guardianshipId;
    this.checkBondOnly = data.checkBondOnly ?? false;
    this.checkReportOnly = data.checkReportOnly ?? false;
    this.includeDetails = data.includeDetails ?? true;
    this.includeRecommendations = data.includeRecommendations ?? true;
    this.includeHistory = data.includeHistory ?? false;
  }
}