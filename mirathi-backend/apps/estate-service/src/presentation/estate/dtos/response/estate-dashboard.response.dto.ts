import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EstateStatus } from '../../../../domain/aggregates/estate.aggregate';
import { MoneyResponseDto } from './common/money.response.dto';

export class EstateDashboardResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Estate of the Late John Doe' })
  name: string;

  @ApiProperty({ example: 'John Doe' })
  deceasedName: string;

  @ApiProperty()
  dateOfDeath: Date;

  @ApiProperty({ example: 45, description: 'Days elapsed since death' })
  daysSinceDeath: number;

  @ApiProperty({ enum: EstateStatus, example: 'ACTIVE' })
  status: EstateStatus;

  @ApiProperty({ example: false })
  isFrozen: boolean;

  @ApiPropertyOptional({ example: 'Court Order #123' })
  freezeReason?: string;

  // --- Financials ---

  @ApiProperty({ type: MoneyResponseDto })
  netWorth: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto })
  grossAssets: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto })
  totalLiabilities: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto })
  cashOnHand: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto, description: 'Cash reserved for S.45 priority debts' })
  cashReserved: MoneyResponseDto;

  @ApiProperty({
    type: MoneyResponseDto,
    description: 'Cash available for distribution or lower tier debts',
  })
  availableCash: MoneyResponseDto;

  // --- Analysis ---

  @ApiProperty({ example: 1.5, description: 'Ratio of Assets to Liabilities' })
  solvencyRatio: number;

  @ApiProperty()
  isSolvent: boolean;

  @ApiProperty({ example: 'PENDING', description: 'Tax Compliance Status' })
  taxStatus: string;

  @ApiProperty({ example: 50, description: 'Estimated percentage completion' })
  administrationProgress: number;
}
