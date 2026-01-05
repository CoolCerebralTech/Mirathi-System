// src/documents/entities/document.entity.ts
import { DocumentCategory, DocumentStatus } from '@prisma/client';

export class DocumentVersion {
  id: string;
  versionNumber: number;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string | null;
  ocrStatus: string;

  // Fix 1: Use specific object type instead of 'any | null'
  ocrData: Record<string, any> | null;

  uploadedBy: string;
  createdAt: Date;

  constructor(partial: Partial<DocumentVersion>) {
    Object.assign(this, partial);
  }

  // Logic: Check if this file is an image (processable by OCR)
  get isImage(): boolean {
    return ['image/jpeg', 'image/png', 'image/jpg'].includes(this.mimeType);
  }

  // Logic: Check if this file is a PDF
  get isPdf(): boolean {
    return this.mimeType === 'application/pdf';
  }
}

export class DocumentEntity {
  id: string;
  estateId: string;
  category: DocumentCategory;
  type: string | null; // e.g., "KENYAN_NATIONAL_ID"
  status: DocumentStatus;

  uploaderId: string;
  identityForUserId: string | null;

  // Cross-Service Reference
  assetId: string | null;
  willId: string | null;

  // Verification Tracking (Added to match Schema and fix unused var error)
  verifiedBy: string | null;

  // Metadata
  // Fix 1: Use specific object type instead of 'any | null'
  metadata: Record<string, any> | null;
  rejectionReason: string | null;

  createdAt: Date;
  updatedAt: Date;

  // Aggregate Relations
  versions: DocumentVersion[];

  constructor(partial: Partial<DocumentEntity>) {
    Object.assign(this, partial);
    // Ensure versions are instantiated as classes if passed
    if (partial.versions) {
      this.versions = partial.versions.map((v) => new DocumentVersion(v));
    } else {
      this.versions = [];
    }
  }

  // ===========================================================================
  // DOMAIN LOGIC (The Rules)
  // ===========================================================================

  /**
   * Returns the most recent version of the document.
   */
  get latestVersion(): DocumentVersion | undefined {
    if (!this.versions.length) return undefined;
    // Sort descending by version number
    return this.versions.sort((a, b) => b.versionNumber - a.versionNumber)[0];
  }

  /**
   * Rule: A document is locked from editing if it is currently VERIFIED.
   */
  get isLocked(): boolean {
    return this.status === DocumentStatus.VERIFIED;
  }

  /**
   * Rule: Can we upload a new version?
   * Yes, unless it's already verified or archived.
   */
  canUploadNewVersion(): boolean {
    return this.status !== DocumentStatus.VERIFIED;
  }

  /**
   * Action: Approve the document.
   */
  verify(verifierId: string): void {
    if (this.status === DocumentStatus.VERIFIED) {
      throw new Error('Document is already verified.');
    }
    this.status = DocumentStatus.VERIFIED;
    this.rejectionReason = null;

    // Fix 2: Actually use the variable to update state
    this.verifiedBy = verifierId;
  }

  /**
   * Action: Reject the document.
   */
  reject(verifierId: string, reason: string): void {
    if (!reason) throw new Error('Rejection reason is required.');

    this.status = DocumentStatus.REJECTED;
    this.rejectionReason = reason;

    // Fix 2: Actually use the variable to update state
    this.verifiedBy = verifierId;
  }

  /**
   * Helper: Prepare the S3/MinIO Key structure.
   * Format: {estateId}/{category}/{timestamp}_{uuid}.{ext}
   */
  generateStorageKey(mimeType: string): string {
    const ext = mimeType.split('/')[1] || 'bin';
    const timestamp = Date.now();
    // Random segment to prevent collisions
    const uuidSegment = this.id ? this.id.split('-')[0] : 'new';

    return `${this.estateId}/${this.category}/${timestamp}_${uuidSegment}.${ext}`;
  }
}
