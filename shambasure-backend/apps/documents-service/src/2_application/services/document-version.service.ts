import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { IDocumentRepository } from '../../3_domain/interfaces/document.repository.interface';
import { IDocumentVersionRepository } from '../../3_domain/interfaces/document-version.repository.interface';
import { IStorageService } from '../../3_domain/interfaces/storage.service.interface';
import { DocumentVersion } from '../../3_domain/models/document-version.model';
import {
  DocumentId,
  UserId,
  StoragePath,
  FileName,
  FileSize,
  MimeType,
  DocumentChecksum,
} from '../../3_domain/value-objects';
import { DocumentVersionMapper } from '../mappers/document-version.mapper';
import { FileValidatorService } from '../../4_infrastructure/storage/file-validator.service';
import {
  CreateDocumentVersionDto,
  DocumentVersionQueryDto,
  CreateDocumentVersionResponseDto,
} from '../dtos/document-version.dto';
import { DocumentVersionResponseDto } from '../dtos/document-response.dto';

/**
 * DocumentVersionService - Application Service
 *
 * RESPONSIBILITIES:
 * - Manage document version lifecycle
 * - Orchestrate version creation
 * - Handle version retrieval and queries
 * - Coordinate storage operations for versions
 */
@Injectable()
export class DocumentVersionService {
  private readonly logger = new Logger(DocumentVersionService.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly versionRepository: IDocumentVersionRepository,
    private readonly storageService: IStorageService,
    private readonly versionMapper: DocumentVersionMapper,
    private readonly fileValidator: FileValidatorService,
  ) {}

  // ============================================================================
  // CREATE OPERATIONS
  // ============================================================================

  async createVersion(
    documentId: DocumentId,
    dto: CreateDocumentVersionDto,
    file: Buffer,
    uploadedBy: UserId,
  ): Promise<CreateDocumentVersionResponseDto> {
    this.logger.log(`Creating new version for document: ${documentId.value}`);

    try {
      // 1. Verify document exists and is not verified
      const document = await this.documentRepository.findById(documentId);

      if (!document) {
        throw new NotFoundException(`Document not found: ${documentId.value}`);
      }

      if (document.isVerified()) {
        throw new BadRequestException('Cannot create version for verified document');
      }

      if (!document.isOwnedBy(uploadedBy)) {
        throw new BadRequestException('Only document owner can create versions');
      }

      // 2. Validate file
      const validationResult = await this.fileValidator.validateFile(
        file,
        document.fileName.value,
        this.detectMimeType(file),
      );

      if (!validationResult.isValid) {
        throw new BadRequestException(
          `File validation failed: ${validationResult.errors.map((e) => e.message).join(', ')}`,
        );
      }

      // 3. Get next version number
      const nextVersionNumber = await this.versionRepository.getNextVersionNumber(documentId);

      // 4. Create file metadata
      const fileSize = FileSize.create(file.length);
      const mimeType = MimeType.create(validationResult.metadata.mimeType);
      const checksum = DocumentChecksum.create(validationResult.metadata.checksum);

      // 5. Generate storage path for version
      const storagePath = this.generateVersionStoragePath(
        documentId,
        nextVersionNumber,
        document.fileName,
      );

      // 6. Save file to storage
      const saveResult = await this.storageService.save(file, storagePath, {
        contentType: mimeType,
        metadata: {
          documentId: documentId.value,
          versionNumber: nextVersionNumber.toString(),
          uploadedBy: uploadedBy.value,
        },
      });

      // 7. Create version domain entity
      const version = DocumentVersion.create({
        documentId,
        versionNumber: nextVersionNumber,
        storagePath: saveResult.path,
        fileSize,
        mimeType,
        checksum,
        uploadedBy,
        changeNote: dto.changeNote,
      });

      // 8. Persist version
      await this.versionRepository.save(version);

      // 9. Record version event on document
      document.recordNewVersion({
        uploadedBy,
        storagePath: saveResult.path,
        fileSize,
        checksum,
        versionNumber: nextVersionNumber,
        changeNote: dto.changeNote,
      });

      await this.documentRepository.save(document);

      // 10. TODO: Publish domain events
      // await this.eventPublisher.publish(document.domainEvents);
      document.clearDomainEvents();

      this.logger.log(`Version ${nextVersionNumber} created for document: ${documentId.value}`);

      return this.versionMapper.toCreateResponseDto(version, {
        includeDownloadUrl: true,
      });
    } catch (error) {
      this.logger.error(`Failed to create version: ${error.message}`, error.stack);

      // Cleanup on failure
      if (error.storagePath) {
        await this.storageService.delete(error.storagePath).catch(() => {});
      }

      throw error;
    }
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  async getVersionById(versionId: string): Promise<DocumentVersionResponseDto> {
    this.logger.debug(`Fetching version: ${versionId}`);

    const version = await this.versionRepository.findById(new DocumentVersionId(versionId));

    if (!version) {
      throw new NotFoundException(`Version not found: ${versionId}`);
    }

    return this.versionMapper.toResponseDto(version, {
      includeDownloadUrl: true,
    });
  }

  async getVersionByNumber(
    documentId: DocumentId,
    versionNumber: number,
  ): Promise<DocumentVersionResponseDto> {
    this.logger.debug(`Fetching version ${versionNumber} for document: ${documentId.value}`);

    const version = await this.versionRepository.findByDocumentIdAndVersionNumber(
      documentId,
      versionNumber,
    );

    if (!version) {
      throw new NotFoundException(
        `Version ${versionNumber} not found for document: ${documentId.value}`,
      );
    }

    return this.versionMapper.toResponseDto(version, {
      includeDownloadUrl: true,
    });
  }

  async getDocumentVersions(
    documentId: DocumentId,
    dto: DocumentVersionQueryDto,
  ): Promise<DocumentVersionResponseDto[]> {
    this.logger.debug(`Fetching versions for document: ${documentId.value}`);

    const versions = await this.versionRepository.findAllByDocumentId(documentId, {
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
      limit: dto.limit,
      offset: ((dto.page || 1) - 1) * (dto.limit || 10),
    });

    return this.versionMapper.toResponseDtoList(versions, {
      includeDownloadUrl: true,
    });
  }

  async getLatestVersion(documentId: DocumentId): Promise<DocumentVersionResponseDto | null> {
    this.logger.debug(`Fetching latest version for document: ${documentId.value}`);

    const version = await this.versionRepository.findLatestForDocument(documentId);

    if (!version) {
      return null;
    }

    return this.versionMapper.toResponseDto(version, {
      includeDownloadUrl: true,
    });
  }

  async getVersionCount(documentId: DocumentId): Promise<number> {
    return await this.versionRepository.countForDocument(documentId);
  }

  // ============================================================================
  // DOWNLOAD OPERATIONS
  // ============================================================================

  async downloadVersion(
    documentId: DocumentId,
    versionNumber: number,
    currentUserId: UserId,
  ): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }> {
    this.logger.log(`Downloading version ${versionNumber} of document: ${documentId.value}`);

    // 1. Check document access
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    if (!document.canBeAccessedBy(currentUserId)) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    // 2. Get version
    const version = await this.versionRepository.findByDocumentIdAndVersionNumber(
      documentId,
      versionNumber,
    );

    if (!version) {
      throw new NotFoundException(
        `Version ${versionNumber} not found for document: ${documentId.value}`,
      );
    }

    // 3. Retrieve file from storage
    const fileResult = await this.storageService.retrieve(version.storagePath);

    return {
      buffer: fileResult.buffer,
      filename: `v${versionNumber}_${document.fileName.value}`,
      mimeType: version.mimeType.value,
    };
  }

  // ============================================================================
  // COMPARISON OPERATIONS
  // ============================================================================

  async compareVersions(
    documentId: DocumentId,
    version1Number: number,
    version2Number: number,
  ): Promise<{
    olderVersion: DocumentVersionResponseDto;
    newerVersion: DocumentVersionResponseDto;
    comparison: {
      sizeDifference: number;
      sizeDifferenceFormatted: string;
      timeDifferenceHours: number;
      uploaderChanged: boolean;
    };
  }> {
    this.logger.debug(
      `Comparing versions ${version1Number} and ${version2Number} for document: ${documentId.value}`,
    );

    const [version1, version2] = await Promise.all([
      this.versionRepository.findByDocumentIdAndVersionNumber(documentId, version1Number),
      this.versionRepository.findByDocumentIdAndVersionNumber(documentId, version2Number),
    ]);

    if (!version1 || !version2) {
      throw new NotFoundException('One or both versions not found');
    }

    const comparison = this.versionMapper.compareVersions(version1, version2);

    const [olderVersion, newerVersion] = version1.isOlderThan(version2)
      ? [version1, version2]
      : [version2, version1];

    return {
      olderVersion: this.versionMapper.toResponseDto(olderVersion),
      newerVersion: this.versionMapper.toResponseDto(newerVersion),
      comparison,
    };
  }

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  async deleteOldVersions(
    documentId: DocumentId,
    keepLatest: number,
    currentUserId: UserId,
  ): Promise<number> {
    this.logger.log(
      `Deleting old versions for document: ${documentId.value}, keeping latest ${keepLatest}`,
    );

    // Verify ownership
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId.value}`);
    }

    if (!document.isOwnedBy(currentUserId)) {
      throw new BadRequestException('Only document owner can delete versions');
    }

    // Get versions to delete
    const allVersions = await this.versionRepository.findAllByDocumentId(documentId, {
      sortBy: 'versionNumber',
      sortOrder: 'desc',
    });

    if (allVersions.length <= keepLatest) {
      return 0;
    }

    const versionsToDelete = allVersions.slice(keepLatest);

    // Delete from storage and repository
    let deletedCount = 0;
    for (const version of versionsToDelete) {
      try {
        await this.storageService.delete(version.storagePath);
        await this.versionRepository.deleteMany([version.id]);
        deletedCount++;
      } catch (error) {
        this.logger.error(`Failed to delete version ${version.versionNumber}: ${error.message}`);
      }
    }

    this.logger.log(`Deleted ${deletedCount} old versions for document: ${documentId.value}`);

    return deletedCount;
  }

  async getStorageStats(documentId: DocumentId): Promise<{
    totalVersions: number;
    totalSizeBytes: number;
    averageSizeBytes: number;
    oldestVersion: Date;
    newestVersion: Date;
  }> {
    return await this.versionRepository.getStorageStatsForDocument(documentId);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateVersionStoragePath(
    documentId: DocumentId,
    versionNumber: number,
    fileName: FileName,
  ): StoragePath {
    const sanitized = fileName.value.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${documentId.value}/versions/v${versionNumber}_${sanitized}`;
    return StoragePath.create(path);
  }

  private detectMimeType(buffer: Buffer): string {
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'application/pdf';
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'image/png';
    }
    return 'application/octet-stream';
  }
}
