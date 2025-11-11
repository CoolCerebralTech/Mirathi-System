import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import type {
  IDocumentRepository,
  IDocumentVersionQueryRepository,
  IStorageService,
} from '../../3_domain/interfaces';
import { DocumentVersion } from '../../3_domain/models';
import { Actor, DocumentId, DocumentVersionId, FileName } from '../../3_domain/value-objects';
import { DocumentVersionMapper } from '../mappers';
import { DocumentVersionQueryDto } from '../dtos/document-version.dto';
import { DocumentVersionResponseDto } from '../dtos/document-response.dto';

interface PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

@Injectable()
export class DocumentVersionQueryService {
  private readonly logger = new Logger(DocumentVersionQueryService.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly versionQueryRepository: IDocumentVersionQueryRepository,
    private readonly storageService: IStorageService,
    private readonly versionMapper: DocumentVersionMapper,
  ) {}

  // ============================================================================
  // SINGLE VERSION QUERIES
  // ============================================================================

  async getVersionById(
    versionId: DocumentVersionId,
    actor: Actor,
  ): Promise<DocumentVersionResponseDto> {
    this.logger.debug(`Fetching version ${versionId.value} for actor ${actor.id.value}`);

    const versionDto = await this.versionQueryRepository.findById(versionId);
    if (!versionDto) {
      throw new NotFoundException('Version not found');
    }

    const document = await this.checkParentDocumentAccess(
      new DocumentId(versionDto.documentId),
      actor,
    );

    const version = document.versions.find(
      (v) => v.id.value === versionDto.id && v.versionNumber === versionDto.versionNumber,
    );

    if (!version) {
      throw new NotFoundException('Version not found in document');
    }

    const uploaderNamesMap = new Map<string, string>();

    // No more 'as any' needed!
    return this.versionMapper.toResponseDto(version, {
      originalFileName: document.fileName.value,
      uploaderName: uploaderNamesMap.get(versionDto.uploadedBy),
    });
  }

  async getVersionByNumber(
    documentId: DocumentId,
    versionNumber: number,
    actor: Actor,
  ): Promise<DocumentVersionResponseDto> {
    this.logger.debug(
      `Fetching version ${versionNumber} of document ${documentId.value} for actor ${actor.id.value}`,
    );

    const document = await this.checkParentDocumentAccess(documentId, actor);

    const version = document.versions.find((v) => v.versionNumber === versionNumber);
    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    const uploaderNamesMap = new Map<string, string>();

    // No more 'as any' needed!
    return this.versionMapper.toResponseDto(version, {
      originalFileName: document.fileName.value,
      uploaderName: uploaderNamesMap.get(version.uploadedBy.value),
    });
  }

  // ============================================================================
  // BATCH VERSION QUERIES
  // ============================================================================

  async getAllVersionsForDocument(
    documentId: DocumentId,
    queryDto: DocumentVersionQueryDto,
    actor: Actor,
  ): Promise<PaginatedResponseDto<DocumentVersionResponseDto>> {
    this.logger.debug(
      `Fetching versions for document ${documentId.value} for actor ${actor.id.value}`,
    );

    const document = await this.checkParentDocumentAccess(documentId, actor);

    let versions = [...document.versions];

    if (queryDto.sortBy) {
      versions = this.sortVersions(versions, queryDto.sortBy, queryDto.sortOrder);
    }

    const totalCount = versions.length;
    const totalPages = Math.ceil(totalCount / queryDto.limit);
    const startIndex = (queryDto.page - 1) * queryDto.limit;
    const endIndex = startIndex + queryDto.limit;
    const paginatedVersions = versions.slice(startIndex, endIndex);

    const uploaderNamesMap = new Map<string, string>();

    // No more 'as any' needed!
    const data = this.versionMapper.toResponseDtoList(paginatedVersions, {
      originalFileName: document.fileName.value,
      uploaderNamesMap,
    });

    return {
      data,
      total: totalCount,
      page: queryDto.page,
      limit: queryDto.limit,
      totalPages,
      hasNext: queryDto.page < totalPages,
      hasPrevious: queryDto.page > 1,
    };
  }

  async getLatestVersion(
    documentId: DocumentId,
    actor: Actor,
  ): Promise<DocumentVersionResponseDto> {
    this.logger.debug(
      `Fetching latest version of document ${documentId.value} for actor ${actor.id.value}`,
    );

    const document = await this.checkParentDocumentAccess(documentId, actor);

    if (document.versions.length === 0) {
      throw new NotFoundException('No versions found for document');
    }

    const latestVersion = document.versions.reduce((latest, current) =>
      current.versionNumber > latest.versionNumber ? current : latest,
    );

    const uploaderNamesMap = new Map<string, string>();

    // No more 'as any' needed!
    return this.versionMapper.toResponseDto(latestVersion, {
      originalFileName: document.fileName.value,
      uploaderName: uploaderNamesMap.get(latestVersion.uploadedBy.value),
    });
  }

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  async downloadVersion(
    documentId: DocumentId,
    versionNumber: number,
    actor: Actor,
  ): Promise<{
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    size: number;
  }> {
    this.logger.debug(
      `Downloading version ${versionNumber} of document ${documentId.value} for actor ${actor.id.value}`,
    );

    const document = await this.checkParentDocumentAccess(documentId, actor);

    // Get the version directly from the document aggregate
    const version = document.versions.find((v) => v.versionNumber === versionNumber);
    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    // Prepare storage options
    const storageOptions = {
      validateChecksum: version.checksum !== null,
      expectedChecksum: version.checksum ?? undefined,
    };

    // Retrieve file from storage
    const fileResult = await this.storageService.retrieve(version.storagePath, storageOptions);

    // Generate versioned filename
    const versionedFilename = this.generateVersionedFileName(
      document.fileName.value,
      versionNumber,
    );

    return {
      buffer: fileResult.buffer,
      fileName: versionedFilename,
      mimeType: version.mimeType.value,
      size: version.fileSize.value,
    };
  }

  async getVersionDownloadUrl(
    documentId: DocumentId,
    versionNumber: number,
    actor: Actor,
  ): Promise<string> {
    this.logger.debug(
      `Generating download URL for version ${versionNumber} of document ${documentId.value} for actor ${actor.id.value}`,
    );

    const document = await this.checkParentDocumentAccess(documentId, actor);

    // Get the version directly from the document aggregate
    const version = document.versions.find((v) => v.versionNumber === versionNumber);
    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    // Generate versioned filename for the download
    const versionedFilename = this.generateVersionedFileName(
      document.fileName.value,
      versionNumber,
    );

    // Generate pre-signed URL (expires in 1 hour)
    const downloadUrl = await this.storageService.getPresignedDownloadUrl(version.storagePath, {
      expiresInSeconds: 3600,
      fileNameToSuggest: FileName.create(versionedFilename),
      disposition: 'attachment',
    });

    return downloadUrl;
  }

  // ============================================================================
  // ANALYTICS QUERIES
  // ============================================================================

  async getVersionStats(
    documentId: DocumentId,
    actor: Actor,
  ): Promise<{
    totalVersions: number;
    totalSizeBytes: number;
    averageSizeBytes: number;
    oldestVersionDate: Date;
    newestVersionDate: Date;
  }> {
    this.logger.debug(
      `Fetching version stats for document ${documentId.value} for actor ${actor.id.value}`,
    );

    const document = await this.checkParentDocumentAccess(documentId, actor);

    const totalVersions = document.versions.length;
    const totalSizeBytes = document.versions.reduce(
      (sum, version) => sum + version.fileSize.value,
      0,
    );
    const averageSizeBytes = totalVersions > 0 ? totalSizeBytes / totalVersions : 0;

    const versionDates = document.versions.map((v) => v.createdAt).sort();
    const oldestVersionDate = versionDates[0] || new Date();
    const newestVersionDate = versionDates[versionDates.length - 1] || new Date();

    return {
      totalVersions,
      totalSizeBytes,
      averageSizeBytes,
      oldestVersionDate,
      newestVersionDate,
    };
  }

  async getVersionStorageUsage(documentId: DocumentId, actor: Actor): Promise<number> {
    this.logger.debug(
      `Fetching storage usage for document ${documentId.value} for actor ${actor.id.value}`,
    );

    const document = await this.checkParentDocumentAccess(documentId, actor);

    return document.versions.reduce((sum, version) => sum + version.fileSize.value, 0);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async checkParentDocumentAccess(documentId: DocumentId, actor: Actor) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!document.canBeAccessedBy(actor.id)) {
      throw new ForbiddenException('Access denied to this document');
    }

    return document;
  }

  private sortVersions(
    versions: Readonly<DocumentVersion>[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Readonly<DocumentVersion>[] {
    return [...versions].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'versionNumber':
          comparison = a.versionNumber - b.versionNumber;
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'fileSize':
          comparison = a.fileSize.value - b.fileSize.value;
          break;
        default:
          comparison = a.versionNumber - b.versionNumber;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
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
}
