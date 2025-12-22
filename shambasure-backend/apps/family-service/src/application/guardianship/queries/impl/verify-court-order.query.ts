// application/guardianship/queries/impl/verify-court-order.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BaseQuery } from '../base.query';

export class VerifyCourtOrderQuery extends BaseQuery {
  @ApiProperty({
    description: 'Query name',
    example: 'VerifyCourtOrderQuery',
  })
  getQueryName(): string {
    return 'VerifyCourtOrderQuery';
  }

  @ApiProperty({
    description: 'Court order number to verify',
    example: 'HC/SUCC/123/2024',
  })
  @IsNotEmpty()
  @IsString()
  readonly courtOrderNumber: string;

  @ApiPropertyOptional({
    description: 'Court station (for validation)',
    example: 'Milimani Law Courts',
  })
  @IsOptional()
  @IsString()
  readonly courtStation?: string;

  @ApiPropertyOptional({
    description: 'Include detailed court order information',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeDetails?: boolean = true;

  @ApiPropertyOptional({
    description: 'Verify against court registry API',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly verifyWithRegistry?: boolean = false;

  @ApiPropertyOptional({
    description: 'Check if court order is still valid',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly checkValidity?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include related cases',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeRelatedCases?: boolean = false;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      courtOrderNumber: string;
      courtStation?: string;
      includeDetails?: boolean;
      verifyWithRegistry?: boolean;
      checkValidity?: boolean;
      includeRelatedCases?: boolean;
    },
  ) {
    super(correlationId);
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.courtOrderNumber = data.courtOrderNumber;
    this.courtStation = data.courtStation;
    this.includeDetails = data.includeDetails ?? true;
    this.verifyWithRegistry = data.verifyWithRegistry ?? false;
    this.checkValidity = data.checkValidity ?? true;
    this.includeRelatedCases = data.includeRelatedCases ?? false;
  }
}