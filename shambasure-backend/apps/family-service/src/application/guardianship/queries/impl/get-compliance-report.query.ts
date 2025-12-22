// application/guardianship/queries/impl/get-compliance-report.query.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { BaseQuery } from '../base.query';

export class GetComplianceReportQuery extends BaseQuery {
  @ApiProperty({
    description: 'Query name',
    example: 'GetComplianceReportQuery',
  })
  getQueryName(): string {
    return 'GetComplianceReportQuery';
  }

  @ApiPropertyOptional({
    description: 'Court station filter',
    example: 'Milimani Law Courts',
  })
  @IsOptional()
  @IsString()
  readonly courtStation?: string;

  @ApiPropertyOptional({
    description: 'Guardian type filter',
    example: 'COURT_APPOINTED',
  })
  @IsOptional()
  @IsString()
  readonly guardianType?: string;

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
    description: 'Include detailed breakdown by court station',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeCourtStationBreakdown?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include monthly trends',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeMonthlyTrends?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include compliance timelines',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeTimelines?: boolean = false;

  @ApiPropertyOptional({
    description: 'Time period in months',
    example: 12,
    default: 12,
  })
  @IsOptional()
  @Type(() => Number)
  readonly periodMonths?: number = 12;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      courtStation?: string;
      guardianType?: string;
      activeOnly?: boolean;
      includeCourtStationBreakdown?: boolean;
      includeMonthlyTrends?: boolean;
      includeTimelines?: boolean;
      periodMonths?: number;
    },
  ) {
    super(correlationId);
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.courtStation = data.courtStation;
    this.guardianType = data.guardianType;
    this.activeOnly = data.activeOnly ?? true;
    this.includeCourtStationBreakdown = data.includeCourtStationBreakdown ?? false;
    this.includeMonthlyTrends = data.includeMonthlyTrends ?? false;
    this.includeTimelines = data.includeTimelines ?? false;
    this.periodMonths = data.periodMonths ?? 12;
  }
}