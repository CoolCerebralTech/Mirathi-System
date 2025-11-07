import { Injectable } from '@nestjs/common';
import { DocumentVersion } from '../../3_domain/models/document-version.model';
import {
  DocumentVersionResponseDto,
  CreateDocumentVersionResponseDto,
} from '../dtos/document-response.dto';
import { CreateDocumentVersionDto } from '../dtos/document-version.dto';
import { DocumentVersionId, DocumentId, UserId } from '../../3_domain/value-objects';

/**
 * DocumentVersionMapper - Application Layer
 *
 * RESPONSIBILITIES:
 * - Map DocumentVersion domain models to Response DTOs
 * - Map Request DTOs to Domain parameters
 * - Format version-specific data
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
    } = {},
  ): DocumentVersionResponseDto {
    const dto = new DocumentVersionResponseDto({
      id: version.id.value,
      versionNumber: version.versionNumber,
      documentId: version.documentId.value,
      storagePath: version.storagePath.value,
      filename: `${version.versionNumber}.${this.getFileExtension(version.storagePath.value)}`,
      mimeType: version.mimeType.value,
      sizeBytes: version.fileSize.sizeInBytes,
      checksum: version.checksum.value,
      changeNote: version.changeNote,
      uploadedBy: version.uploadedBy.value,
      uploadedByName: options.uploaderName,
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
    } = {},
  ): CreateDocumentVersionResponseDto {
    const dto = new CreateDocumentVersionResponseDto({
      id: version.id.value,
      versionNumber: version.versionNumber,
      documentId: version.documentId.value,
      filename: `v${version.versionNumber}`,
      storagePath: version.storagePath.value,
      sizeBytes: version.fileSize.sizeInBytes,
      mimeType: version.mimeType.value,
      checksum: version.checksum.value,
      changeNote: version.changeNote,
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
    } = {},
  ): DocumentVersionResponseDto[] {
    return versions.map((version) =>
      this.toResponseDto(version, {
        includeDownloadUrl: options.includeDownloadUrl,
        uploaderName: options.uploaderNamesMap?.get(version.uploadedBy.value),
      }),
    );
  }

  // ============================================================================
  // REQUEST DTO TO DOMAIN PARAMETERS
  // ============================================================================

  createDtoToParams(dto: CreateDocumentVersionDto) {
    return {
      changeNote: dto.changeNote,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateDownloadUrl(version: DocumentVersion): string {
    return `/api/v1/documents/${version.documentId.value}/versions/${version.versionNumber}/download`;
  }

  private getFileExtension(path: string): string {
    const parts = path.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  private formatFileSize(sizeInBytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = sizeInBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Compares two versions and returns a summary
   */
  compareVersions(
    olderVersion: DocumentVersion,
    newerVersion: DocumentVersion,
  ): {
    sizeDifference: number;
    sizeDifferenceFormatted: string;
    timeDifferenceHours: number;
    uploaderChanged: boolean;
  } {
    if (!olderVersion.belongsToDocument(newerVersion.documentId)) {
      throw new Error('Cannot compare versions from different documents');
    }

    const sizeDiff = newerVersion.fileSize.sizeInBytes - olderVersion.fileSize.sizeInBytes;
    const timeDiff =
      (newerVersion.createdAt.getTime() - olderVersion.createdAt.getTime()) / (1000 * 60 * 60);

    return {
      sizeDifference: sizeDiff,
      sizeDifferenceFormatted: this.formatFileSize(Math.abs(sizeDiff)),
      timeDifferenceHours: timeDiff,
      uploaderChanged: !olderVersion.wasUploadedBy(newerVersion.uploadedBy),
    };
  }
}
