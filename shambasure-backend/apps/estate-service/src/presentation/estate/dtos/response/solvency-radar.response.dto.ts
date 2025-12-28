import { ApiProperty } from '@nestjs/swagger';

import { MoneyResponseDto } from './common/money.response.dto';

class LiquidityAnalysisResponseDto {
  @ApiProperty({ type: MoneyResponseDto })
  liquidCash: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto, description: 'S.45(a) & (b) debts due now' })
  immediateObligations: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto, description: 'Deficit if cash < obligations' })
  cashShortfall: MoneyResponseDto;

  @ApiProperty({ example: 0.8 })
  liquidityRatio: number;

  @ApiProperty()
  isLiquid: boolean;
}

class AssetCompositionResponseDto {
  @ApiProperty({ example: 20 })
  liquidPercentage: number;

  @ApiProperty({ example: 50 })
  realEstatePercentage: number;

  @ApiProperty({ example: 30 })
  businessPercentage: number;
}

export class SolvencyRadarResponseDto {
  @ApiProperty()
  estateId: string;

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty({ example: 85, description: '0-100 Health Score' })
  healthScore: number;

  @ApiProperty({ example: 'MEDIUM', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  riskLevel: string;

  @ApiProperty({ type: MoneyResponseDto })
  netPosition: MoneyResponseDto;

  @ApiProperty({ type: LiquidityAnalysisResponseDto })
  liquidityAnalysis: LiquidityAnalysisResponseDto;

  @ApiProperty({ type: AssetCompositionResponseDto })
  assetComposition: AssetCompositionResponseDto;

  @ApiProperty({ type: [String], example: ['Liquidity Crisis imminent'] })
  alerts: string[];

  @ApiProperty({ type: [String], example: ['Initiate liquidation of land'] })
  recommendations: string[];
}
