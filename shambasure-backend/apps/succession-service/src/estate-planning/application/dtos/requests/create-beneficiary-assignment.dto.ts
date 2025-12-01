import {
  BeneficiaryType,
  BequestConditionType,
  BequestPriority,
  BequestType,
  KenyanRelationshipCategory,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class BeneficiaryConditionDto {
  @IsEnum(BequestConditionType)
  conditionType: BequestConditionType;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.conditionType !== BequestConditionType.NONE)
  conditionDetails: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  conditionDeadline?: Date;
}

export class CreateBeneficiaryAssignmentDto {
  @IsString()
  @IsNotEmpty()
  willId: string;

  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsEnum(BeneficiaryType)
  beneficiaryType: BeneficiaryType;

  @IsEnum(KenyanRelationshipCategory)
  relationshipCategory: KenyanRelationshipCategory;

  @IsEnum(BequestType)
  bequestType: BequestType = BequestType.SPECIFIC;

  // User-specific fields
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.beneficiaryType === BeneficiaryType.USER)
  userId?: string;

  // Family member-specific fields
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.beneficiaryType === BeneficiaryType.FAMILY_MEMBER)
  familyMemberId?: string;

  // External/Charity-specific fields
  @IsString()
  @IsOptional()
  @ValidateIf(
    (o) =>
      o.beneficiaryType === BeneficiaryType.EXTERNAL ||
      o.beneficiaryType === BeneficiaryType.CHARITY,
  )
  externalName?: string;

  @IsString()
  @IsOptional()
  @ValidateIf(
    (o) =>
      o.beneficiaryType === BeneficiaryType.EXTERNAL ||
      o.beneficiaryType === BeneficiaryType.CHARITY,
  )
  externalContact?: string;

  @IsString()
  @IsOptional()
  @ValidateIf(
    (o) =>
      o.beneficiaryType === BeneficiaryType.EXTERNAL ||
      o.beneficiaryType === BeneficiaryType.CHARITY,
  )
  externalIdentification?: string;

  @IsObject()
  @IsOptional()
  @ValidateIf(
    (o) =>
      o.beneficiaryType === BeneficiaryType.EXTERNAL ||
      o.beneficiaryType === BeneficiaryType.CHARITY,
  )
  externalAddress?: Record<string, any>;

  // Relationship details
  @IsString()
  @IsOptional()
  specificRelationship?: string;

  @IsBoolean()
  @IsOptional()
  isDependant?: boolean = false;

  // Bequest allocation
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @ValidateIf(
    (o) => o.bequestType === BequestType.PERCENTAGE || o.bequestType === BequestType.RESIDUARY,
  )
  sharePercent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ValidateIf((o) => o.bequestType === BequestType.SPECIFIC)
  specificAmount?: number;

  @IsString()
  currency: string = 'KES';

  // Conditions
  @ValidateNested()
  @Type(() => BeneficiaryConditionDto)
  @IsOptional()
  condition?: BeneficiaryConditionDto;

  // Priority
  @IsNumber()
  @Min(1)
  @IsOptional()
  priority?: number = 1;

  @IsEnum(BequestPriority)
  @IsOptional()
  bequestPriority?: BequestPriority = BequestPriority.PRIMARY;
}
