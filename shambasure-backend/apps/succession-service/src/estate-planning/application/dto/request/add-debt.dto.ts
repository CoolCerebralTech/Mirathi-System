import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator';
import { DebtType } from '@prisma/client';

export class AddDebtDto {
  @IsEnum(DebtType, { message: 'Invalid Debt Type. Must be one of: MORTGAGE, PERSONAL_LOAN, etc.' })
  type: DebtType;

  @IsString()
  @IsNotEmpty()
  creditorName: string;

  @IsNumber()
  @Min(0, { message: 'Principal amount cannot be negative' })
  principalAmount: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO code (e.g., KES, USD)' })
  currency: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  assetId?: string; // Optional: Link to an asset (e.g., for Mortgages)

  @IsDateString({}, { message: 'Due date must be a valid ISO 8601 date string' })
  @IsOptional()
  dueDate?: string;
}
