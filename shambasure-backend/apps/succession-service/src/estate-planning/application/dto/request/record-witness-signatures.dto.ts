import { IsOptional, IsString } from 'class-validator';

export class RecordWitnessSignaturesDto {
  @IsString()
  @IsOptional()
  signingLocation?: string;

  @IsString()
  @IsOptional()
  signingMethod?: string;
}
