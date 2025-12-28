import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { AssetType } from '../../../../../domain/enums/asset-type.enum';
import {
  BusinessAssetDetailsRequestDto,
  FinancialAssetDetailsRequestDto,
  LandAssetDetailsRequestDto,
  VehicleAssetDetailsRequestDto,
} from './asset-details.request.dto';

class MoneyRequestDto {
  @ApiProperty({ example: 5000000 })
  amount: number;
  @ApiProperty({ example: 'KES' })
  currency: string;
}

export class AddAssetRequestDto {
  @ApiProperty({ example: 'Karen Family Home' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AssetType, description: 'Type determines which details object is required' })
  @IsEnum(AssetType)
  type: AssetType;

  @ApiProperty({ type: MoneyRequestDto })
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  currentValue: MoneyRequestDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsOptional()
  purchaseDate?: Date;

  // --- Polymorphic Details ---

  @ApiPropertyOptional({ type: LandAssetDetailsRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LandAssetDetailsRequestDto)
  landDetails?: LandAssetDetailsRequestDto;

  @ApiPropertyOptional({ type: VehicleAssetDetailsRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleAssetDetailsRequestDto)
  vehicleDetails?: VehicleAssetDetailsRequestDto;

  @ApiPropertyOptional({ type: FinancialAssetDetailsRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialAssetDetailsRequestDto)
  financialDetails?: FinancialAssetDetailsRequestDto;

  @ApiPropertyOptional({ type: BusinessAssetDetailsRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessAssetDetailsRequestDto)
  businessDetails?: BusinessAssetDetailsRequestDto;
}
