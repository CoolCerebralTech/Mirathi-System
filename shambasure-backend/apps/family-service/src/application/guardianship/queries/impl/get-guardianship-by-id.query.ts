// application/guardianship/queries/impl/get-guardianship-by-id.query.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { BaseQuery } from '../base.query';

export class GetGuardianshipByIdQuery extends BaseQuery {
  @ApiProperty({
    description: 'Query name',
    example: 'GetGuardianshipByIdQuery',
  })
  getQueryName(): string {
    return 'GetGuardianshipByIdQuery';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiProperty({
    description: 'Include denormalized data (ward/guardian names, ages)',
    example: true,
    default: true,
  })
  readonly includeDenormalizedData: boolean = true;

  @ApiProperty({
    description: 'Include compliance check results',
    example: true,
    default: true,
  })
  readonly includeComplianceCheck: boolean = true;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      includeDenormalizedData?: boolean;
      includeComplianceCheck?: boolean;
    },
  ) {
    super(correlationId);
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.guardianshipId = data.guardianshipId;
    this.includeDenormalizedData = data.includeDenormalizedData ?? true;
    this.includeComplianceCheck = data.includeComplianceCheck ?? true;
  }
}