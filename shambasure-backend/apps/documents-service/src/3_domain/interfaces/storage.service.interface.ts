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

/**
 * Defines the contract for an external file storage provider (e.g., S3, GCS).
 * This interface is the boundary between the application and infrastructure layers for file operations.
 * It uses domain Value Objects for inputs to ensure type safety.
 */
export interface IStorageService {
  // ============================================================================
  // CORE FILE OPERATIONS
  // ============================================================================

  save(
    buffer: Buffer,
    path: StoragePath,
    options?: {
      contentType?: MimeType;
    },
  ): Promise<SaveResult>;

  retrieve(path: StoragePath): Promise<RetrieveResult>;

  delete(path: StoragePath): Promise<void>;

  exists(path: StoragePath): Promise<boolean>;

  getMetadata(path: StoragePath): Promise<FileMetadataResult>;

  // ============================================================================
  // SECURITY & ACCESS
  // ============================================================================

  getPresignedDownloadUrl(
    path: StoragePath,
    options?: {
      expiresInSeconds?: number;
      fileNameToSuggest?: FileName; // The name the user's browser will suggest for saving
      disposition?: 'inline' | 'attachment';
    },
  ): Promise<string>;

  scanForViruses(buffer: Buffer): Promise<VirusScanResult>;

  // ============================================================================
  // ADVANCED OPERATIONS
  // ============================================================================

  copy(sourcePath: StoragePath, destinationPath: StoragePath): Promise<void>;

  move(sourcePath: StoragePath, destinationPath: StoragePath): Promise<void>;

  stream(path: StoragePath): Promise<NodeJS.ReadableStream>;

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  deleteMany(paths: StoragePath[]): Promise<BulkDeleteResult>;

  // ============================================================================
  // STORAGE MANAGEMENT & ANALYTICS
  // ============================================================================

  getProviderInfo(): Promise<{ providerName: string }>;

  getStorageAnalytics(): Promise<{
    totalFileCount: number;
    totalSizeBytes: number;
    byMimeType: Record<string, { count: number; sizeBytes: number }>;
  }>;
}
