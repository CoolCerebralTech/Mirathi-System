import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategoryEnum } from '../../domain/value-objects/document-category.vo';
import { DocumentStatusEnum } from '../../domain/value-objects/document-status.vo';
import { RetentionPolicyType } from '../../domain/value-objects/retention-policy.vo';
import { DocumentVersionResponseDto } from './document-version-response.dto';

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
