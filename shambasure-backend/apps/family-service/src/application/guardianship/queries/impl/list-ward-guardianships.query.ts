// application/guardianship/queries/impl/find-due-reports.query.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

import { PaginationDto } from '../../../common/dto/pagination.dto';
import { BaseQuery } from '../base.query';

export class FindDueReportsQuery extends BaseQuery {
  @ApiProperty({
    description: 'Query name',
    example: 'FindDueReportsQuery',
  })
  getQueryName(): string {
    return 'FindDueReportsQuery';
  }

  @ApiPropertyOptional({
    description: 'Pagination parameters',
    type: PaginationDto,
  })
  @Type(() => PaginationDto)
  readonly pagination?: PaginationDto = { page: 1, limit: 50 };

  @ApiPropertyOptional({
    description: 'Days threshold for report due date (positive for upcoming, negative for overdue)',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly daysThreshold?: number = 30;

  @ApiPropertyOptional({
    description: 'Include already overdue reports',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeOverdue?: boolean = true;

  @ApiPropertyOptional({
    description: 'Court station filter',
    example: 'Milimani Law Courts',
  })
  @IsOptional()
  @IsString()
  readonly courtStation?: string;

  @ApiPropertyOptional({
    description: 'Filter by guardianship type',
    example: 'COURT_APPOINTED',
  })
  @IsOptional()
  @IsString()
  readonly guardianshipType?: string;

  @ApiPropertyOptional({
    description: 'Include last report history',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeReportHistory?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include compliance impact assessment',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeImpactAssessment?: boolean = true;

  @ApiPropertyOptional({
    description: 'Sort by days to due date',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly sortByDaysToDue?: boolean = true;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      pagination?: PaginationDto;
      daysThreshold?: number;
      includeOverdue?: boolean;
      courtStation?: string;
      guardianshipType?: string;
      includeReportHistory?: boolean;
      includeImpactAssessment?: boolean;
      sortByDaysToDue?: boolean;
    },
  ) {
    super(correlationId);
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.pagination = data.pagination || { page: 1, limit: 50 };
    this.daysThreshold = data.daysThreshold ?? 30;
    this.includeOverdue = data.includeOverdue ?? true;
    this.courtStation = data.courtStation;
    this.guardianshipType = data.guardianshipType;
    this.includeReportHistory = data.includeReportHistory ?? false;
    this.includeImpactAssessment = data.includeImpactAssessment ?? true;
    this.sortByDaysToDue = data.sortByDaysToDue ?? true;
  }
}
