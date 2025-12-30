import { ApiProperty } from '@nestjs/swagger';

import { MoneyResponseDto } from './common/money.response.dto';

class BeneficiaryShareResponseDto {
  @ApiProperty()
  beneficiaryId: string;

  @ApiProperty()
  beneficiaryName: string;

  @ApiProperty()
  relationship: string;

  @ApiProperty({ description: 'Gross percentage share' })
  grossSharePercentage: number;

  @ApiProperty({ type: MoneyResponseDto })
  grossShareValue: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto, description: 'Deduction for S.35(3) Gifts' })
  lessGiftInterVivos: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto, description: 'Final payout amount' })
  netDistributableValue: MoneyResponseDto;
}

class ReadinessCheckResponseDto {
  @ApiProperty()
  isReady: boolean;

  @ApiProperty({ type: [String], example: ['Tax Not Cleared', 'Active Dispute on Asset X'] })
  blockers: string[];
}

export class DistributionPreviewResponseDto {
  @ApiProperty({ type: MoneyResponseDto })
  estateNetValue: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto, description: 'Includes Hotchpot Add-backs' })
  totalDistributablePool: MoneyResponseDto;

  @ApiProperty({ type: [BeneficiaryShareResponseDto] })
  shares: BeneficiaryShareResponseDto[];

  @ApiProperty({ type: ReadinessCheckResponseDto })
  readinessCheck: ReadinessCheckResponseDto;
}
