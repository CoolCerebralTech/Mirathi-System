import { IsString, IsOptional, Min, MaxLength, IsEnum, IsInt, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentVersionDto {
  @ApiPropertyOptional({ description: 'Note describing changes in this version', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  changeNote?: string;
}

export class DocumentVersionQueryDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1, type: Number })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 50,
    default: 10,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({
    enum: ['versionNumber', 'createdAt', 'fileSize'],
    default: 'versionNumber',
  })
  @IsEnum(['versionNumber', 'createdAt', 'fileSize'])
  @IsOptional()
  sortBy: 'versionNumber' | 'createdAt' | 'fileSize' = 'versionNumber';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'desc';
}

export class CreateDocumentVersionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  versionNumber: number;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  storagePath: string;

  @ApiProperty()
  sizeBytes: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  checksum: string;

  @ApiPropertyOptional()
  changeNote?: string;

  @ApiProperty()
  uploadedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  downloadUrl?: string;

  constructor(partial: Partial<CreateDocumentVersionResponseDto>) {
    Object.assign(this, partial);
  }
}
