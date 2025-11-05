import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsUUID,
  IsNotEmpty,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { DocumentCategoryEnum } from '../../3_domain/value-objects/document-category.vo';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename: string;

  @IsEnum(DocumentCategoryEnum)
  category: DocumentCategoryEnum;

  @IsUUID()
  @IsOptional()
  assetId?: string;

  @IsUUID()
  @IsOptional()
  willId?: string;

  @IsUUID()
  @IsOptional()
  identityForUserId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  documentNumber?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  issuingAuthority?: string;

  @IsOptional()
  @IsObject()
  customMetadata?: Record<string, any>;
}

export class UploadDocumentResponseDto {
  id: string;
  filename: string;
  storagePath: string;
  category: DocumentCategoryEnum;
  status: DocumentStatusEnum;
  sizeBytes: number;
  mimeType: string;
  checksum: string;
  uploaderId: string;
  createdAt: Date;
  documentUrl?: string;

  constructor(partial: Partial<UploadDocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
