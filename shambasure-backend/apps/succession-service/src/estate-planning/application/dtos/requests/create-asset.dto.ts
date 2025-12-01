import { AssetOwnershipType, AssetType, KenyanCounty } from '@prisma/client';
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
  ValidateNested,
} from 'class-validator';

export class GPSCoordinatesDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class AssetLocationDto {
  @IsEnum(KenyanCounty)
  county: KenyanCounty;

  @IsString()
  @IsOptional()
  subCounty?: string;

  @IsString()
  @IsOptional()
  ward?: string;

  @IsString()
  @IsOptional()
  village?: string;

  @IsString()
  @IsOptional()
  landReferenceNumber?: string;

  @ValidateNested()
  @Type(() => GPSCoordinatesDto)
  @IsOptional()
  gpsCoordinates?: GPSCoordinatesDto;
}

export class AssetIdentificationDto {
  @IsString()
  @IsOptional()
  titleDeedNumber?: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  kraPin?: string;

  @IsObject()
  @IsOptional()
  identificationDetails?: Record<string, any>;
}

export class AssetValuationDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  currency: string = 'KES';

  @IsDate()
  @Type(() => Date)
  valuationDate: Date;

  @IsString()
  @IsOptional()
  valuationSource?: string;
}

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(AssetType)
  type: AssetType;

  @IsEnum(AssetOwnershipType)
  ownershipType: AssetOwnershipType = AssetOwnershipType.SOLE;

  @IsNumber()
  @Min(0)
  @Max(100)
  ownershipShare: number = 100.0;

  @ValidateNested()
  @Type(() => AssetLocationDto)
  @IsOptional()
  location?: AssetLocationDto;

  @ValidateNested()
  @Type(() => AssetIdentificationDto)
  @IsOptional()
  identification?: AssetIdentificationDto;

  @ValidateNested()
  @Type(() => AssetValuationDto)
  @IsOptional()
  valuation?: AssetValuationDto;

  @IsBoolean()
  @IsOptional()
  isMatrimonialProperty?: boolean;

  @IsBoolean()
  @IsOptional()
  acquiredDuringMarriage?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresProbate?: boolean = true;
}
