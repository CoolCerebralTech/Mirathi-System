// application/guardianship/queries/impl/validate-guardianship-eligibility.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuardianType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

import { BaseQuery } from '../base.query';

export class ValidateGuardianshipEligibilityQuery extends BaseQuery {
  @ApiProperty({
    description: 'Query name',
    example: 'ValidateGuardianshipEligibilityQuery',
  })
  getQueryName(): string {
    return 'ValidateGuardianshipEligibilityQuery';
  }

  @ApiProperty({
    description: 'Ward ID (FamilyMember ID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly wardId: string;

  @ApiProperty({
    description: 'Guardian ID (FamilyMember ID)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianId: string;

  @ApiPropertyOptional({
    description: 'Proposed guardianship type',
    enum: GuardianType,
  })
  @IsOptional()
  @IsEnum(GuardianType)
  readonly proposedType?: GuardianType;

  @ApiPropertyOptional({
    description: 'Include detailed eligibility reasons',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeDetails?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include Kenyan law compliance requirements',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeLegalRequirements?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include alternative guardian suggestions',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeAlternatives?: boolean = false;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      wardId: string;
      guardianId: string;
      proposedType?: GuardianType;
      includeDetails?: boolean;
      includeLegalRequirements?: boolean;
      includeAlternatives?: boolean;
    },
  ) {
    super(correlationId);
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.wardId = data.wardId;
    this.guardianId = data.guardianId;
    this.proposedType = data.proposedType;
    this.includeDetails = data.includeDetails ?? true;
    this.includeLegalRequirements = data.includeLegalRequirements ?? true;
    this.includeAlternatives = data.includeAlternatives ?? false;
  }
}
