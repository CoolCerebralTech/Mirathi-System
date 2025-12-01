import { BequestType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, Max, Min, ValidateIf } from 'class-validator';

export class UpdateBeneficiaryShareDto {
  @IsEnum(BequestType)
  bequestType: BequestType;

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
}
