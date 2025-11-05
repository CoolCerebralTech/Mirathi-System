import { Injectable } from '@nestjs/common';
import { DocumentVersion } from '../../3_domain/models/document-version.model';
import { DocumentVersionResponseDto } from '../dtos/document-response.dto';
import {
  DocumentVersionId,
  DocumentId,
  UserId,
  StoragePath,
  FileMetadata,
} from '../../3_domain/value-objects';

@Injectable()
export class DocumentVersionMapper {
  toResponseDto(
    version: DocumentVersion,
    options: { includeDownloadUrl?: boolean } = {},
  ): DocumentVersionResponseDto {
    const dto = new DocumentVersionResponseDto({
      id: version.id.value,
      versionNumber: version.versionNumber,
      documentId: version.documentId.value,
      storagePath: version.storagePath.value,
      filename: version.fileMetadata.filename,
      mimeType: version.fileMetadata.mimeType.value,
      sizeBytes: version.fileMetadata.size.value,
      checksum: version.fileMetadata.checksum.value,
      changeNote: version.changeNote,
      uploadedBy: version.uploadedBy.value,
      uploadedByName: version.uploadedByName,
      createdAt: version.createdAt,
      fileSizeHumanReadable: version.fileSizeHumanReadable,
    });

    if (options.includeDownloadUrl) {
      dto.downloadUrl = this.generateDownloadUrl(version);
    }

    return dto;
  }

  toResponseDtoList(
    versions: DocumentVersion[],
    options: { includeDownloadUrl?: boolean } = {},
  ): DocumentVersionResponseDto[] {
    return versions.map((version) => this.toResponseDto(version, options));
  }

  createDtoToDomainParams(
    dto: any, // Using any to avoid circular dependency
    documentId: string,
    uploadedBy: string,
    uploadedByName: string,
    fileMetadata: FileMetadata,
    storagePath: StoragePath,
    versionNumber: number,
  ) {
    return {
      id: new DocumentVersionId(dto.id), // ID should be generated in service layer
      versionNumber,
      documentId: new DocumentId(documentId),
      storagePath,
      fileMetadata,
      uploadedBy: new UserId(uploadedBy),
      uploadedByName,
      changeNote: dto.changeNote,
    };
  }

  private generateDownloadUrl(version: DocumentVersion): string {
    return `/api/documents/${version.documentId.value}/versions/${version.versionNumber}/download`;
  }
}
