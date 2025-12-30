import { IsNotEmpty, IsNumber, IsString, Matches, Min } from 'class-validator';

export class MoneyDto {
  @IsNumber()
  @Min(0, { message: 'Amount cannot be negative' })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO code (e.g., KES)' })
  currency: string;
}
