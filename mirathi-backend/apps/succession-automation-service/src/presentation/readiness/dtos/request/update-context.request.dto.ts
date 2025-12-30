import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

import {
  SuccessionMarriageType,
  SuccessionRegime,
  SuccessionReligion,
} from '../../../../domain/value-objects/succession-context.vo';

export class UpdateContextRequestDto {
  @ApiProperty({
    enum: SuccessionRegime,
    description: 'Legal regime governing the estate (Testate/Intestate)',
    example: SuccessionRegime.INTESTATE,
  })
  @IsEnum(SuccessionRegime)
  regime: SuccessionRegime;

  @ApiProperty({
    enum: SuccessionMarriageType,
    description: 'Marriage type affects S.40 (Polygamy) and S.3(5) logic',
    example: SuccessionMarriageType.MONOGAMOUS,
  })
  @IsEnum(SuccessionMarriageType)
  marriageType: SuccessionMarriageType;

  @ApiProperty({
    enum: SuccessionReligion,
    description: 'Determines court jurisdiction (e.g., Kadhis Court)',
    example: SuccessionReligion.STATUTORY,
  })
  @IsEnum(SuccessionReligion)
  religion: SuccessionReligion;

  @ApiProperty({ description: 'Are minors involved? Triggers S.71 Children Act checks.' })
  @IsBoolean()
  isMinorInvolved: boolean;

  @ApiProperty({ description: 'Are there known disputes over assets?' })
  @IsBoolean()
  hasDisputedAssets: boolean;

  @ApiProperty({
    description: 'Estimated complexity (1-10) for timeline prediction',
    minimum: 1,
    maximum: 10,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  estimatedComplexityScore: number;

  @ApiProperty({ description: 'Total number of beneficiaries' })
  @IsInt()
  @Min(1)
  totalBeneficiaries: number;

  @ApiPropertyOptional({
    description: 'Estimated gross value in KES (determines Magistrate vs High Court)',
    example: 5000000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estateValueKES?: number;

  @ApiProperty({ description: 'Is the estate insolvent (Assets < Debts)? Triggers S.45 checks.' })
  @IsBoolean()
  isEstateInsolvent: boolean;

  @ApiProperty({ description: 'Does estate include business assets?' })
  @IsBoolean()
  isBusinessAssetsInvolved: boolean;

  @ApiProperty({ description: 'Does estate include assets outside Kenya?' })
  @IsBoolean()
  isForeignAssetsInvolved: boolean;

  @ApiProperty({ description: 'Is there a charitable bequest in the Will?' })
  @IsBoolean()
  isCharitableBequest: boolean;

  @ApiProperty({ description: 'Are there dependants with disabilities (S.29)?' })
  @IsBoolean()
  hasDependantsWithDisabilities: boolean;
}
