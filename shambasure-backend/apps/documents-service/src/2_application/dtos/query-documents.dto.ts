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
import { DocumentCategoryEnum } from '../../3_domain/value-objects/document-category.vo';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';

export class QueryDocumentsDto {
  @IsUUID()
  @IsOptional()
  uploaderId?: string;

  @IsEnum(DocumentStatusEnum)
  @IsOptional()
  status?: DocumentStatusEnum;

  @IsEnum(DocumentCategoryEnum)
  @IsOptional()
  category?: DocumentCategoryEnum;

  @IsUUID()
  @IsOptional()
  assetId?: string;

  @IsUUID()
  @IsOptional()
  willId?: string;

  @IsUUID()
  @IsOptional()
  identityForUserId?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  encrypted?: boolean;

  @IsString()
  @IsOptional()
  storageProvider?: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsString()
  @IsOptional()
  issuingAuthority?: string;

  @IsDateString()
  @IsOptional()
  createdAfter?: string;

  @IsDateString()
  @IsOptional()
  createdBefore?: string;

  @IsDateString()
  @IsOptional()
  updatedAfter?: string;

  @IsDateString()
  @IsOptional()
  updatedBefore?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeDeleted?: boolean = false;

  // Search query (full-text search across filename, documentNumber, metadata)
  @IsString()
  @IsOptional()
  query?: string;

  // Tags for future tagging system
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  // Pagination
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  // Sorting
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'filename', 'sizeBytes', 'expiryDate'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginatedDocumentsResponseDto {
  data: DocumentResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;

  constructor(partial: Partial<PaginatedDocumentsResponseDto>) {
    Object.assign(this, partial);
  }
}
