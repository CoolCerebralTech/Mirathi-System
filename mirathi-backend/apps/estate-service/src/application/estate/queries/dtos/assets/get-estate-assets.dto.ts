import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

import { AssetStatus } from '../../../../../domain/enums/asset-status.enum';
import { AssetType } from '../../../../../domain/enums/asset-type.enum';
import { PaginationDto } from '../common/pagination.dto';

export class GetEstateAssetsDto extends PaginationDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsOptional()
  @IsEnum(AssetType)
  type?: AssetType;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isEncumbered?: boolean; // Filter assets blocked by debts

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  requiresValuation?: boolean; // Filter assets needing professional valuation

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isLiquid?: boolean; // "What can we use to pay debts now?"
}
