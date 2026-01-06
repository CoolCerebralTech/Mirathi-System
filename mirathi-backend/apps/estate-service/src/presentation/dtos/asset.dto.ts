// src/application/dtos/asset.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCategory, KenyanCounty, LandCategory, VehicleCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

// --- BASE DTO ---
export class BaseAssetDto {
  @ApiProperty({ example: 'Land in Kiambu' })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiPropertyOptional({ example: 'Half-acre plot near Thika Road' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 3500000 })
  @IsNumber()
  @Min(0)
  estimatedValue: number;

  @ApiPropertyOptional({ example: '2020-05-15' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  purchaseDate?: Date;

  @ApiPropertyOptional({ example: 'Kiambu County' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEncumbered?: boolean;

  @ApiPropertyOptional({ example: 'Mortgage of KES 2M with Equity Bank' })
  @IsOptional()
  @IsString()
  encumbranceDetails?: string;
}

// --- 1. GENERIC ASSET DTO ---
export class AddAssetDto extends BaseAssetDto {
  @ApiProperty({ enum: AssetCategory })
  @IsEnum(AssetCategory)
  category: AssetCategory;
}

// --- 2. SPECIFIC LAND DTO (Flattened for specific endpoints) ---
export class AddLandAssetDto extends BaseAssetDto {
  @ApiProperty({ enum: AssetCategory, default: AssetCategory.LAND })
  @IsEnum(AssetCategory)
  category: AssetCategory = AssetCategory.LAND;

  @ApiProperty({ example: 'KIAMBU/THIKA/12345' })
  @IsString()
  titleDeedNumber: string;

  @ApiPropertyOptional({ example: 'KIAMBU/THIKA/BLOCK 1/678' })
  @IsOptional()
  @IsString()
  parcelNumber?: string;

  @ApiProperty({ enum: KenyanCounty })
  @IsEnum(KenyanCounty)
  county: KenyanCounty;

  @ApiPropertyOptional({ example: 'Thika Sub-County' })
  @IsOptional()
  @IsString()
  subCounty?: string;

  @ApiProperty({ enum: LandCategory })
  @IsEnum(LandCategory)
  landCategory: LandCategory;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sizeInAcres?: number;
}

// --- 3. SPECIFIC VEHICLE DTO (Flattened) ---
export class AddVehicleAssetDto extends BaseAssetDto {
  @ApiProperty({ enum: AssetCategory, default: AssetCategory.VEHICLE })
  @IsEnum(AssetCategory)
  category: AssetCategory = AssetCategory.VEHICLE;

  @ApiProperty({ example: 'KCA 123A' })
  @IsString()
  @Matches(/^K[A-Z]{2}\s?\d{3}[A-Z]$/, { message: 'Invalid KE registration number' })
  registrationNumber: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  make: string;

  @ApiProperty({ example: 'Fielder' })
  @IsString()
  model: string;

  @ApiPropertyOptional({ example: 2018 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  year?: number;

  @ApiProperty({ enum: VehicleCategory })
  @IsEnum(VehicleCategory)
  vehicleCategory: VehicleCategory;
}

export class UpdateAssetValueDto {
  @ApiProperty({ example: 4000000 })
  @IsNumber()
  @Min(0)
  estimatedValue: number;
}

export class VerifyAssetDto {
  @ApiProperty()
  @IsString()
  proofDocumentUrl: string;
}

// --- RESPONSE DTO ---
export class AssetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: AssetCategory;

  @ApiProperty()
  estimatedValue: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiPropertyOptional()
  details?: any; // Can contain landDetails or vehicleDetails

  @ApiProperty()
  createdAt: Date;
}
