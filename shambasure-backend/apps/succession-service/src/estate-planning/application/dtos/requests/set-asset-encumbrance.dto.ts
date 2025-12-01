import { AssetEncumbranceType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SetAssetEncumbranceDto {
  @IsEnum(AssetEncumbranceType)
  encumbranceType: AssetEncumbranceType;

  @IsString()
  @IsNotEmpty()
  encumbranceDetails: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  encumbranceAmount?: number;
}
