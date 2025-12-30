import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import type {
  BequestPriority,
  BequestType,
} from '../../../../domain/entities/beneficiary-assignment.entity';

class BeneficiaryDetailsDto {
  @ApiProperty({ enum: ['USER', 'FAMILY_MEMBER', 'EXTERNAL'] })
  @IsEnum(['USER', 'FAMILY_MEMBER', 'EXTERNAL'])
  type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';

  @ApiPropertyOptional()
  @ValidateIf((o) => o.type === 'USER')
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.type === 'FAMILY_MEMBER')
  @IsUUID()
  familyMemberId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.type === 'EXTERNAL')
  @IsString()
  @IsNotEmpty()
  externalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalNationalId?: string; // Validated loosely here, strictly in domain

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalRelationship?: string;
}

class BequestConditionDto {
  @ApiProperty({ enum: ['AGE_REQUIREMENT', 'SURVIVAL', 'EDUCATION', 'MARRIAGE', 'NONE'] })
  @IsEnum(['AGE_REQUIREMENT', 'SURVIVAL', 'EDUCATION', 'MARRIAGE', 'NONE'])
  type: 'AGE_REQUIREMENT' | 'SURVIVAL' | 'EDUCATION' | 'MARRIAGE' | 'NONE';

  @ApiProperty()
  @IsNotEmpty()
  parameter: any; // Checked by domain logic, DTO allows flexibility
}

export class AddBeneficiaryRequestDto {
  @ApiProperty({ type: BeneficiaryDetailsDto })
  @ValidateNested()
  @Type(() => BeneficiaryDetailsDto)
  beneficiary: BeneficiaryDetailsDto;

  @ApiProperty({ description: 'Description of the gift', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    enum: [
      'SPECIFIC_ASSET',
      'RESIDUARY',
      'PERCENTAGE',
      'FIXED_AMOUNT',
      'LIFE_INTEREST',
      'TRUST',
      'ALTERNATE',
      'CONTINGENT',
    ],
  })
  @IsString() // Using String to match BequestType type alias
  bequestType: BequestType;

  // --- Conditional Fields ---

  @ApiPropertyOptional()
  @ValidateIf((o) => o.bequestType === 'SPECIFIC_ASSET')
  @IsUUID()
  specificAssetId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.bequestType === 'PERCENTAGE')
  @IsNumber()
  @Min(0.01)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.bequestType === 'FIXED_AMOUNT')
  @IsNumber()
  @Min(1)
  fixedAmount?: number;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.bequestType === 'RESIDUARY')
  @IsNumber()
  residuaryShare?: number;

  @ApiPropertyOptional({ enum: ['PRIMARY', 'ALTERNATE', 'CONTINGENT'] })
  @IsOptional()
  priority?: BequestPriority;

  @ApiPropertyOptional({ type: [BequestConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BequestConditionDto)
  conditions?: BequestConditionDto[];
}
