import { IsOptional, IsString } from 'class-validator';

export class SetExecutorDutiesDto {
  @IsString()
  @IsOptional()
  specificDuties?: string;

  @IsString()
  @IsOptional()
  limitations?: string;

  @IsString()
  @IsOptional()
  specialPowers?: string;
}
