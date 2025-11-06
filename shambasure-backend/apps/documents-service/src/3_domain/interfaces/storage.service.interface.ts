import { StoragePath, DocumentChecksum, MimeType, FileName, FileSize } from '../value-objects';

// ============================================================================
// Data Transfer Objects (DTOs) for method return types
// ============================================================================

export interface SaveResult {
  path: StoragePath;
  size: FileSize;
  checksum: DocumentChecksum;
  storedAt: Date;
}

export interface RetrieveResult {
  buffer: Buffer;
  size: FileSize;
  checksum: DocumentChecksum;
  lastModified: Date;
}

export interface FileMetadataResult {
  size: FileSize;
  lastModified: Date;
  contentType?: MimeType;
  checksum?: DocumentChecksum;
}

export interface VirusScanResult {
  isClean: boolean;
  threatsFound: string[];
  scannedAt: Date;
}

export interface BulkDeleteResult {
  successCount: number;
  failedItems: Array<{ path: StoragePath; error: string }>;
}

export interface BulkCopyResult {
  successCount: number;
  failedItems: Array<{ sourcePath: StoragePath; error: string }>;
}

export interface PreviewResult {
  buffer: Buffer;
  path: StoragePath;
  mimeType: MimeType;
}

export interface StorageProviderInfo {
  providerName: string;
  totalSpace?: number;
  usedSpace?: number;
  availableSpace?: number;
}

export interface StorageAnalytics {
  totalFileCount: number;
  totalSizeBytes: number;
  byMimeType: Record<string, { count: number; sizeBytes: number }>;
  oldestFile?: Date;
  newestFile?: Date;
}

/**
 * IStorageService - Domain interface for file storage operations
 *
 * RESPONSIBILITIES:
 * - Abstract storage provider implementation
 * - Enforce type safety with domain value objects
 * - Define storage operation contracts
 *
 * DOES NOT:
 * - Implement storage logic (in Infrastructure layer)
 * - Handle business rules (in Domain layer)
 * - Manage transactions (in Application layer)
 */
export interface IStorageService {
  // ============================================================================
  // CORE FILE OPERATIONS
  // ============================================================================

  /**
   * Saves a file buffer to storage
   * @throws StorageError if save fails
   */
  save(
    buffer: Buffer,
    path: StoragePath,
    options?: {
      contentType?: MimeType;
      metadata?: Record<string, string>;
    },
  ): Promise<SaveResult>;

  /**
   * Retrieves a file from storage
   * @throws FileNotFoundError if file doesn't exist
   * @throws StorageError if retrieval fails
   */
  retrieve(
    path: StoragePath,
    options?: {
      validateChecksum?: boolean;
      expectedChecksum?: DocumentChecksum;
    },
  ): Promise<RetrieveResult>;

  /**
   * Deletes a file from storage
   * @throws StorageError if deletion fails
   */
  delete(path: StoragePath): Promise<void>;

  /**
   * Checks if a file exists in storage
   */
  exists(path: StoragePath): Promise<boolean>;

  /**
   * Gets file metadata without retrieving the full file
   */
  getMetadata(path: StoragePath): Promise<FileMetadataResult>;

  // ============================================================================
  // SECURITY & ACCESS
  // ============================================================================

  /**
   * Generates a pre-signed URL for secure file download
   */
  getPresignedDownloadUrl(
    path: StoragePath,
    options?: {
      expiresInSeconds?: number;
      fileNameToSuggest?: FileName;
      disposition?: 'inline' | 'attachment';
    },
  ): Promise<string>;

  /**
   * Scans a file buffer for viruses/malware
   * @returns Scan result with threat information
   */
  scanForViruses(buffer: Buffer): Promise<VirusScanResult>;

  /**
   * Validates file checksum integrity
   */
  validateChecksum(path: StoragePath, expectedChecksum: DocumentChecksum): Promise<boolean>;

  // ============================================================================
  // ADVANCED OPERATIONS
  // ============================================================================

  /**
   * Copies a file to a new location
   */
  copy(sourcePath: StoragePath, destinationPath: StoragePath): Promise<void>;

  /**
   * Moves a file to a new location (copy + delete source)
   */
  move(sourcePath: StoragePath, destinationPath: StoragePath): Promise<void>;

  /**
   * Generates a preview/thumbnail for supported file types
   */
  generatePreview(
    path: StoragePath,
    options?: {
      width?: number;
      height?: number;
      format?: 'jpeg' | 'png' | 'webp';
    },
  ): Promise<PreviewResult>;

  /**
   * Returns a readable stream for the file (efficient for large files)
   */
  stream(path: StoragePath): Promise<NodeJS.ReadableStream>;

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Deletes multiple files in a batch operation
   */
  deleteMany(paths: StoragePath[]): Promise<BulkDeleteResult>;

  /**
   * Copies multiple files in a batch operation
   */
  copyMany(
    operations: Array<{ source: StoragePath; destination: StoragePath }>,
  ): Promise<BulkCopyResult>;

  // ============================================================================
  // STORAGE MANAGEMENT & ANALYTICS
  // ============================================================================

  /**
   * Gets information about the storage provider
   */
  getProviderInfo(): Promise<StorageProviderInfo>;

  /**
   * Gets analytics about stored files
   */
  getStorageAnalytics(): Promise<StorageAnalytics>;

  /**
   * Cleans up temporary files older than specified hours
   * @returns Number of files cleaned up
   */
  cleanupTemporaryFiles(olderThanHours?: number): Promise<number>;
}
