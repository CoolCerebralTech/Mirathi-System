import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsUUID,
  IsNotEmpty,
  MaxLength,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategoryEnum } from '../../3_domain/value-objects/document-category.vo';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Original filename', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ enum: DocumentCategoryEnum, description: 'Document category' })
  @IsEnum(DocumentCategoryEnum)
  category: DocumentCategoryEnum;

  @ApiPropertyOptional({ description: 'Asset ID if document is related to an asset' })
  @IsUUID()
  @IsOptional()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Will ID if document is related to a will' })
  @IsUUID()
  @IsOptional()
  willId?: string;

  @ApiPropertyOptional({ description: 'User ID if this is an identity document' })
  @IsUUID()
  @IsOptional()
  identityForUserId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Document number (ID number, parcel number, etc.)',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Date document was issued', type: String, format: 'date' })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Date document expires', type: String, format: 'date' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Authority that issued the document', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  issuingAuthority?: string;

  @ApiPropertyOptional({ description: 'Make document publicly accessible' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Retention policy for the document' })
  @IsString()
  @IsOptional()
  retentionPolicy?: string;
}

export class UploadDocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  storagePath: string;

  @ApiProperty({ enum: DocumentCategoryEnum })
  category: DocumentCategoryEnum;

  @ApiProperty({ enum: DocumentStatusEnum })
  status: DocumentStatusEnum;

  @ApiProperty()
  sizeBytes: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  checksum: string;

  @ApiProperty()
  uploaderId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  documentUrl?: string;

  @ApiPropertyOptional()
  downloadUrl?: string;

  constructor(partial: Partial<UploadDocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
