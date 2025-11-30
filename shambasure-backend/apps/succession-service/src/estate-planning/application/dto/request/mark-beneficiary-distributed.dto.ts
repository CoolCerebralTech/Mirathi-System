import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MarkBeneficiaryDistributedDto {
  @IsString()
  @IsNotEmpty()
  distributionMethod: string;

  @IsString()
  @IsOptional()
  distributionNotes?: string;
}
