// application/guardianship/queries/impl/find-overdue-guardianships.query.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { BaseQuery } from '../base.query';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FindOverdueGuardianshipsQuery extends BaseQuery {
  @ApiProperty({
    description: 'Query name',
    example: 'FindOverdueGuardianshipsQuery',
  })
  getQueryName(): string {
    return 'FindOverdueGuardianshipsQuery';
  }

  @ApiPropertyOptional({
    description: 'Pagination parameters',
    type: PaginationDto,
  })
  @Type(() => PaginationDto)
  readonly pagination?: PaginationDto = { page: 1, limit: 50 };

  @ApiPropertyOptional({
    description: 'Type of overdue items to find',
    example: 'REPORTS',
    enum: ['REPORTS', 'BONDS', 'TERMS', 'ALL'],
    default: 'ALL',
  })
  @IsOptional()
  @IsString()
  readonly overdueType?: 'REPORTS' | 'BONDS' | 'TERMS' | 'ALL' = 'ALL';

  @ApiPropertyOptional({
    description: 'Days threshold for considering overdue (negative for already overdue)',
    example: -30,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly daysThreshold?: number = 0;

  @ApiPropertyOptional({
    description: 'Court station filter',
    example: 'Milimani Law Courts',
  })
  @IsOptional()
  @IsString()
  readonly courtStation?: string;

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
    description: 'Include denormalized data',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeDenormalizedData?: boolean = true;

  @ApiPropertyOptional({
    description: 'Sort by urgency level',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly sortByUrgency?: boolean = true;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      pagination?: PaginationDto;
      overdueType?: 'REPORTS' | 'BONDS' | 'TERMS' | 'ALL';
      daysThreshold?: number;
      courtStation?: string;
      includeComplianceCheck?: boolean;
      includeDenormalizedData?: boolean;
      sortByUrgency?: boolean;
    },
  ) {
    super(correlationId);
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.pagination = data.pagination || { page: 1, limit: 50 };
    this.overdueType = data.overdueType || 'ALL';
    this.daysThreshold = data.daysThreshold ?? 0;
    this.courtStation = data.courtStation;
    this.includeComplianceCheck = data.includeComplianceCheck ?? true;
    this.includeDenormalizedData = data.includeDenormalizedData ?? true;
    this.sortByUrgency = data.sortByUrgency ?? true;
  }
}