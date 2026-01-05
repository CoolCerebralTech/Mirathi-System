// Ensure you import these enums from your generated prisma client path
import { DocumentCategory } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsEnum(DocumentCategory)
  @IsNotEmpty()
  category: DocumentCategory;

  @IsString()
  @IsOptional()
  type?: string; // e.g., "National ID", "Title Deed"

  @IsUUID()
  @IsOptional()
  identityForUserId?: string;

  @IsUUID()
  @IsOptional()
  assetId?: string;

  @IsUUID()
  @IsOptional()
  willId?: string;
}
