import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { DebtType } from '../../../../../domain/enums/debt-type.enum';

class MoneyRequestDto {
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
}

export class AddDebtRequestDto {
  @ApiProperty({ example: 'Lee Funeral Home' })
  @IsString()
  @IsNotEmpty()
  creditorName: string;

  @ApiProperty({ example: 'Funeral Services' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: MoneyRequestDto })
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  initialAmount: MoneyRequestDto;

  @ApiProperty({ enum: DebtType, description: 'Critical for S.45 Priority Calculation' })
  @IsEnum(DebtType)
  type: DebtType;

  @ApiPropertyOptional({ description: 'Asset ID if debt is Secured (Mortgage/Logbook Loan)' })
  @ValidateIf((o) => o.type === DebtType.MORTGAGE || o.type === DebtType.BUSINESS_LOAN)
  @IsUUID()
  @IsNotEmpty()
  securedAssetId?: string;

  @ApiPropertyOptional({ example: 'INV-001' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date;
}
