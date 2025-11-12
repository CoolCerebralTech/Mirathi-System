import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategoryEnum } from '../../3_domain/value-objects/document-category.vo';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';
import { RetentionPolicyType } from '../../3_domain/value-objects/retention-policy.vo';

export class DocumentResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier for the document',
  })
  id: string;

  @ApiProperty({ example: 'contract.pdf' })
  fileName: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  sizeBytes: number;

  @ApiProperty({ enum: DocumentCategoryEnum, example: DocumentCategoryEnum.LAND_OWNERSHIP })
  category: DocumentCategoryEnum;

  @ApiProperty({ enum: DocumentStatusEnum, example: DocumentStatusEnum.VERIFIED })
  status: DocumentStatusEnum;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  uploaderId: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  uploaderName?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  verifiedBy?: string;

  @ApiPropertyOptional({ example: 'Jane Smith' })
  verifiedByName?: string;

  @ApiPropertyOptional({ example: '2024-01-15T11:30:00.000Z' })
  verifiedAt?: Date;

  @ApiPropertyOptional({ example: 'Document quality is poor' })
  rejectionReason?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  assetId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  willId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  identityForUserId?: string;

  @ApiPropertyOptional({ example: { author: 'John Doe', pages: 10 } })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: 'DOC-2024-001' })
  documentNumber?: string;

  @ApiPropertyOptional({ example: '2024-01-15T00:00:00.000Z' })
  issueDate?: Date;

  @ApiPropertyOptional({ example: '2025-01-15T00:00:00.000Z' })
  expiryDate?: Date;

  @ApiPropertyOptional({ example: 'Government Agency' })
  issuingAuthority?: string;

  @ApiProperty({ example: false })
  isPublic: boolean;

  @ApiProperty({ example: true })
  encrypted: boolean;

  @ApiProperty({ type: [String], example: ['user1-uuid', 'user2-uuid'] })
  allowedViewers: string[];

  @ApiProperty({ example: 'local' })
  storageProvider: string;

  // FIX: Added missing checksum property
  @ApiPropertyOptional({ example: 'a1b2c3d4e5f6...' })
  checksum?: string;

  @ApiProperty({ example: 2 })
  version: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T11:30:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: null })
  deletedAt?: Date;

  @ApiPropertyOptional({ example: 'https://api.example.com/documents/123/download' })
  downloadUrl?: string;

  @ApiPropertyOptional({ example: 'https://api.example.com/documents/123/preview' })
  previewUrl?: string;

  @ApiPropertyOptional({ example: true })
  canEdit?: boolean;

  @ApiPropertyOptional({ example: true })
  canDelete?: boolean;

  @ApiPropertyOptional({ example: false })
  canVerify?: boolean;

  @ApiPropertyOptional({ example: true })
  canShare?: boolean;

  @ApiPropertyOptional({ example: false })
  isExpired?: boolean;

  @ApiPropertyOptional({ example: 2 })
  currentVersion?: number;

  @ApiPropertyOptional({ example: 3 })
  totalVersions?: number;

  @ApiProperty({ example: false })
  isIndexed: boolean;

  @ApiPropertyOptional({ example: '2024-01-15T11:30:00.000Z' })
  indexedAt?: Date;

  @ApiPropertyOptional({ example: '2025-01-15T00:00:00.000Z' })
  expiresAt?: Date;

  @ApiPropertyOptional({ enum: RetentionPolicyType, example: RetentionPolicyType.LONG_TERM })
  retentionPolicy?: RetentionPolicyType;

  @ApiPropertyOptional({ type: () => DocumentVersionResponseDto })
  latestVersion?: DocumentVersionResponseDto;

  // FIX: Added permissions object to match mapper
  @ApiPropertyOptional({
    example: {
      canEdit: true,
      canDelete: true,
      canVerify: false,
      canShare: true,
    },
  })
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
    canVerify: boolean;
    canShare: boolean;
  };

  constructor(partial: Partial<DocumentResponseDto>) {
    Object.assign(this, partial);
  }
}

export class DocumentVersionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  versionNumber: number;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  storagePath: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  sizeBytes: number;

  @ApiProperty()
  checksum: string;

  @ApiPropertyOptional()
  changeNote?: string;

  @ApiProperty()
  uploadedBy: string;

  @ApiPropertyOptional()
  uploadedByName?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiProperty()
  fileSizeHumanReadable: string;

  constructor(partial: Partial<DocumentVersionResponseDto>) {
    Object.assign(this, partial);
  }
}

export class DocumentVerificationAttemptResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  verifierId: string;

  @ApiPropertyOptional()
  verifierName?: string;

  @ApiProperty({ enum: DocumentStatusEnum })
  status: DocumentStatusEnum;

  @ApiPropertyOptional()
  reason?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  isSuccessful?: boolean;

  @ApiPropertyOptional()
  isRejection?: boolean;

  constructor(partial: Partial<DocumentVerificationAttemptResponseDto>) {
    Object.assign(this, partial);
  }
}

export class DocumentStatsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  byStatus: Record<string, number>;

  @ApiProperty()
  byCategory: Record<string, number>;

  @ApiProperty()
  totalSizeBytes: number;

  @ApiProperty()
  averageSizeBytes: number;

  @ApiProperty()
  encrypted: number;

  @ApiProperty()
  public: number;

  @ApiProperty()
  expired: number;

  @ApiPropertyOptional()
  storageUsageByProvider?: Record<string, number>;

  constructor(partial: Partial<DocumentStatsResponseDto>) {
    Object.assign(this, partial);
  }
}
