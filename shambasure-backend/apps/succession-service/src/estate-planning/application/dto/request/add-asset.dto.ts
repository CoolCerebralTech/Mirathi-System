import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  ValidateNested,
  IsOptional,
  Matches,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetType, AssetOwnershipType } from '@prisma/client';
import { KENYAN_COUNTIES_LIST } from '../../../../common/constants/kenyan-law.constants';

class AssetValueDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO code (e.g., KES)' })
  currency: string;
}

class AssetLocationDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(KENYAN_COUNTIES_LIST, { message: 'Invalid Kenyan County' })
  county: string;

  @IsString()
  @IsOptional()
  subCounty?: string;

  @IsString()
  @IsOptional()
  ward?: string;
}

class AssetIdentificationDto {
  @IsString()
  @IsOptional()
  registrationNumber?: string; // Title Deed No. or Number Plate

  @IsString()
  @IsOptional()
  parcelNumber?: string;
}

export class AddAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(AssetType)
  type: AssetType;

  @ValidateNested()
  @Type(() => AssetValueDto)
  value: AssetValueDto;

  @IsEnum(AssetOwnershipType)
  @IsOptional()
  ownershipType?: AssetOwnershipType;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  ownershipShare?: number;

  @ValidateNested()
  @Type(() => AssetLocationDto)
  @IsOptional()
  location?: AssetLocationDto;

  @ValidateNested()
  @Type(() => AssetIdentificationDto)
  @IsOptional()
  identification?: AssetIdentificationDto;
}
