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
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  includeDeleted?: boolean;
}

/**
 * Full-text search options for document discovery, implying an external search index.
 */
export interface DocumentSearchOptions {
  query: string; // Search in filename and extracted metadata
  category?: DocumentCategory;
  status?: DocumentStatus;
  uploaderId?: UserId;
  tags?: string[]; // For future tagging system
}

/**
 * Pagination options for list queries.
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'fileName' | 'fileSize';
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
  byStatus: Record<string, number>; // e.g., { "VERIFIED": 100, "REJECTED": 20 }
  byCategory: Record<string, number>;
  totalSizeBytes: number;
  averageSizeBytes: number;
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
 * Repository interface for the Document aggregate root.
 * Defines the complete data access contract for the service.
 */
export interface IDocumentRepository {
  // ============================================================================
  // CORE PERSISTENCE
  // ============================================================================
  save(document: Document): Promise<void>;
  findById(id: DocumentId): Promise<Document | null>;
  findMany(
    filters: FindDocumentsFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>>;
  search(
    options: DocumentSearchOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>>;

  // ============================================================================
  // SPECIALIZED FINDERS
  // ============================================================================
  findByUploaderId(
    uploaderId: UserId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Document>>;
  findByAssetId(assetId: AssetId): Promise<Document[]>;
  findByWillId(willId: WillId): Promise<Document[]>;
  findIdentityDocuments(userId: UserId): Promise<Document[]>;
  findPendingVerification(pagination: PaginationOptions): Promise<PaginatedResult<Document>>;
  findByIds(ids: DocumentId[]): Promise<Document[]>;

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================
  softDeleteMany(ids: DocumentId[], deletedBy: UserId): Promise<BulkOperationResult>;
  updateStatusMany(
    ids: DocumentId[],
    newStatus: DocumentStatus,
    updatedBy: UserId,
  ): Promise<BulkOperationResult>;

  // ============================================================================
  // VALIDATION & CHECKS
  // ============================================================================
  exists(id: DocumentId): Promise<boolean>;
  hasAccess(documentId: DocumentId, userId: UserId): Promise<boolean>;

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================
  getStats(filters?: FindDocumentsFilters): Promise<DocumentStats>;
  getStorageStats(): Promise<{
    totalSizeBytes: number;
    byCategory: Record<string, number>;
    byStorageProvider: Record<string, number>;
  }>;
  getVerificationMetrics(timeRange: { start: Date; end: Date }): Promise<{
    totalVerified: number;
    totalRejected: number;
    averageVerificationTimeHours: number;
    byVerifier: Record<string, { verified: number; rejected: number }>; // Key is VerifierId
  }>;

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================
  /**
   * Permanently deletes document records and their associated files
   * from storage for documents soft-deleted longer than the specified date.
   * Returns the number of documents purged.
   */
  purgeSoftDeleted(olderThan: Date): Promise<number>;
}
