import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Initial Cash Input
 * Represents the liquid cash available at the start (S.45 Asset).
 */
export class InitialCashDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO code (e.g., KES)' })
  currency: string;
}

/**
 * Create Estate DTO
 *
 * The genesis input for creating a new Estate Aggregate.
 *
 * BUSINESS RULES:
 * 1. KRA PIN is mandatory for Tax Compliance initialization.
 * 2. Date of Death cannot be in the future.
 * 3. Deceased ID is required to enforce the "One Estate per Deceased" invariant.
 */
export class CreateEstateDto {
  // --- Core Identity ---

  @IsString()
  @IsNotEmpty()
  name: string; // e.g. "Estate of the Late John Doe"

  @IsString()
  @IsNotEmpty()
  deceasedId: string; // Reference to Family Member ID

  @IsString()
  @IsNotEmpty()
  deceasedName: string;

  @Type(() => Date)
  @IsDate()
  dateOfDeath: Date;

  // --- Administration ---

  @IsString()
  @IsNotEmpty()
  // Kenyan KRA PIN Regex: A + 9 digits + Letter (e.g., A123456789Z)
  @Matches(/^[A-Z]\d{9}[A-Z]$/, {
    message: 'Invalid KRA PIN format. Expected format: A000000000Z',
  })
  kraPin: string;

  @IsString()
  @IsNotEmpty()
  executorId: string; // The person legally authorized to act

  @IsString()
  @IsOptional()
  courtCaseNumber?: string; // If P&A 80 is already filed

  // --- Financials ---

  @IsOptional()
  @ValidateNested()
  @Type(() => InitialCashDto)
  initialCash?: InitialCashDto;

  // --- Audit ---

  @IsString()
  @IsNotEmpty()
  createdBy: string; // User ID
}
