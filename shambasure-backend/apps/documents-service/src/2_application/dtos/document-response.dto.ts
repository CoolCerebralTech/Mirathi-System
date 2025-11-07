import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategoryEnum } from '../../3_domain/value-objects/document-category.vo';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  storagePath: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  sizeBytes: number;

  @ApiProperty({ enum: DocumentCategoryEnum })
  category: DocumentCategoryEnum;

  @ApiProperty({ enum: DocumentStatusEnum })
  status: DocumentStatusEnum;

  @ApiProperty()
  uploaderId: string;

  @ApiPropertyOptional()
  uploaderName?: string;

  @ApiPropertyOptional()
  verifiedBy?: string;

  @ApiPropertyOptional()
  verifiedByName?: string;

  @ApiPropertyOptional()
  verifiedAt?: Date;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  assetId?: string;

  @ApiPropertyOptional()
  willId?: string;

  @ApiPropertyOptional()
  identityForUserId?: string;

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

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  encrypted: boolean;

  @ApiProperty({ type: [String] })
  allowedViewers: string[];

  @ApiProperty()
  storageProvider: string;

  @ApiProperty()
  checksum: string;

  @ApiPropertyOptional()
  retentionPolicy?: string;

  @ApiProperty()
  version: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  previewUrl?: string;

  @ApiPropertyOptional()
  canEdit?: boolean;

  @ApiPropertyOptional()
  canDelete?: boolean;

  @ApiPropertyOptional()
  canVerify?: boolean;

  @ApiPropertyOptional()
  isExpired?: boolean;

  @ApiPropertyOptional()
  currentVersion?: number;

  @ApiPropertyOptional()
  totalVersions?: number;

  @ApiPropertyOptional()
  latestVersion?: DocumentVersionResponseDto;

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
