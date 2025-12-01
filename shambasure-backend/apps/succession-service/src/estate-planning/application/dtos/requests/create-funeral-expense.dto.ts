import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFuneralExpenseDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  principalAmount: number;

  @IsString()
  @IsNotEmpty()
  creditorName: string;

  @IsString()
  @IsOptional()
  creditorContact?: string;

  @IsString()
  currency: string = 'KES';
}
