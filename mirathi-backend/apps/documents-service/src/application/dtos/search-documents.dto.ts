import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

import { DocumentCategoryEnum } from '../../domain/value-objects/document-category.vo';
import { DocumentStatusEnum } from '../../domain/value-objects/document-status.vo';

export class SearchDocumentsDto {
  @ApiPropertyOptional({ description: 'Search query (filename, documentNumber, metadata)' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ enum: DocumentCategoryEnum, description: 'Filter by category' })
  @IsEnum(DocumentCategoryEnum)
  @IsOptional()
  category?: DocumentCategoryEnum;

  @ApiPropertyOptional({ enum: DocumentStatusEnum, description: 'Filter by status' })
  @IsEnum(DocumentStatusEnum)
  @IsOptional()
  status?: DocumentStatusEnum;

  @ApiPropertyOptional({ description: 'Filter by uploader user ID' })
  @IsUUID()
  @IsOptional()
  uploaderId?: string;

  @ApiPropertyOptional({ description: 'Filter by tags', type: [String] })
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
}
