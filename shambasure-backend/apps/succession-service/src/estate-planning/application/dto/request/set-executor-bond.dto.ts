import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SetExecutorBondDto {
  @IsNumber()
  @Min(0)
  bondAmount: number;

  @IsString()
  @IsOptional()
  bondProvider?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  bondExpiryDate?: Date;
}
