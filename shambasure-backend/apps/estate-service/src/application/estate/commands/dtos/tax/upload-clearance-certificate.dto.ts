import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

/**
 * Upload Clearance Certificate DTO
 *
 * The final step in Tax Compliance.
 *
 * BUSINESS RULES:
 * 1. Certificate Number is mandatory for legal validation.
 * 2. This triggers the event `EstateTaxClearedEvent`.
 */
export class UploadClearanceCertificateDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsString()
  @IsNotEmpty()
  certificateNumber: string; // e.g., KRA/TCC/1234567

  @Type(() => Date)
  @IsDate()
  clearanceDate: Date;

  @IsUrl()
  @IsOptional()
  documentUrl?: string; // Scan of the TCC

  @IsString()
  @IsNotEmpty()
  uploadedBy: string;
}
