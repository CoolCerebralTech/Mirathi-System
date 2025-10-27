
/**
 * Storage service interface for file operations.
 * Abstracts away the underlying storage mechanism (local, S3, etc.).
 */
export interface IStorageService {
  /**
   * Save a file to storage.
   * @param buffer - File content as Buffer
   * @param path - Storage path (from StoragePath VO)
   * @returns The full storage path where file was saved
   */
  save(buffer: Buffer, path: string): Promise<string>;

  /**
   * Retrieve a file from storage.
   * @param path - Storage path
   * @returns File content as Buffer
   */
  retrieve(path: string): Promise<Buffer>;

  /**
   * Delete a file from storage.
   * @param path - Storage path
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists in storage.
   * @param path - Storage path
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file size in bytes.
   * @param path - Storage path
   */
  getSize(path: string): Promise<number>;

  /**
   * Generate a temporary download URL (for cloud storage).
   * For local storage, this might just return the path.
   * @param path - Storage path
   * @param expiresInSeconds - URL expiration time (default 3600 = 1 hour)
   */
  getDownloadUrl(path: string, expiresInSeconds?: number): Promise<string>;
}

