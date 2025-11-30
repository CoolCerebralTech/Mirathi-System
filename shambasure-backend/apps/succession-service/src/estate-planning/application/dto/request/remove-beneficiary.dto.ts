import { IsOptional, IsString } from 'class-validator';

export class RemoveBeneficiaryDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
