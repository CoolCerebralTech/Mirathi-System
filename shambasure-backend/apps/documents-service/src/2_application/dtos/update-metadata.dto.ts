import {
  IsObject,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMetadataDto {
  @ApiPropertyOptional({ description: 'Generic metadata as JSON object' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Document number (ID, parcel number, etc.)', maxLength: 50 })
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

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateAccessControlDto {
  @ApiPropertyOptional({ description: 'Make document publicly accessible' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'User IDs with view access', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedViewers?: string[];
}

export class UpdateDocumentResponseDto {
  @ApiPropertyOptional()
  id: string;

  @ApiProperty({ example: 'contract-v2.pdf' })
  fileName: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  documentNumber?: string;

  @ApiPropertyOptional()
  issueDate?: Date;

  @ApiPropertyOptional()
  expiryDate?: Date;

  @ApiPropertyOptional()
  issuingAuthority?: string;

  @ApiPropertyOptional()
  isPublic: boolean;

  @ApiPropertyOptional({ type: [String] })
  allowedViewers: string[];

  @ApiPropertyOptional()
  updatedAt: Date;

  constructor(partial: Partial<UpdateDocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
