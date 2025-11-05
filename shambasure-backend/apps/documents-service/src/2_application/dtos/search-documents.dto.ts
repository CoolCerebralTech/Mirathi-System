import { IsString, IsEnum, IsOptional, IsUUID, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentCategoryEnum } from '../../3_domain/value-objects/document-category.vo';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';

export class SearchDocumentsDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsEnum(DocumentCategoryEnum)
  @IsOptional()
  category?: DocumentCategoryEnum;

  @IsEnum(DocumentStatusEnum)
  @IsOptional()
  status?: DocumentStatusEnum;

  @IsUUID()
  @IsOptional()
  uploaderId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
