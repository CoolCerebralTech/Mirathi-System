// application/guardianship/queries/impl/find-expiring-bonds.query.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { BaseQuery } from '../base.query';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FindExpiringBondsQuery extends BaseQuery {
  @ApiProperty({
    description: 'Query name',
    example: 'FindExpiringBondsQuery',
  })
  getQueryName(): string {
    return 'FindExpiringBondsQuery';
  }

  @ApiPropertyOptional({
    description: 'Pagination parameters',
    type: PaginationDto,
  })
  @Type(() => PaginationDto)
  readonly pagination?: PaginationDto = { page: 1, limit: 50 };

  @ApiPropertyOptional({
    description: 'Days threshold for bond expiry (positive for upcoming, negative for expired)',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly daysThreshold?: number = 30;

  @ApiPropertyOptional({
    description: 'Include already expired bonds',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeExpired?: boolean = false;

  @ApiPropertyOptional({
    description: 'Court station filter',
    example: 'Milimani Law Courts',
  })
  @IsOptional()
  @IsString()
  readonly courtStation?: string;

  @ApiPropertyOptional({
    description: 'Include bond provider details',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeProviderDetails?: boolean = true;

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
    description: 'Sort by days to expiry',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly sortByDaysToExpiry?: boolean = true;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      pagination?: PaginationDto;
      daysThreshold?: number;
      includeExpired?: boolean;
      courtStation?: string;
      includeProviderDetails?: boolean;
      includeImpactAssessment?: boolean;
      sortByDaysToExpiry?: boolean;
    },
  ) {
    super(correlationId);
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.pagination = data.pagination || { page: 1, limit: 50 };
    this.daysThreshold = data.daysThreshold ?? 30;
    this.includeExpired = data.includeExpired ?? false;
    this.courtStation = data.courtStation;
    this.includeProviderDetails = data.includeProviderDetails ?? true;
    this.includeImpactAssessment = data.includeImpactAssessment ?? true;
    this.sortByDaysToExpiry = data.sortByDaysToExpiry ?? true;
  }
}