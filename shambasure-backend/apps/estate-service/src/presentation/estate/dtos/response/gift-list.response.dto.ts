import { ApiProperty } from '@nestjs/swagger';

import { GiftStatus } from '../../../../domain/entities/gift-inter-vivos.entity';
import { AssetType } from '../../../../domain/enums/asset-type.enum';
import { MoneyResponseDto } from './common/money.response.dto';

export class GiftItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  recipientId: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: AssetType })
  assetType: AssetType;

  @ApiProperty({ type: MoneyResponseDto })
  valueAtTimeOfGift: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto, description: 'Adjusted value for Hotchpot calculation' })
  hotchpotValue: MoneyResponseDto;

  @ApiProperty({ enum: GiftStatus })
  status: GiftStatus;

  @ApiProperty()
  isContested: boolean;

  @ApiProperty()
  isSubjectToHotchpot: boolean;

  @ApiProperty()
  dateGiven: Date;
}

export class GiftListResponseDto {
  @ApiProperty({ type: [GiftItemResponseDto] })
  items: GiftItemResponseDto[];

  @ApiProperty({ type: MoneyResponseDto, description: 'Total phantom value added back to pool' })
  totalHotchpotAddBack: MoneyResponseDto;
}
