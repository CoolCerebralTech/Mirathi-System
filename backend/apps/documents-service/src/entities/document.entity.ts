import { DocumentStatus } from '@shamba/common';
import { Exclude } from 'class-transformer';

export class DocumentEntity {
  id: string;
  filename: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  uploaderId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  versions?: DocumentVersionEntity[];
  uploader?: any;

  constructor(partial: Partial<DocumentEntity>) {
    Object.assign(this, partial);
  }

  // Business logic methods
  canBeModified(): boolean {
    return this.status === DocumentStatus.PENDING_VERIFICATION || 
           this.status === DocumentStatus.REJECTED;
  }

  canBeDeleted(): boolean {
    return this.status !== DocumentStatus.VERIFIED; // Prevent deletion of verified docs
  }

  isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  isPDF(): boolean {
    return this.mimeType === 'application/pdf';
  }

  isSupportedType(): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    return supportedTypes.includes(this.mimeType);
  }

  getFileExtension(): string {
    return this.filename.split('.').pop()?.toLowerCase() || '';
  }

  shouldBeCompressed(): boolean {
    return this.isImage() && this.sizeBytes > 1024 * 1024; // Compress images > 1MB
  }

  requiresOCR(): boolean {
    return this.isPDF() || this.isImage();
  }

  getSecurityLevel(): 'low' | 'medium' | 'high' {
    const sensitiveKeywords = ['title', 'deed', 'contract', 'agreement', 'will'];
    const filename = this.originalFilename.toLowerCase();
    
    if (sensitiveKeywords.some(keyword => filename.includes(keyword))) {
      return 'high';
    }
    
    return this.isImage() ? 'medium' : 'low';
  }
}

export class DocumentVersionEntity {
  id: string;
  versionNumber: number;
  storagePath: string;
  changeNote?: string;
  documentId: string;
  createdAt: Date;

  // Relations
  document?: DocumentEntity;

  constructor(partial: Partial<DocumentVersionEntity>) {
    Object.assign(this, partial);
  }

  // Business logic methods
  isCurrentVersion(currentVersion: number): boolean {
    return this.versionNumber === currentVersion;
  }

  shouldBeArchived(): boolean {
    // Keep only last 5 versions, archive older ones
    return this.versionNumber < (this.document?.versions?.length || 1) - 5;
  }
}

export class DocumentVerificationResult {
  documentId: string;
  status: DocumentStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  checks: VerificationCheck[];
  confidenceScore: number;
  reasons: string[];

  constructor(partial: Partial<DocumentVerificationResult>) {
    Object.assign(this, partial);
  }
}

export class VerificationCheck {
  name: string;
  passed: boolean;
  details?: string;
  confidence: number;
  metadata?: Record<string, any>;
}