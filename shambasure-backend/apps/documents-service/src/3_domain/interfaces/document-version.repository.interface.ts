import { DocumentVersion } from '../models/document-version.model';
import { DocumentVersionId, DocumentId, UserId, MimeType } from '../value-objects';

/**
 * Query filters for fetching document versions.
 */
export interface FindDocumentVersionsFilters {
  documentId?: DocumentId;
  uploadedBy?: UserId;
  versionNumber?: number;
  versionNumberGte?: number; // Greater than or equal
  versionNumberLte?: number; // Less than or equal
  mimeType?: MimeType;
  createdAfter?: Date;
  createdBefore?: Date;
  minFileSize?: number;
  maxFileSize?: number;
}

/**
 * Options for sorting and limiting version queries.
 */
export interface VersionQueryOptions {
  sortBy?: 'versionNumber' | 'createdAt' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Statistics for version storage usage.
 */
export interface VersionStorageStats {
  totalVersions: number;
  totalSizeBytes: number;
  averageSizeBytes: number;
  oldestVersion: Date;
  newestVersion: Date;
}

/**
 * Version comparison result.
 */
export interface VersionComparison {
  olderVersionId: DocumentVersionId;
  newerVersionId: DocumentVersionId;
  sizeDifference: number; // In bytes (positive = grew, negative = shrunk)
  timeDifference: number; // In hours
  uploaderChanged: boolean;
}

/**
 * Repository interface for the DocumentVersion entity.
 * Defines the contract for persisting and retrieving version history.
 */
export interface IDocumentVersionRepository {
  // ============================================================================
  // CORE PERSISTENCE
  // ============================================================================

  /**
   * Saves a new DocumentVersion entity to the database.
   * Since versions are immutable, this will always be an insert operation.
   * @throws {DuplicateVersionError} if version number already exists for document
   */
  save(version: DocumentVersion): Promise<void>;

  /**
   * Saves multiple versions in a transaction.
   */
  saveMany(versions: DocumentVersion[]): Promise<void>;

  // ============================================================================
  // CORE FINDERS
  // ============================================================================

  /**
   * Finds a single version by its unique identifier.
   */
  findById(id: DocumentVersionId): Promise<DocumentVersion | null>;

  /**
   * Finds a specific version of a document by its number.
   */
  findByDocumentIdAndVersionNumber(
    documentId: DocumentId,
    versionNumber: number,
  ): Promise<DocumentVersion | null>;

  /**
   * Finds all versions for a given document, sorted by version number descending by default.
   */
  findAllByDocumentId(
    documentId: DocumentId,
    options?: VersionQueryOptions,
  ): Promise<DocumentVersion[]>;

  /**
   * A flexible method to find versions based on various criteria.
   */
  findMany(
    filters: FindDocumentVersionsFilters,
    options?: VersionQueryOptions,
  ): Promise<DocumentVersion[]>;

  /**
   * Finds the most recent version of a document (highest version number).
   */
  findLatestForDocument(documentId: DocumentId): Promise<DocumentVersion | null>;

  /**
   * Finds the first/initial version of a document (version 1).
   */
  findInitialForDocument(documentId: DocumentId): Promise<DocumentVersion | null>;

  /**
   * Finds versions within a specific range for a document.
   */
  findVersionRange(
    documentId: DocumentId,
    startVersion: number,
    endVersion: number,
  ): Promise<DocumentVersion[]>;

  /**
   * Finds multiple versions by their IDs (batch fetch).
   */
  findByIds(ids: DocumentVersionId[]): Promise<DocumentVersion[]>;

  /**
   * Finds all versions uploaded by a specific user.
   */
  findByUploader(userId: UserId, options?: VersionQueryOptions): Promise<DocumentVersion[]>;

  // ============================================================================
  // VALIDATION & CHECKS
  // ============================================================================

  /**
   * Checks if a specific version exists. More performant than fetching the full entity.
   */
  exists(id: DocumentVersionId): Promise<boolean>;

  /**
   * Checks if a specific version number exists for a document.
   */
  existsForDocument(documentId: DocumentId, versionNumber: number): Promise<boolean>;

  /**
   * Gets the next available version number for a document.
   */
  getNextVersionNumber(documentId: DocumentId): Promise<number>;

  /**
   * Validates if a version can be created (checks sequence).
   */
  canCreateVersion(documentId: DocumentId, versionNumber: number): Promise<boolean>;

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  /**
   * Counts the number of versions associated with a document.
   */
  countForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Calculates the total storage size (in bytes) of all versions for a document.
   */
  getTotalStorageUsageForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Gets comprehensive storage statistics for a document's versions.
   */
  getStorageStatsForDocument(documentId: DocumentId): Promise<VersionStorageStats>;

  /**
   * Gets storage statistics across all documents.
   */
  getGlobalStorageStats(): Promise<{
    totalVersions: number;
    totalDocuments: number;
    totalSizeBytes: number;
    averageVersionsPerDocument: number;
    topDocumentsByVersionCount: Array<{ documentId: string; versionCount: number }>;
    topDocumentsBySize: Array<{ documentId: string; totalBytes: number }>;
  }>;

  /**
   * Gets version activity statistics for a time range.
   */
  getVersionActivityStats(timeRange: { start: Date; end: Date }): Promise<{
    totalVersionsCreated: number;
    byDay: Array<{ date: string; count: number }>;
    byUser: Record<string, number>;
    averageVersionsPerDay: number;
  }>;

  /**
   * Compares two versions of the same document.
   */
  compareVersions(
    versionId1: DocumentVersionId,
    versionId2: DocumentVersionId,
  ): Promise<VersionComparison>;

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  /**
   * Deletes old versions based on retention policy.
   * Keeps only the latest N versions per document.
   * @returns Number of versions deleted
   */
  pruneOldVersions(documentId: DocumentId, keepLatest: number): Promise<number>;

  /**
   * Deletes all versions for a document (when document is hard-deleted).
   * @returns Number of versions deleted
   */
  deleteAllForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Finds versions older than specified date for cleanup.
   */
  findOlderThan(date: Date): Promise<DocumentVersion[]>;

  /**
   * Deletes versions older than specified date.
   * @returns Number of versions deleted
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Finds large versions (above specified size) for storage optimization.
   */
  findLargeVersions(minSizeBytes: number): Promise<DocumentVersion[]>;

  /**
   * Archives old versions to cheaper storage.
   * @returns Number of versions archived
   */
  archiveOldVersions(olderThan: Date): Promise<number>;

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Deletes multiple versions by their IDs.
   * @returns Number of versions deleted
   */
  deleteMany(ids: DocumentVersionId[]): Promise<number>;

  /**
   * Finds versions for multiple documents.
   */
  findForDocuments(documentIds: DocumentId[]): Promise<Map<string, DocumentVersion[]>>;

  /**
   * Gets version counts for multiple documents.
   */
  getVersionCountsForDocuments(documentIds: DocumentId[]): Promise<Map<string, number>>;
}
