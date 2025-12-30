import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { DebtStatus } from '../../../../domain/enums/debt-status.enum';
import { MoneyResponseDto } from './common/money.response.dto';

export class DebtItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  creditorName: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: MoneyResponseDto })
  originalAmount: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto })
  outstandingAmount: MoneyResponseDto;

  @ApiProperty({ description: 'S.45 Priority Tier (1-5)' })
  priorityTier: number;

  @ApiProperty({ example: 'S.45(a) Funeral Expenses' })
  tierName: string;

  @ApiProperty({ enum: DebtStatus })
  status: DebtStatus;

  @ApiProperty()
  isSecured: boolean;

  @ApiPropertyOptional()
  dueDate?: Date;
}

export class DebtWaterfallResponseDto {
  @ApiProperty({ type: [DebtItemResponseDto], description: 'Tier 1: Funeral Expenses' })
  tier1_FuneralExpenses: DebtItemResponseDto[];

  @ApiProperty({ type: [DebtItemResponseDto], description: 'Tier 2: Testamentary Expenses' })
  tier2_Testamentary: DebtItemResponseDto[];

  @ApiProperty({ type: [DebtItemResponseDto], description: 'Tier 3: Secured Debts' })
  tier3_SecuredDebts: DebtItemResponseDto[];

  @ApiProperty({ type: [DebtItemResponseDto], description: 'Tier 4: Taxes & Wages' })
  tier4_TaxesAndWages: DebtItemResponseDto[];

  @ApiProperty({ type: [DebtItemResponseDto], description: 'Tier 5: Unsecured Debts' })
  tier5_Unsecured: DebtItemResponseDto[];

  @ApiProperty({ type: MoneyResponseDto })
  totalLiabilities: MoneyResponseDto;

  @ApiProperty({ type: MoneyResponseDto })
  totalPaid: MoneyResponseDto;

  @ApiProperty({ example: 3, description: 'The tier currently blocking distribution' })
  highestPriorityOutstanding: number;

  @ApiProperty({ description: 'Can the estate pay the next priority debt with current cash?' })
  canPayNextTier: boolean;
}
