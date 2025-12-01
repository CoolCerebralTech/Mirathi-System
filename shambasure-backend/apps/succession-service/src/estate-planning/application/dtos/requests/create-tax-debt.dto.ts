import { KenyanTaxType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Matches, Min } from 'class-validator';

export class CreateTaxDebtDto {
  @IsEnum(KenyanTaxType)
  taxType: KenyanTaxType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  principalAmount: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A]{1}\d{9}[A-Z]{1}$/, { message: 'Invalid KRA PIN format' })
  kraPin: string;

  @IsString()
  @IsNotEmpty()
  taxPeriod: string;

  @IsString()
  currency: string = 'KES';
}
