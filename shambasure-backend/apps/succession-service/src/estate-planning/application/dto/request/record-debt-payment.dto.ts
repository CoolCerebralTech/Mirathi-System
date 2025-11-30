import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordDebtPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  paymentDate?: Date = new Date();

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
