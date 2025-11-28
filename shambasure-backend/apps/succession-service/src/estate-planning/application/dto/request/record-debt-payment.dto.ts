import { IsNotEmpty, IsNumber, IsString, Matches, Min } from 'class-validator';

export class RecordDebtPaymentDto {
  @IsNumber()
  @Min(0.01, { message: 'Payment amount must be greater than 0' })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO code (e.g., KES)' })
  currency: string;
}
