import { IsOptional, IsString } from 'class-validator';

export class RecordTestatorSignatureDto {
  @IsString()
  @IsOptional()
  signatureMethod?: string; // e.g., 'DIGITAL', 'PHYSICAL'

  @IsString()
  @IsOptional()
  signatureLocation?: string;
}
