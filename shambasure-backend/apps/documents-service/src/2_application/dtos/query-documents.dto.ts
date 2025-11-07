import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategoryEnum } from '../../3_domain/value-objects/document-category.vo';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';

export class QueryDocumentsDto {
  @ApiPropertyOptional({ description: 'Filter by uploader user ID' })
  @IsUUID()
  @IsOptional()
  uploaderId?: string;

  @ApiPropertyOptional({ enum: DocumentStatusEnum, description: 'Filter by document status' })
  @IsEnum(DocumentStatusEnum)
  @IsOptional()
  status?: DocumentStatusEnum;

  @ApiPropertyOptional({ enum: DocumentCategoryEnum, description: 'Filter by document category' })
  @IsEnum(DocumentCategoryEnum)
  @IsOptional()
  category?: DocumentCategoryEnum;

  @ApiPropertyOptional({ description: 'Filter by asset ID' })
  @IsUUID()
  @IsOptional()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Filter by will ID' })
  @IsUUID()
  @IsOptional()
  willId?: string;

  @ApiPropertyOptional({ description: 'Filter by identity user ID' })
  @IsUUID()
  @IsOptional()
  identityForUserId?: string;

  @ApiPropertyOptional({ description: 'Filter by public/private status' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Filter by encryption status' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  encrypted?: boolean;

  @ApiPropertyOptional({ description: 'Filter by storage provider' })
  @IsString()
  @IsOptional()
  storageProvider?: string;

  @ApiPropertyOptional({ description: 'Filter by document number' })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Filter by issuing authority' })
  @IsString()
  @IsOptional()
  issuingAuthority?: string;

  @ApiPropertyOptional({
    description: 'Filter documents created after this date',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter documents created before this date',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  createdBefore?: string;

  @ApiPropertyOptional({
    description: 'Filter documents updated after this date',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  updatedAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter documents updated before this date',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  updatedBefore?: string;

  @ApiPropertyOptional({ description: 'Include soft-deleted documents', default: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({ description: 'Filter by expired status' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  hasExpired?: boolean;

  @ApiPropertyOptional({ description: 'Filter by retention policy' })
  @IsString()
  @IsOptional()
  retentionPolicy?: string;

  @ApiPropertyOptional({ description: 'Filter by verifier user ID' })
  @IsUUID()
  @IsOptional()
  verifiedBy?: string;

  @ApiPropertyOptional({ description: 'Full-text search query' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ description: 'Tags for filtering', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 20 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'filename', 'sizeBytes', 'expiryDate'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'filename', 'sizeBytes', 'expiryDate'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginatedDocumentsResponseDto {
  @ApiPropertyOptional({ type: [Object] })
  data: any[]; // Will be DocumentResponseDto[]

  @ApiPropertyOptional()
  total: number;

  @ApiPropertyOptional()
  page: number;

  @ApiPropertyOptional()
  limit: number;

  @ApiPropertyOptional()
  totalPages: number;

  @ApiPropertyOptional()
  hasNext: boolean;

  @ApiPropertyOptional()
  hasPrevious: boolean;

  constructor(partial: Partial<PaginatedDocumentsResponseDto>) {
    Object.assign(this, partial);
  }
}
