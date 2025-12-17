// application/family/queries/impl/get-family-counts.query.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { BaseQuery } from '../base.query';

export class GetFamilyCountsQuery extends BaseQuery {
  @ApiProperty({
    description: 'Unique query identifier',
    example: 'qry-1234567890',
  })
  @IsUUID('4')
  readonly queryId: string;

  @ApiProperty({
    description: 'Query timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsNotEmpty()
  readonly timestamp: Date;

  @ApiProperty({
    description: 'Correlation ID for tracing',
    example: 'corr-1234567890',
  })
  @IsUUID('4')
  readonly correlationId?: string;

  @ApiProperty({
    description: 'User ID executing the query',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  readonly userId: string;

  @ApiProperty({
    description: 'Family ID to get counts for',
    example: 'fam-1234567890',
  })
  @IsString()
  readonly familyId: string;

  @ApiProperty({
    description: 'Include detailed breakdown by category',
    example: true,
    default: true,
  })
  readonly includeBreakdown: boolean;

  @ApiProperty({
    description: 'Include historical trends',
    example: false,
    default: false,
  })
  readonly includeHistory: boolean;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    familyId: string,
    includeBreakdown: boolean = true,
    includeHistory: boolean = false,
    correlationId?: string,
  ) {
    super();
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.familyId = familyId;
    this.includeBreakdown = includeBreakdown;
    this.includeHistory = includeHistory;
    this.correlationId = correlationId;
  }

  static create(
    userId: string,
    familyId: string,
    options?: {
      includeBreakdown?: boolean;
      includeHistory?: boolean;
      correlationId?: string;
    },
  ): GetFamilyCountsQuery {
    const { includeBreakdown = true, includeHistory = false, correlationId } = options || {};

    return new GetFamilyCountsQuery(
      `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      familyId,
      includeBreakdown,
      includeHistory,
      correlationId,
    );
  }
}
