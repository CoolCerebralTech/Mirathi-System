import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import {
  SuccessionMarriageType,
  SuccessionRegime,
  SuccessionReligion,
} from '../../../../domain/value-objects/succession-context.vo';

export class UpdateSuccessionContextDto {
  @IsUUID()
  @IsNotEmpty()
  assessmentId: string;

  @IsEnum(SuccessionRegime)
  regime: SuccessionRegime;

  @IsEnum(SuccessionMarriageType)
  marriageType: SuccessionMarriageType;

  @IsEnum(SuccessionReligion)
  religion: SuccessionReligion;

  @IsBoolean()
  isMinorInvolved: boolean;

  @IsBoolean()
  hasDisputedAssets: boolean;

  @IsInt()
  @Min(1)
  @Max(10)
  estimatedComplexityScore: number;

  @IsInt()
  @Min(1)
  totalBeneficiaries: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estateValueKES?: number;

  @IsBoolean()
  isEstateInsolvent: boolean;

  @IsBoolean()
  isBusinessAssetsInvolved: boolean;

  @IsBoolean()
  isForeignAssetsInvolved: boolean;

  @IsBoolean()
  isCharitableBequest: boolean;

  @IsBoolean()
  hasDependantsWithDisabilities: boolean;
}
