import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AssetStatus } from '../../../../domain/enums/asset-status.enum';
import { AssetType } from '../../../../domain/enums/asset-type.enum';
import { MoneyResponseDto } from './common/money.response.dto';

export class AssetItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: AssetType })
  type: AssetType;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: MoneyResponseDto })
  currentValue: MoneyResponseDto;

  @ApiProperty({ enum: AssetStatus })
  status: AssetStatus;

  @ApiProperty()
  isEncumbered: boolean;

  @ApiPropertyOptional()
  encumbranceDetails?: string;

  @ApiProperty()
  isCoOwned: boolean;

  @ApiProperty({ description: 'Percentage owned by estate' })
  estateSharePercentage: number;

  @ApiProperty({ description: 'Title No / Plate No / Account No' })
  identifier: string;

  @ApiPropertyOptional()
  location?: string;
}

export class AssetInventoryResponseDto {
  @ApiProperty({ type: [AssetItemResponseDto] })
  items: AssetItemResponseDto[];

  @ApiProperty({ type: MoneyResponseDto })
  totalValue: MoneyResponseDto;

  @ApiProperty()
  totalCount: number;

  @ApiProperty({ type: MoneyResponseDto })
  liquidAssetsValue: MoneyResponseDto;
}
