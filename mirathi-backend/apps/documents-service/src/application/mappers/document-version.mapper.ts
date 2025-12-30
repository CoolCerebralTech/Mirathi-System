import { Injectable } from '@nestjs/common';

import { DocumentVersion } from '../../domain/models';
import { DocumentVersionResponseDto } from '../dtos/document-version-response.dto';
import { CreateDocumentVersionResponseDto } from '../dtos/document-version.dto';

/**
 * Maps between DocumentVersion domain objects and their corresponding DTOs for API responses.
 */
@Injectable()
export class DocumentVersionMapper {
  /**
   * Maps a DocumentVersion domain object to a DocumentVersionResponseDto.
   * Accepts both mutable and readonly DocumentVersion objects.
   */
  toResponseDto(
    version: Readonly<DocumentVersion>,
    options: { originalFileName?: string; uploaderName?: string } = {},
  ): DocumentVersionResponseDto {
    const generatedFileName = options.originalFileName
      ? this.generateVersionedFileName(options.originalFileName, version.versionNumber)
      : `version-${version.versionNumber}`;

    return new DocumentVersionResponseDto({
      id: version.id.value,
      versionNumber: version.versionNumber,
      documentId: version.documentId.value,
      filename: generatedFileName,
      mimeType: version.mimeType.value,
      sizeBytes: version.fileSize.sizeInBytes,
      checksum: version.checksum?.value,
      changeNote: version.changeNote ?? undefined,
      uploadedBy: version.uploadedBy.value,
      uploadedByName: options.uploaderName,
      createdAt: version.createdAt,
      downloadUrl: this.generateDownloadUrl(version),
      fileSizeHumanReadable: this.formatFileSize(version.fileSize.sizeInBytes),
    });
  }

  /**
   * Maps a new DocumentVersion to a response DTO used immediately after creation.
   */
  toCreateResponseDto(
    version: Readonly<DocumentVersion>,
    originalFileName?: string,
  ): CreateDocumentVersionResponseDto {
    return new CreateDocumentVersionResponseDto({
      id: version.id.value,
      documentId: version.documentId.value,
      versionNumber: version.versionNumber,
      filename: originalFileName
        ? this.generateVersionedFileName(originalFileName, version.versionNumber)
        : undefined,
      storagePath: version.storagePath.value,
      sizeBytes: version.fileSize.sizeInBytes,
      mimeType: version.mimeType.value,
      checksum: version.checksum?.value,
      changeNote: version.changeNote ?? undefined,
      uploadedBy: version.uploadedBy.value,
      createdAt: version.createdAt,
      downloadUrl: this.generateDownloadUrl(version),
    });
  }

  /**
   * Maps a list of DocumentVersion domain objects to a list of DTOs.
   * Accepts both mutable and readonly DocumentVersion arrays.
   */
  toResponseDtoList(
    versions: readonly Readonly<DocumentVersion>[],
    options: { originalFileName?: string; uploaderNamesMap?: Map<string, string> } = {},
  ): DocumentVersionResponseDto[] {
    return versions.map((version) =>
      this.toResponseDto(version, {
        originalFileName: options.originalFileName,
        uploaderName: options.uploaderNamesMap?.get(version.uploadedBy.value),
      }),
    );
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private generateDownloadUrl(version: Readonly<DocumentVersion>): string {
    return `/api/v1/documents/${version.documentId.value}/versions/${version.versionNumber}/download`;
  }

  private generateVersionedFileName(originalFileName: string, versionNumber: number): string {
    const extensionIndex = originalFileName.lastIndexOf('.');
    if (extensionIndex === -1) {
      return `${originalFileName}-v${versionNumber}`;
    }
    const baseName = originalFileName.substring(0, extensionIndex);
    const extension = originalFileName.substring(extensionIndex);
    return `${baseName}-v${versionNumber}${extension}`;
  }

  private formatFileSize(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
