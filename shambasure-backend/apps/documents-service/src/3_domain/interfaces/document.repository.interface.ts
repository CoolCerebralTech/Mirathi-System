import { Document } from '../models/document.model';
import {
  DocumentId,
  UserId,
  WillId,
  AssetId,
  DocumentCategory,
  DocumentStatus,
  StorageProvider,
} from '../value-objects';

/**
 * Advanced query filters for fetching documents.
 */
export interface FindDocumentsFilters {
  uploaderId?: UserId;
  status?: DocumentStatus;
  category?: DocumentCategory;
  assetId?: AssetId;
  willId?: WillId;
  identityForUserId?: UserId;
  isPublic?: boolean;
  encrypted?: boolean;
  storageProvider?: StorageProvider;
  verifiedBy?: UserId;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  includeDeleted?: boolean;
  hasExpired?: boolean;
  retentionPolicy?: string;
}

/**
 * Full-text search options for document discovery.
 */
export interface DocumentSearchOptions {
  query: string; // Search in filename, documentNumber, and metadata
  category?: DocumentCategory;
  status?: DocumentStatus;
  uploaderId?: UserId;
  tags?: string[];
}

/**
 * Pagination options for list queries.
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'fileName' | 'fileSize' | 'expiryDate';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result wrapper with enhanced metadata.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Document statistics for dashboards and reporting.
 */
export interface DocumentStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  totalSizeBytes: number;
  averageSizeBytes: number;
  encrypted: number;
  public: number;
  expired: number;
}

/**
 * Result of a bulk operation.
 */
export interface BulkOperationResult {
  successCount: number;
  failedCount: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Expiring documents result for scheduled jobs.
 */
export interface ExpiringDocument {
  id: DocumentId;
  fileName: string;
  expiryDate: Date;
  uploaderId: UserId;
  daysUntilExpiry: number;
}

/**
 * Repository interface for the Document aggregate root.
 * Defines the complete data access contract for the document service.
 */
export interface IDocumentRepository {
  // ============================================================================
  // CORE PERSISTENCE
  // ============================================================================

  /**
   * Saves a document (insert or update based on existence).
   * Uses optimistic locking via version field.
   * @throws {ConcurrentModificationError} if version mismatch
   */
  save(document: Document): Promise<void>;

  /**
   * Finds a document by its unique identifier.
   * Returns null if not found or soft-deleted (unless includeDeleted is specified).
   */
  findById(id: DocumentId, includeDeleted?: boolean): Promise<Document | null>;

  /**
   * Finds multiple documents with advanced filtering and pagination.
   */
  findMany(
    filters: FindDocumentsFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>>;

  /**
   * Full-text search across documents.
   * Typically implemented using database full-text search or external search engine.
   */
  search(
    options: DocumentSearchOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>>;

  // ============================================================================
  // SPECIALIZED FINDERS
  // ============================================================================

  /**
   * Finds all documents uploaded by a specific user.
   */
  findByUploaderId(
    uploaderId: UserId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>>;

  /**
   * Finds all documents linked to a specific asset.
   */
  findByAssetId(assetId: AssetId): Promise<Document[]>;

  /**
   * Finds all documents linked to a specific will.
   */
  findByWillId(willId: WillId): Promise<Document[]>;

  /**
   * Finds all identity documents for a specific user.
   */
  findIdentityDocuments(userId: UserId): Promise<Document[]>;

  /**
   * Finds all documents pending verification.
   */
  findPendingVerification(pagination: PaginationOptions): Promise<PaginatedResult<Document>>;

  /**
   * Finds multiple documents by their IDs (batch fetch).
   */
  findByIds(ids: DocumentId[]): Promise<Document[]>;

  /**
   * Finds documents that are expiring soon (within specified days).
   */
  findExpiringSoon(withinDays: number): Promise<ExpiringDocument[]>;

  /**
   * Finds documents that have already expired.
   */
  findExpired(): Promise<Document[]>;

  /**
   * Finds documents accessible by a specific user (owner, shared, or public).
   */
  findAccessibleByUser(
    userId: UserId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>>;

  /**
   * Finds documents by retention policy.
   */
  findByRetentionPolicy(policy: string): Promise<Document[]>;

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Soft deletes multiple documents.
   */
  softDeleteMany(ids: DocumentId[], deletedBy: UserId): Promise<BulkOperationResult>;

  /**
   * Updates status for multiple documents (admin operation).
   */
  updateStatusMany(
    ids: DocumentId[],
    newStatus: DocumentStatus,
    updatedBy: UserId,
  ): Promise<BulkOperationResult>;

  /**
   * Shares multiple documents with users.
   */
  shareMany(
    ids: DocumentId[],
    sharedBy: UserId,
    sharedWith: UserId[],
  ): Promise<BulkOperationResult>;

  // ============================================================================
  // VALIDATION & CHECKS
  // ============================================================================

  /**
   * Checks if a document exists (more performant than full fetch).
   */
  exists(id: DocumentId): Promise<boolean>;

  /**
   * Checks if a user has access to a document.
   */
  hasAccess(documentId: DocumentId, userId: UserId): Promise<boolean>;

  /**
   * Checks if a document is verified.
   */
  isVerified(documentId: DocumentId): Promise<boolean>;

  /**
   * Checks if a document is expired.
   */
  isExpired(documentId: DocumentId): Promise<boolean>;

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  /**
   * Gets comprehensive document statistics.
   */
  getStats(filters?: FindDocumentsFilters): Promise<DocumentStats>;

  /**
   * Gets storage usage statistics.
   */
  getStorageStats(): Promise<{
    totalSizeBytes: number;
    byCategory: Record<string, number>;
    byStorageProvider: Record<string, number>;
    byUser: Array<{ userId: string; totalBytes: number; documentCount: number }>;
  }>;

  /**
   * Gets verification metrics for a time range.
   */
  getVerificationMetrics(timeRange: { start: Date; end: Date }): Promise<{
    totalVerified: number;
    totalRejected: number;
    totalPending: number;
    averageVerificationTimeHours: number;
    byVerifier: Record<string, { verified: number; rejected: number }>;
  }>;

  /**
   * Gets daily upload statistics.
   */
  getUploadStats(timeRange: { start: Date; end: Date }): Promise<{
    totalUploads: number;
    byCategory: Record<string, number>;
    byDay: Array<{ date: string; count: number; totalBytes: number }>;
  }>;

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  /**
   * Permanently deletes document records soft-deleted before the specified date.
   * This is for GDPR compliance and data retention policy enforcement.
   * @returns Number of documents purged
   */
  purgeSoftDeleted(olderThan: Date): Promise<number>;

  /**
   * Archives documents based on retention policy.
   * @returns Number of documents archived
   */
  archiveByRetentionPolicy(policy: string): Promise<number>;

  /**
   * Finds orphaned documents (not linked to any asset, will, or user identity).
   */
  findOrphaned(): Promise<Document[]>;

  /**
   * Cleans up orphaned documents older than specified date.
   */
  cleanupOrphaned(olderThan: Date): Promise<number>;

  // ============================================================================
  // TRANSACTION SUPPORT
  // ============================================================================

  /**
   * Saves multiple documents in a transaction.
   * All succeed or all fail.
   */
  saveMany(documents: Document[]): Promise<void>;

  /**
   * Deletes a document permanently (hard delete).
   * Used for GDPR right to be forgotten.
   */
  hardDelete(id: DocumentId): Promise<void>;

  /**
   * Deletes multiple documents permanently.
   */
  hardDeleteMany(ids: DocumentId[]): Promise<number>;
}
