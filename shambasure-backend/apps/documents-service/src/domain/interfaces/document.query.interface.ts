import {
  DocumentId,
  UserId,
  WillId,
  AssetId,
  DocumentCategory,
  DocumentStatus,
  StorageProvider,
} from '../value-objects';

// ============================================================================
// Data Transfer Objects (DTOs) and Query Models
// These should be kept with the query interface as they define the 'shape' of the read data.
// ============================================================================

/**
 * A lightweight, flattened representation of a Document for read operations.
 * This DTO is suitable for API responses and UI displays.
 */
export interface DocumentDTO {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  status: string;
  uploaderId: string;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
  assetId: string | null;
  willId: string | null;
  identityForUserId: string | null;
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  isPublic: boolean;
  isIndexed: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

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

export interface DocumentSearchOptions {
  query: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  uploaderId?: UserId;
  tags?: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'fileName' | 'fileSize' | 'expiryDate';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

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

export interface ExpiringDocument {
  id: DocumentId;
  fileName: string;
  expiryDate: Date;
  uploaderId: UserId;
  daysUntilExpiry: number;
}

// ============================================================================
// Query Repository Interface
// ============================================================================

/**
 * Defines the contract for all read, search, and reporting operations for documents (Query Side).
 *
 * This interface adheres to the CQRS pattern. Its methods are designed for efficient data retrieval
 * and should return lightweight DTOs or plain objects, NOT the full Document domain aggregate.
 * This allows the underlying implementation to be highly optimized for reads (e.g., using a
 * denormalized read model, a different database, or a search engine like Elasticsearch).
 *
 * @see IDocumentRepository for write and transactional operations.
 */
export interface IDocumentQueryRepository {
  // ============================================================================
  // LIST & SEARCH QUERIES
  // ============================================================================

  findMany(
    filters: FindDocumentsFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<DocumentDTO>>;

  search(
    options: DocumentSearchOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<DocumentDTO>>;

  findPendingVerification(pagination: PaginationOptions): Promise<PaginatedResult<DocumentDTO>>;

  findAccessibleByUser(
    userId: UserId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<DocumentDTO>>;

  // ============================================================================
  // SPECIALIZED & REPORTING QUERIES
  // ============================================================================

  findByAssetId(assetId: AssetId): Promise<DocumentDTO[]>;

  findByWillId(willId: WillId): Promise<DocumentDTO[]>;

  findIdentityDocuments(userId: UserId): Promise<DocumentDTO[]>;

  findExpiringSoon(withinDays: number): Promise<ExpiringDocument[]>;

  findExpired(): Promise<DocumentDTO[]>;

  findOrphaned(): Promise<DocumentDTO[]>;

  // ============================================================================
  // VALIDATION & CHECK QUERIES
  // ============================================================================

  exists(id: DocumentId): Promise<boolean>;

  hasAccess(documentId: DocumentId, userId: UserId): Promise<boolean>;

  isVerified(documentId: DocumentId): Promise<boolean>;

  isExpired(documentId: DocumentId): Promise<boolean>;

  // ============================================================================
  // ANALYTICS & STATISTICS
  // ============================================================================

  getStats(filters?: FindDocumentsFilters): Promise<DocumentStats>;

  getStorageStats(): Promise<{
    totalSizeBytes: number;
    byCategory: Record<string, number>;
    byStorageProvider: Record<string, number>;
    byUser: Array<{ userId: string; totalBytes: number; documentCount: number }>;
  }>;

  getVerificationMetrics(timeRange: { start: Date; end: Date }): Promise<{
    totalVerified: number;
    totalRejected: number;
    totalPending: number;
    averageVerificationTimeHours: number;
    byVerifier: Record<string, { verified: number; rejected: number }>;
  }>;

  getUploadStats(timeRange: { start: Date; end: Date }): Promise<{
    totalUploads: number;
    byCategory: Record<string, number>;
    byDay: Array<{ date: string; count: number; totalBytes: number }>;
  }>;
}
