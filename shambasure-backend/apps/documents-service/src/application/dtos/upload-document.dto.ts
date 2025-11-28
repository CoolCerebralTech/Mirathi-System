import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { DocumentCategoryEnum } from '../../domain/value-objects/document-category.vo';
import { RetentionPolicyType } from '../../domain/value-objects/retention-policy.vo';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Original filename', maxLength: 255, example: 'contract.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    enum: DocumentCategoryEnum,
    description: 'Document category',
    example: DocumentCategoryEnum.LAND_OWNERSHIP,
  })
  @IsEnum(DocumentCategoryEnum)
  category: DocumentCategoryEnum;

  @ApiPropertyOptional({
    description: 'Asset ID if document is related to an asset',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Will ID if document is related to a will', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  willId?: string;

  @ApiPropertyOptional({
    description: 'User ID this identity document belongs to. Required for IDENTITY_PROOF category.',
    format: 'uuid',
  })
  @ValidateIf((o: UploadDocumentDto) => o.category === DocumentCategoryEnum.IDENTITY_PROOF)
  @IsUUID()
  @IsNotEmpty()
  identityForUserId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: { author: 'John Doe', pages: 10 },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Document number (e.g., ID number, parcel number)',
    maxLength: 50,
    example: 'ID12345678',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional({
    description: 'Date document was issued (ISO 8601 format)',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Date document expires (ISO 8601 format)',
    example: '2025-01-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Authority that issued the document',
    maxLength: 100,
    example: 'National Registration Bureau',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  issuingAuthority?: string;

  @ApiPropertyOptional({
    description: 'Make document publicly accessible. Defaults to false.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Initial allowed viewers (user IDs)',
    type: [String],
    format: 'uuid',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  allowedViewers?: string[];

  @ApiPropertyOptional({
    description: 'Retention policy for the document',
    enum: RetentionPolicyType,
    example: RetentionPolicyType.LONG_TERM,
  })
  @IsEnum(RetentionPolicyType)
  @IsOptional()
  retentionPolicy?: RetentionPolicyType;
}

export class UploadDocumentResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'contract.pdf' })
  fileName: string;

  @ApiProperty({ example: '/documents/2024/01/contract-123.pdf' })
  storagePath: string;

  @ApiProperty({ enum: DocumentCategoryEnum, example: DocumentCategoryEnum.LAND_OWNERSHIP })
  category: DocumentCategoryEnum;

  @ApiProperty({ example: 'PENDING_VERIFICATION' })
  status: string;

  @ApiProperty({ example: 1024000 })
  sizeBytes: number;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  checksum: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  uploaderId: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiPropertyOptional({ example: 'https://api.example.com/documents/123' })
  documentUrl?: string;

  @ApiPropertyOptional({ example: 'https://api.example.com/documents/123/download' })
  downloadUrl?: string;

  constructor(partial: Partial<UploadDocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
