import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  IsObject,
  IsBoolean,
  IsArray,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating a document's metadata, details, and access control properties.
 * All fields are optional for PATCH operations.
 */
export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: 'New filename for the document', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Document number (e.g., ID number, parcel number)',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Date document was issued (ISO 8601 format)' })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Date document expires (ISO 8601 format)' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Authority that issued the document', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  issuingAuthority?: string;

  @ApiPropertyOptional({
    description: 'Merge with existing metadata. Use `null` for a field to remove it.',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Make document publicly accessible.' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Replace the list of user IDs with view access.',
    type: [String],
    format: 'uuid',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  allowedViewers?: string[];
}

/**
 * The response DTO after a successful document update.
 */
export class UpdateDocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  version: number;

  constructor(partial: Partial<UpdateDocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
