// application/family/queries/impl/get-family-by-id.query.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { BaseQuery } from '../base.query';

export class GetFamilyByIdQuery extends BaseQuery {
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
    description: 'Family ID to retrieve',
    example: 'fam-1234567890',
  })
  @IsString()
  readonly familyId: string;

  @ApiProperty({
    description: 'Include family members in response',
    example: false,
    default: false,
  })
  readonly includeMembers: boolean;

  @ApiProperty({
    description: 'Include marriages in response',
    example: false,
    default: false,
  })
  readonly includeMarriages: boolean;

  @ApiProperty({
    description: 'Include polygamous houses in response',
    example: false,
    default: false,
  })
  readonly includePolygamousHouses: boolean;

  @ApiProperty({
    description: 'Include legal compliance data',
    example: false,
    default: false,
  })
  readonly includeCompliance: boolean;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    familyId: string,
    includeMembers: boolean = false,
    includeMarriages: boolean = false,
    includePolygamousHouses: boolean = false,
    includeCompliance: boolean = false,
    correlationId?: string,
  ) {
    super();
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.familyId = familyId;
    this.includeMembers = includeMembers;
    this.includeMarriages = includeMarriages;
    this.includePolygamousHouses = includePolygamousHouses;
    this.includeCompliance = includeCompliance;
    this.correlationId = correlationId;
  }

  static create(
    userId: string,
    familyId: string,
    options?: {
      includeMembers?: boolean;
      includeMarriages?: boolean;
      includePolygamousHouses?: boolean;
      includeCompliance?: boolean;
      correlationId?: string;
    },
  ): GetFamilyByIdQuery {
    const {
      includeMembers = false,
      includeMarriages = false,
      includePolygamousHouses = false,
      includeCompliance = false,
      correlationId,
    } = options || {};

    return new GetFamilyByIdQuery(
      `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      familyId,
      includeMembers,
      includeMarriages,
      includePolygamousHouses,
      includeCompliance,
      correlationId,
    );
  }
}
