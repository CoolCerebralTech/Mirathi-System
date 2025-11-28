import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';

import { AddAssetDto } from './add-asset.dto';

// Create a typed constructor from PartialType
const AddAssetDtoPartial = PartialType(AddAssetDto) satisfies new () => Partial<AddAssetDto>;

export class UpdateAssetDto extends AddAssetDtoPartial {
  @IsString()
  @IsOptional()
  updateReason?: string; // e.g., "Annual Market Appraisal"
}
