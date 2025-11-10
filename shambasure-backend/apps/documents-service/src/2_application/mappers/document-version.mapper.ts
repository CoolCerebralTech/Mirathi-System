import { Injectable } from '@nestjs/common';
import { DocumentVersion } from '../../3_domain/models/document-version.model';
import { DocumentVersionResponseDto } from '../dtos/document-response.dto';
import {
  CreateDocumentVersionDto,
  CreateDocumentVersionResponseDto,
} from '../dtos/document-version.dto';

/**
 * DocumentVersionMapper - Application Layer
 *
 * RESPONSIBILITIES:
 * - Map DocumentVersion domain models to Response DTOs
 * - Map Request DTOs to Domain parameters
 * - Format version-specific data
 * - Handle version comparison and analysis
 *
 * PRODUCTION CONSIDERATIONS:
 * - Null safety for checksum and optional fields
 * - File extension extraction robustness
 * - Error handling in comparison operations
 */
@Injectable()
export class DocumentVersionMapper {
  // ============================================================================
  // DOMAIN TO RESPONSE DTO
  // ============================================================================

  toResponseDto(
    version: DocumentVersion,
    options: {
      includeDownloadUrl?: boolean;
      uploaderName?: string;
      includeOriginalFileName?: boolean;
      originalFileName?: string;
    } = {},
  ): DocumentVersionResponseDto {
    const fileName =
      options.includeOriginalFileName && options.originalFileName
        ? this.generateVersionFileName(options.originalFileName, version.versionNumber)
        : `v${version.versionNumber}.${this.getFileExtension(version.storagePath.value)}`;

    const dto = new DocumentVersionResponseDto({
      id: version.id.value,
      versionNumber: version.versionNumber,
      documentId: version.documentId.value,
      storagePath: version.storagePath.value,
      filename: fileName,
      mimeType: version.mimeType.value,
      sizeBytes: version.fileSize.sizeInBytes,
      checksum: version.checksum?.value ?? '', // Handle nullable checksum
      changeNote: version.changeNote ?? undefined,
      uploadedBy: version.uploadedBy.value,
      uploadedByName: options.uploaderName ?? undefined,
      createdAt: version.createdAt,
      fileSizeHumanReadable: this.formatFileSize(version.fileSize.sizeInBytes),
    });

    if (options.includeDownloadUrl) {
      dto.downloadUrl = this.generateDownloadUrl(version);
    }

    return dto;
  }

  toCreateResponseDto(
    version: DocumentVersion,
    options: {
      includeDownloadUrl?: boolean;
      originalFileName?: string;
    } = {},
  ): CreateDocumentVersionResponseDto {
    const fileName = options.originalFileName
      ? this.generateVersionFileName(options.originalFileName, version.versionNumber)
      : `v${version.versionNumber}`;

    const dto = new CreateDocumentVersionResponseDto({
      id: version.id.value,
      versionNumber: version.versionNumber,
      documentId: version.documentId.value,
      filename: fileName,
      storagePath: version.storagePath.value,
      sizeBytes: version.fileSize.sizeInBytes,
      mimeType: version.mimeType.value,
      checksum: version.checksum?.value ?? '', // Handle nullable checksum
      changeNote: version.changeNote ?? undefined,
      uploadedBy: version.uploadedBy.value,
      createdAt: version.createdAt,
    });

    if (options.includeDownloadUrl) {
      dto.downloadUrl = this.generateDownloadUrl(version);
    }

    return dto;
  }

  // ============================================================================
  // BULK MAPPING
  // ============================================================================

  toResponseDtoList(
    versions: DocumentVersion[],
    options: {
      includeDownloadUrl?: boolean;
      uploaderNamesMap?: Map<string, string>;
      originalFileName?: string;
    } = {},
  ): DocumentVersionResponseDto[] {
    return versions.map((version) =>
      this.toResponseDto(version, {
        includeDownloadUrl: options.includeDownloadUrl,
        uploaderName: options.uploaderNamesMap?.get(version.uploadedBy.value),
        originalFileName: options.originalFileName,
        includeOriginalFileName: !!options.originalFileName,
      }),
    );
  }

  /**
   * Maps versions grouped by document ID
   */
  toGroupedResponseDtoList(
    versionsByDocument: Map<string, DocumentVersion[]>,
    options: {
      includeDownloadUrl?: boolean;
      uploaderNamesMap?: Map<string, string>;
      documentFileNames?: Map<string, string>;
    } = {},
  ): Map<string, DocumentVersionResponseDto[]> {
    const result = new Map<string, DocumentVersionResponseDto[]>();

    for (const [documentId, versions] of versionsByDocument.entries()) {
      const originalFileName = options.documentFileNames?.get(documentId);
      const mappedVersions = this.toResponseDtoList(versions, {
        includeDownloadUrl: options.includeDownloadUrl,
        uploaderNamesMap: options.uploaderNamesMap,
        originalFileName,
      });
      result.set(documentId, mappedVersions);
    }

    return result;
  }

  // ============================================================================
  // REQUEST DTO TO DOMAIN PARAMETERS
  // ============================================================================

  createDtoToParams(dto: CreateDocumentVersionDto) {
    return {
      changeNote: dto.changeNote?.trim() || undefined, // Clean up whitespace
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateDownloadUrl(version: DocumentVersion): string {
    return `/api/v1/documents/${version.documentId.value}/versions/${version.versionNumber}/download`;
  }

  private getFileExtension(path: string): string {
    if (!path || path.length === 0) return '';

    const parts = path.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  private generateVersionFileName(originalFileName: string, versionNumber: number): string {
    const baseName = originalFileName.replace(/\.[^/.]+$/, ''); // Remove extension
    const extension = this.getFileExtension(originalFileName);
    return extension
      ? `${baseName}-v${versionNumber}.${extension}`
      : `${baseName}-v${versionNumber}`;
  }

  private formatFileSize(sizeInBytes: number): string {
    if (sizeInBytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    const size = (sizeInBytes / Math.pow(1024, exponent)).toFixed(2);

    return `${size} ${units[exponent]}`;
  }

  /**
   * Compares two versions and returns a summary
   */
  compareVersions(
    olderVersion: DocumentVersion,
    newerVersion: DocumentVersion,
  ): {
    olderVersionId: string;
    newerVersionId: string;
    sizeDifference: number;
    sizeDifferenceFormatted: string;
    sizeChangePercentage: number;
    timeDifferenceHours: number;
    uploaderChanged: boolean;
    mimeTypeChanged: boolean;
  } {
    if (!olderVersion.belongsToDocument(newerVersion.documentId)) {
      throw new Error('Cannot compare versions from different documents');
    }

    const sizeDiff = newerVersion.fileSize.sizeInBytes - olderVersion.fileSize.sizeInBytes;
    const sizeChangePercentage =
      olderVersion.fileSize.sizeInBytes > 0
        ? (sizeDiff / olderVersion.fileSize.sizeInBytes) * 100
        : 0;

    const timeDiffHours =
      (newerVersion.createdAt.getTime() - olderVersion.createdAt.getTime()) / (1000 * 60 * 60);

    return {
      olderVersionId: olderVersion.id.value,
      newerVersionId: newerVersion.id.value,
      sizeDifference: sizeDiff,
      sizeDifferenceFormatted: `${sizeDiff >= 0 ? '+' : ''}${this.formatFileSize(Math.abs(sizeDiff))}`,
      sizeChangePercentage: parseFloat(sizeChangePercentage.toFixed(2)),
      timeDifferenceHours: parseFloat(timeDiffHours.toFixed(2)),
      uploaderChanged: !olderVersion.wasUploadedBy(newerVersion.uploadedBy),
      mimeTypeChanged: !olderVersion.mimeType.equals(newerVersion.mimeType),
    };
  }

  /**
   * Generates version history summary
   */
  generateVersionHistorySummary(versions: DocumentVersion[]): {
    totalVersions: number;
    totalSizeBytes: number;
    averageSizeBytes: number;
    largestVersion: { versionNumber: number; sizeBytes: number };
    smallestVersion: { versionNumber: number; sizeBytes: number };
    versionFrequency: { [key: string]: number }; // versions per month/week
  } {
    if (versions.length === 0) {
      return {
        totalVersions: 0,
        totalSizeBytes: 0,
        averageSizeBytes: 0,
        largestVersion: { versionNumber: 0, sizeBytes: 0 },
        smallestVersion: { versionNumber: 0, sizeBytes: 0 },
        versionFrequency: {},
      };
    }

    const sizes = versions.map((v) => v.fileSize.sizeInBytes);
    const totalSizeBytes = sizes.reduce((sum, size) => sum + size, 0);

    let largestVersion = versions[0];
    let smallestVersion = versions[0];

    versions.forEach((version) => {
      if (version.fileSize.sizeInBytes > largestVersion.fileSize.sizeInBytes) {
        largestVersion = version;
      }
      if (version.fileSize.sizeInBytes < smallestVersion.fileSize.sizeInBytes) {
        smallestVersion = version;
      }
    });

    // Calculate version frequency by month
    const versionFrequency: { [key: string]: number } = {};
    versions.forEach((version) => {
      const monthKey = version.createdAt.toISOString().substring(0, 7); // YYYY-MM
      versionFrequency[monthKey] = (versionFrequency[monthKey] || 0) + 1;
    });

    return {
      totalVersions: versions.length,
      totalSizeBytes,
      averageSizeBytes: Math.round(totalSizeBytes / versions.length),
      largestVersion: {
        versionNumber: largestVersion.versionNumber,
        sizeBytes: largestVersion.fileSize.sizeInBytes,
      },
      smallestVersion: {
        versionNumber: smallestVersion.versionNumber,
        sizeBytes: smallestVersion.fileSize.sizeInBytes,
      },
      versionFrequency,
    };
  }

  /**
   * Validates if a version can be mapped to response DTO
   */
  isValidForMapping(version: DocumentVersion): boolean {
    return !!(
      version?.id &&
      version.documentId &&
      version.storagePath &&
      version.fileSize &&
      version.mimeType
    );
  }
}
