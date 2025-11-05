import { DocumentCategoryEnum } from '../../3_domain/value-objects/document-category.vo';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';

export class DocumentResponseDto {
  id: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  category: DocumentCategoryEnum;
  status: DocumentStatusEnum;

  // Ownership & Upload Info
  uploaderId: string;
  uploaderName?: string;

  // Verification Tracking
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: Date;
  rejectionReason?: string;

  // Cross-service References
  assetId?: string;
  willId?: string;
  identityForUserId?: string;

  // Metadata & Extended Properties
  metadata?: Record<string, any>;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;

  // Security & Access Control
  isPublic: boolean;
  encrypted: boolean;
  allowedViewers: string[];
  storageProvider: string;
  checksum: string;

  // System Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Computed Properties
  downloadUrl?: string;
  previewUrl?: string;
  canEdit?: boolean;
  canDelete?: boolean;

  // Version Information
  currentVersion?: number;
  totalVersions?: number;
  latestVersion?: DocumentVersionResponseDto;

  constructor(partial: Partial<DocumentResponseDto>) {
    Object.assign(this, partial);
  }
}

export class DocumentVersionResponseDto {
  id: string;
  versionNumber: number;
  documentId: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  changeNote?: string;
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: Date;

  // Computed Properties
  downloadUrl?: string;
  fileSizeHumanReadable: string;

  constructor(partial: Partial<DocumentVersionResponseDto>) {
    Object.assign(this, partial);
  }
}

export class DocumentVerificationAttemptResponseDto {
  id: string;
  documentId: string;
  verifierId: string;
  verifierName?: string;
  status: DocumentStatusEnum;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;

  constructor(partial: Partial<DocumentVerificationAttemptResponseDto>) {
    Object.assign(this, partial);
  }
}

export class DocumentStatsResponseDto {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  totalSizeBytes: number;
  averageSizeBytes: number;
  storageUsageByProvider: Record<string, number>;

  constructor(partial: Partial<DocumentStatsResponseDto>) {
    Object.assign(this, partial);
  }
}
