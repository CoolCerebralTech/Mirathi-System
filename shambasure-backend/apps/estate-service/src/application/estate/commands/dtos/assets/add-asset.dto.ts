import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { AssetType } from '../../../../../domain/enums/asset-type.enum';
import { BusinessAssetDetailsDto } from '../asset-details/business-asset-details.dto';
import { FinancialAssetDetailsDto } from '../asset-details/financial-asset-details.dto';
import { LandAssetDetailsDto } from '../asset-details/land-asset-details.dto';
import { VehicleAssetDetailsDto } from '../asset-details/vehicle-asset-details.dto';
import { MoneyDto } from '../common/money.dto';

/**
 * Add Asset DTO
 *
 * Supports adding different types of assets via optional nested DTOs.
 * The handler will enforce that the 'type' matches the provided details.
 */
export class AddAssetDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsString()
  @IsNotEmpty()
  name: string; // Short display name (e.g. "Karen Home")

  @IsEnum(AssetType)
  type: AssetType;

  @ValidateNested()
  @Type(() => MoneyDto)
  currentValue: MoneyDto;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @Type(() => Date)
  @IsOptional()
  purchaseDate?: Date;

  // --- Polymorphic Details (One of these should be present based on 'type') ---

  @IsOptional()
  @ValidateNested()
  @Type(() => LandAssetDetailsDto)
  landDetails?: LandAssetDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleAssetDetailsDto)
  vehicleDetails?: VehicleAssetDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialAssetDetailsDto)
  financialDetails?: FinancialAssetDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessAssetDetailsDto)
  businessDetails?: BusinessAssetDetailsDto;

  // --- Audit ---

  @IsString()
  @IsNotEmpty()
  addedBy: string;
}
