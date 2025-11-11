import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  IDocumentRepository,
  IDocumentVersionQueryRepository,
  IStorageService,
} from '../../3_domain/interfaces';
import { Actor, DocumentId, DocumentVersionId, StoragePath } from '../../3_domain/value-objects';
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

    // Check access to the parent document
    const document = await this.checkParentDocumentAccess(
      new DocumentId(versionDto.documentId),
      actor,
    );

    // Get uploader name mapping (in real app, this would come from user service)
    const uploaderNamesMap = new Map<string, string>();
    // uploaderNamesMap.set(versionDto.uploadedBy, 'User Name'); // Would be populated from user service

    return this.versionMapper.toResponseDto(await this.mapVersionDtoToDomain(versionDto), {
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

    const versionDto = await this.versionQueryRepository.findByDocumentIdAndVersionNumber(
      documentId,
      versionNumber,
    );
    if (!versionDto) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    // Get uploader name mapping
    const uploaderNamesMap = new Map<string, string>();
    // uploaderNamesMap.set(versionDto.uploadedBy, 'User Name');

    return this.versionMapper.toResponseDto(await this.mapVersionDtoToDomain(versionDto), {
      originalFileName: document.fileName.value,
      uploaderName: uploaderNamesMap.get(versionDto.uploadedBy),
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

    // Convert query DTO to repository options
    const queryOptions = {
      sortBy: queryDto.sortBy,
      sortOrder: queryDto.sortOrder,
      limit: queryDto.limit,
      offset: (queryDto.page - 1) * queryDto.limit,
    };

    // Get paginated results from repository
    const versionDtos = await this.versionQueryRepository.findAllByDocumentId(
      documentId,
      queryOptions,
    );

    // Get total count for pagination
    const totalCount = await this.versionQueryRepository.countForDocument(documentId);
    const totalPages = Math.ceil(totalCount / queryDto.limit);

    // Map DTOs to domain objects (in real app, this would be more efficient)
    const versions = await Promise.all(versionDtos.map((dto) => this.mapVersionDtoToDomain(dto)));

    // Get uploader names mapping (in real app, batch fetch from user service)
    const uploaderNamesMap = new Map<string, string>();
    // This would be populated with actual user data

    // Map to response DTOs
    const data = this.versionMapper.toResponseDtoList(versions, {
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

    const versionDto = await this.versionQueryRepository.findLatestForDocument(documentId);
    if (!versionDto) {
      throw new NotFoundException('No versions found for document');
    }

    // Get uploader name mapping
    const uploaderNamesMap = new Map<string, string>();
    // uploaderNamesMap.set(versionDto.uploadedBy, 'User Name');

    return this.versionMapper.toResponseDto(await this.mapVersionDtoToDomain(versionDto), {
      originalFileName: document.fileName.value,
      uploaderName: uploaderNamesMap.get(versionDto.uploadedBy),
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

    const versionDto = await this.versionQueryRepository.findByDocumentIdAndVersionNumber(
      documentId,
      versionNumber,
    );
    if (!versionDto) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    // Retrieve file from storage
    const fileResult = await this.storageService.retrieve(
      StoragePath.fromExisting(versionDto.storagePath),
      {
        validateChecksum: true,
        expectedChecksum: versionDto.checksum ? ({ value: versionDto.checksum } as any) : undefined,
      },
    );

    // Generate versioned filename
    const versionedFilename = this.generateVersionedFileName(
      document.fileName.value,
      versionNumber,
    );

    return {
      buffer: fileResult.buffer,
      fileName: versionedFilename,
      mimeType: versionDto.mimeType,
      size: versionDto.fileSize,
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

    const versionDto = await this.versionQueryRepository.findByDocumentIdAndVersionNumber(
      documentId,
      versionNumber,
    );
    if (!versionDto) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    // Generate versioned filename for the download
    const versionedFilename = this.generateVersionedFileName(
      document.fileName.value,
      versionNumber,
    );

    // Generate pre-signed URL (expires in 1 hour)
    const downloadUrl = await this.storageService.getPresignedDownloadUrl(
      StoragePath.fromExisting(versionDto.storagePath),
      {
        expiresInSeconds: 3600,
        fileNameToSuggest: { value: versionedFilename } as any,
        disposition: 'attachment',
      },
    );

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

    await this.checkParentDocumentAccess(documentId, actor);

    const stats = await this.versionQueryRepository.getStorageStatsForDocument(documentId);

    return {
      totalVersions: stats.totalVersions,
      totalSizeBytes: stats.totalSizeBytes,
      averageSizeBytes: stats.averageSizeBytes,
      oldestVersionDate: stats.oldestVersionDate,
      newestVersionDate: stats.newestVersionDate,
    };
  }

  async getVersionStorageUsage(documentId: DocumentId, actor: Actor): Promise<number> {
    this.logger.debug(
      `Fetching storage usage for document ${documentId.value} for actor ${actor.id.value}`,
    );

    await this.checkParentDocumentAccess(documentId, actor);

    return this.versionQueryRepository.getTotalStorageUsageForDocument(documentId);
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

  private async mapVersionDtoToDomain(versionDto: any): Promise<any> {
    // This is a simplified mapping. In a real application, you would have a proper
    // method to reconstruct the DocumentVersion entity from its DTO representation.
    // For now, we return the DTO as the structure is similar enough for the mapper.
    return versionDto;
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

  private generateDownloadUrl(documentId: DocumentId, versionNumber: number): string {
    return `/api/v1/documents/${documentId.value}/versions/${versionNumber}/download`;
  }
}
