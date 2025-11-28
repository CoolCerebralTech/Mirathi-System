import { BequestConditionType, BequestType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class SpecificAmountDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  currency: string;
}

export class AssignBeneficiaryDto {
  @IsString()
  @IsNotEmpty()
  assetId: string;

  // --- Identity (One is required) ---
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  familyMemberId?: string;

  @IsString()
  @IsOptional()
  externalName?: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  // --- Bequest Logic ---
  @IsEnum(BequestType)
  bequestType: BequestType;

  // Validate share if type is PERCENTAGE
  @ValidateIf((o) => o.bequestType === BequestType.PERCENTAGE)
  @IsNumber()
  @Min(0.01)
  @Max(100)
  sharePercentage?: number;

  // Validate amount if type is SPECIFIC
  @ValidateIf((o) => o.bequestType === BequestType.SPECIFIC)
  @ValidateNested()
  @Type(() => SpecificAmountDto)
  specificAmount?: SpecificAmountDto;

  // --- Conditions ---
  @IsEnum(BequestConditionType)
  @IsOptional()
  conditionType?: BequestConditionType;

  @ValidateIf((o) => o.conditionType && o.conditionType !== 'NONE')
  @IsString()
  @IsNotEmpty()
  conditionDetails?: string;
}
