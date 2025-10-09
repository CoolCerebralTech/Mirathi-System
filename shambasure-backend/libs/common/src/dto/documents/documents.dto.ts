import { IsString, IsEnum, IsOptional, MaxLength, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '../../enums';
import { BaseResponseDto } from '../shared/base.response.dto';
import { PaginationQueryDto } from '../shared/pagination.dto';

// ============================================================================
// ARCHITECTURAL NOTE: File Uploads
// ============================================================================
// The DTO for the initial file upload endpoint is intentionally minimal.
// Metadata like filename, size, and MIME type should be derived from the
// file stream on the server-side (`@UploadedFile()` in NestJS) rather than
// trusted from client input. This is a critical security measure.
// The DTO may contain IDs for related entities, like an Asset or a Will.
// ============================================================================

// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================

export class InitiateDocumentUploadRequestDto {
  @ApiPropertyOptional({
    description: 'The ID of an asset this document is related to.',
  })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional({
    description: 'The ID of a will this document is related to.',
  })
  @IsOptional()
  @IsUUID()
  willId?: string;
}

export class UpdateDocumentRequestDto {
  @ApiPropertyOptional({
    description: 'A new, user-friendly name for the document.',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  filename?: string;

  // Note: Only specific roles (e.g., an Admin or a verification service)
  // should be allowed to change the document status.
  @ApiPropertyOptional({
    description: 'The new verification status of the document.',
    enum: DocumentStatus,
  })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}

/**
 * Defines the query parameters for filtering a list of documents.
 */
export class DocumentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter documents by their verification status.',
    enum: DocumentStatus,
  })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({
    description: 'Filter documents by the ID of the user who uploaded them.',
  })
  @IsOptional()
  @IsUUID()
  uploaderId?: string;
}

export class AddDocumentVersionDto {
  @ApiPropertyOptional({
    description: 'Optional note describing changes made in this version of the document',
    maxLength: 500,
    example: 'Updated passport with renewed expiry date',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}

// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================

export class DocumentVersionResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'The sequential version number of this document record.',
  })
  versionNumber!: number;

  @ApiProperty({
    description: 'The path to the file in the storage system (e.g., an S3 key).',
  })
  storagePath!: string;

  @ApiPropertyOptional({
    description: 'A note describing the change in this version.',
  })
  changeNote?: string;

  @ApiProperty({ description: 'The ID of the parent document.' })
  documentId!: string;
}

export class DocumentResponseDto extends BaseResponseDto {
  @ApiProperty({ description: 'The user-friendly name of the document.' })
  filename!: string;

  @ApiProperty({
    description: 'The path to the current version of the file in storage.',
  })
  storagePath!: string;

  @ApiProperty({
    description: 'The MIME type of the uploaded file.',
    example: 'application/pdf',
  })
  mimeType!: string;

  @ApiProperty({
    description: 'The size of the file in bytes.',
    example: 1024768,
  })
  sizeBytes!: number;

  @ApiProperty({
    enum: DocumentStatus,
    description: 'The current verification status.',
  })
  status: DocumentStatus = DocumentStatus.PENDING_VERIFICATION; // ✅ enum constant

  @ApiProperty({ description: 'The ID of the user who uploaded the document.' })
  uploaderId!: string;

  @ApiProperty({
    description: 'A list of all historical versions of this document.',
    type: [DocumentVersionResponseDto],
  })
  versions!: DocumentVersionResponseDto[];
}
