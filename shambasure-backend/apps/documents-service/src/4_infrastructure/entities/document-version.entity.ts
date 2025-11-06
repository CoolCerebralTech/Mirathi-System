/**
 * DocumentVersion Entity - Persistence Layer
 *
 * Represents the document_versions table structure in the database.
 * Immutable record of document version history.
 */
export interface DocumentVersionEntity {
  id: string;
  versionNumber: number;
  documentId: string;

  // File information
  storagePath: string;
  sizeBytes: number; // Note: This matches Prisma field name (not fileSize)
  mimeType: string;
  checksum: string | null; // FIXED: Made nullable per Prisma schema

  // Version metadata
  changeNote: string | null;
  uploadedBy: string;

  // Timestamp
  createdAt: Date;
}

/**
 * Create input for new versions
 */
export type CreateDocumentVersionEntity = Omit<DocumentVersionEntity, 'createdAt'>;

/**
 * NEW: Enhanced type definitions for better Prisma integration
 */

/**
 * Input for document version creation (aligns with Prisma create input)
 */
export type DocumentVersionCreateInput = {
  versionNumber: number;
  documentId: string;
  storagePath: string;
  sizeBytes: number;
  mimeType: string;
  checksum?: string | null;
  changeNote?: string | null;
  uploadedBy: string;
};

/**
 * Input for document version updates (typically minimal since versions are immutable)
 */
export type DocumentVersionUpdateInput = {
  // Note: Document versions are largely immutable in business logic
  // but we might need to update metadata in rare cases
  changeNote?: string | null;
  checksum?: string | null;
};

/**
 * Query filters for document version search
 */
export type DocumentVersionWhereInput = {
  id?: string | { in: string[] };
  documentId?: string | { in: string[] };
  versionNumber?: number | { in: number[] } | { gte?: number; lte?: number };
  uploadedBy?: string | { in: string[] };
  createdAt?: { gte?: Date; lte?: Date };
  mimeType?: string | { in: string[] };
  AND?: DocumentVersionWhereInput[];
  OR?: DocumentVersionWhereInput[];
};

/**
 * Sorting options for document version queries
 */
export type DocumentVersionOrderByInput = {
  versionNumber?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  sizeBytes?: 'asc' | 'desc';
};

/**
 * NEW: Specialized types for version-specific operations
 */

/**
 * Result type for version sequence queries
 */
export type VersionSequenceInfo = {
  currentVersion: number;
  totalVersions: number;
  latestVersionId: string;
  firstVersionId: string;
};

/**
 * Type for version comparison operations
 */
export type VersionComparisonResult = {
  currentVersion: DocumentVersionEntity;
  previousVersion: DocumentVersionEntity | null;
  changes: {
    sizeChanged: boolean;
    mimeTypeChanged: boolean;
    checksumChanged: boolean;
    storagePathChanged: boolean;
  };
};

/**
 * Type for bulk version operations
 */
export type BulkVersionOperationResult = {
  successCount: number;
  failedCount: number;
  errors: Array<{ versionId: string; error: string }>;
};

/**
 * Type for version analytics
 */
export type VersionAnalytics = {
  documentId: string;
  totalVersions: number;
  totalStorageBytes: number;
  averageVersionSize: number;
  versionHistory: Array<{
    versionNumber: number;
    sizeBytes: number;
    createdAt: Date;
    uploadedBy: string;
  }>;
};
