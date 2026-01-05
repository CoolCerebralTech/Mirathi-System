// apps/documents-service/src/presentation/dto/upload-document.dto.ts
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  documentName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceNumber?: string; // User can manually enter if OCR fails

  @IsString()
  @IsOptional()
  referenceType?: string; // TITLE_DEED, NATIONAL_ID, etc.
}
