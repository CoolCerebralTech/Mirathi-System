import {
  Document as PrismaDocument,
  DocumentVersion as PrismaDocumentVersion,
  DocumentStatus,
} from '@shamba/database';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DocumentVersionEntity - Serializable document version for API responses
 * Represents a single version of a document (for version history tracking)
 */
@Exclude()
export class DocumentVersionEntity implements PrismaDocumentVersion {
  @Expose()
  @ApiProperty({ 
    example: 'clx789012345',
    description: 'Unique version identifier'
  })
  id!: string;

  @Expose()
  @ApiProperty({ 
    example: 2,
    description: 'Sequential version number'
  })
  versionNumber!: number;

  @Expose()
  @ApiProperty({ 
    example: 'uploads/documents/title-deed-v2.pdf',
    description: 'Storage path for this version'
  })
  storagePath!: string;

  @Expose()
  @ApiProperty({ 
    required: false,
    nullable: true,
    example: 'Updated with clearer scan',
    description: 'Optional note describing changes in this version'
  })
  changeNote!: string | null;

  @Expose()
  @ApiProperty({ 
    example: 'clx456789012',
    description: 'Parent document ID'
  })
  documentId!: string;

  @Expose()
  @ApiProperty({ 
    example: '2025-01-20T14:30:00Z',
    description: 'Version creation timestamp'
  })
  createdAt!: Date;

  constructor(partial: Partial<PrismaDocumentVersion>) {
    Object.assign(this, partial);
  }
}

/**
 * DocumentEntity - Serializable document for API responses
 * 
 * ARCHITECTURAL NOTE:
 * ----------------------
 * This entity is a clean DTO for API responses. It:
 * - Excludes the 'uploader' relation (circular reference)
 * - Includes uploaderId for reference
 * - Optionally includes versions array
 * - Contains NO business logic (that lives in DocumentsService)
 * 
 * Business logic methods (validation, checks, transformations) belong in:
 * - DocumentsService: Domain logic
 * - Helper classes: Reusable utilities
 * - NOT in entities: They are DTOs only
 */
@Exclude()
export class DocumentEntity implements Omit<PrismaDocument, 'uploader'> {
  @Expose()
  @ApiProperty({ 
    example: 'clx456789012',
    description: 'Unique document identifier'
  })
  id!: string;

  @Expose()
  @ApiProperty({ 
    example: 'title-deed-parcel-123.pdf',
    description: 'Original filename'
  })
  filename!: string;

  @Expose()
  @ApiProperty({ 
    example: 'uploads/documents/clx456789012/title-deed.pdf',
    description: 'Current storage path (latest version)'
  })
  storagePath!: string;

  @Expose()
  @ApiProperty({ 
    example: 'application/pdf',
    description: 'MIME type of the document'
  })
  mimeType!: string;

  @Expose()
  @ApiProperty({ 
    example: 2048576,
    description: 'File size in bytes'
  })
  sizeBytes!: number;

  @Expose()
  @ApiProperty({ 
    enum: DocumentStatus,
    example: DocumentStatus.VERIFIED,
    description: 'Current verification status'
  })
  status!: DocumentStatus;

  @Expose()
  @ApiProperty({ 
    example: 'clx123456789',
    description: 'ID of the user who uploaded this document'
  })
  uploaderId!: string;

  @Expose()
  @ApiProperty({ 
    example: '2025-01-15T10:30:00Z',
    description: 'Document creation timestamp'
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ 
    example: '2025-01-20T14:45:00Z',
    description: 'Last update timestamp'
  })
  updatedAt!: Date;

  @Expose()
  @ApiProperty({ 
    type: [DocumentVersionEntity],
    required: false,
    description: 'Version history (optional, included when requested)'
  })
  @Type(() => DocumentVersionEntity)
  versions?: DocumentVersionEntity[];

  constructor(partial: Partial<PrismaDocument & { versions?: PrismaDocumentVersion[] }>) {
    Object.assign(this, partial);

    // Transform versions array if present
    if (partial.versions) {
      this.versions = partial.versions.map(v => new DocumentVersionEntity(v));
    }
  }
}

/**
 * DocumentListEntity - Lightweight document for list responses
 * Used in paginated lists where version history is not needed
 */
@Exclude()
export class DocumentListEntity implements Omit<PrismaDocument, 'uploader'> {
  @Expose()
  @ApiProperty({ example: 'clx456789012' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'title-deed-parcel-123.pdf' })
  filename!: string;

  @Expose()
  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @Expose()
  @ApiProperty({ example: 2048576 })
  sizeBytes!: number;

  @Expose()
  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.VERIFIED })
  status!: DocumentStatus;

  @Expose()
  @ApiProperty({ example: 'clx123456789' })
  uploaderId!: string;

  @Expose()
  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: '2025-01-20T14:45:00Z' })
  updatedAt!: Date;

  // Exclude storage path from list view (security)
  storagePath!: string;

  // Exclude versions from list view (performance)
  versions?: DocumentVersionEntity[];

  constructor(partial: Partial<PrismaDocument>) {
    Object.assign(this, partial);
  }
}