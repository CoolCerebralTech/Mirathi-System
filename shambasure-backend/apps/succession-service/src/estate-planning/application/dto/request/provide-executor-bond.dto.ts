import { IsOptional, IsString } from 'class-validator';

export class ProvideExecutorBondDto {
  @IsString()
  @IsOptional()
  bondProvider?: string;

  @IsString()
  @IsOptional()
  bondDetails?: string;
}
