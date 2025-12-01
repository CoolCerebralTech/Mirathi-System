import { PartialType } from '@nestjs/mapped-types';
import { AssetOwnershipType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { CreateAssetDto } from './create-asset.dto';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @IsString()
  @IsOptional()
  updateReason?: string;

  @IsEnum(AssetOwnershipType)
  @IsOptional()
  ownershipType?: AssetOwnershipType;

  @IsOptional()
  ownershipShare?: number;
}
