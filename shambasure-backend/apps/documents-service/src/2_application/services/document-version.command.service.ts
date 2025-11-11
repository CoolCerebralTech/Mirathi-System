import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IDocumentRepository, IStorageService } from '../../3_domain/interfaces';
import { Document } from '../../3_domain/models';
import {
  Actor,
  DocumentId,
  FileSize,
  MimeType,
  DocumentChecksum,
  StoragePath,
} from '../../3_domain/value-objects';
import { DocumentVersionMapper } from '../mappers';
import { FileValidatorService } from '../../4_infrastructure/storage/file-validator.service';
import {
  CreateDocumentVersionDto,
  CreateDocumentVersionResponseDto,
} from '../dtos/document-version.dto';
import * as crypto from 'crypto';

@Injectable()
export class DocumentVersionCommandService {
  private readonly logger = new Logger(DocumentVersionCommandService.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageService: IStorageService,
    private readonly versionMapper: DocumentVersionMapper,
    private readonly fileValidator: FileValidatorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Creates a new version for an existing document
   */
  async createNewVersion(
    documentId: DocumentId,
    dto: CreateDocumentVersionDto,
    fileBuffer: Buffer,
    originalFileName: string,
    actor: Actor,
  ): Promise<CreateDocumentVersionResponseDto> {
    this.logger.log(
      `Creating new version for document ${documentId.value} by actor ${actor.id.value}`,
    );

    // 1. Fetch the document aggregate
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // 2. Check permissions and business rules
    this.validateVersionCreation(document, actor);

    // 3. Validate the new file
    const validationResult = await this.fileValidator.validateFile(fileBuffer, originalFileName);
    if (!validationResult.isValid) {
      throw new BadRequestException(
        `File validation failed: ${validationResult.errors.join(', ')}`,
      );
    }

    // 4. Generate storage path and calculate checksum
    const storagePath = this.generateVersionStoragePath(document, originalFileName);
    const checksum = this.calculateChecksum(fileBuffer);

    // 5. Create domain value objects
    const fileSize = FileSize.create(fileBuffer.length);
    const mimeType = MimeType.create(validationResult.mimeType);
    const documentChecksum = DocumentChecksum.create(checksum);

    try {
      // 6. Save the new file to storage first
      await this.storageService.save(fileBuffer, storagePath, {
        contentType: mimeType,
        metadata: {
          version: document.versions.length + 1,
          uploadedBy: actor.id.value,
          changeNote: dto.changeNote,
          parentDocumentId: documentId.value,
        },
      });

      // 7. Record new version in the domain aggregate
      document.recordNewVersion({
        uploadedBy: actor.id,
        storagePath,
        fileSize,
        mimeType,
        checksum: documentChecksum,
        changeNote: dto.changeNote,
      });

      // 8. Save the updated aggregate
      await this.documentRepository.save(document);

      // 9. Publish domain events
      this.publishDomainEvents(document);

      // 10. Get the newly created version and map to response
      const latestVersion = document.versions[document.versions.length - 1];

      this.logger.log(
        `Successfully created version ${latestVersion.versionNumber} for document ${document.id.value}`,
      );

      return this.versionMapper.toCreateResponseDto(latestVersion, document.fileName.value);
    } catch (error) {
      this.logger.error(
        `Failed to create new version for document ${documentId.value}: ${error.message}`,
        error.stack,
      );

      // Cleanup: delete the file if the operation failed
      await this.cleanupFailedVersion(storagePath);

      throw new BadRequestException(`Failed to create document version: ${error.message}`);
    }
  }

  /**
   * Deletes a specific version of a document
   */
  async deleteVersion(documentId: DocumentId, versionNumber: number, actor: Actor): Promise<void> {
    this.logger.log(
      `Deleting version ${versionNumber} of document ${documentId.value} by actor ${actor.id.value}`,
    );

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check permissions
    if (!document.isOwnedBy(actor.id) && !actor.isAdmin()) {
      throw new ForbiddenException('Only document owner or admin can delete versions');
    }

    if (document.isDeleted()) {
      throw new BadRequestException('Cannot delete versions of a deleted document');
    }

    if (document.isVerified()) {
      throw new BadRequestException('Cannot delete versions of a verified document');
    }

    // Find the version to delete
    const versionToDelete = document.versions.find((v) => v.versionNumber === versionNumber);
    if (!versionToDelete) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    // Cannot delete the only version
    if (document.versions.length === 1) {
      throw new BadRequestException('Cannot delete the only version of a document');
    }

    // Cannot delete the current version (latest)
    const latestVersion = Math.max(...document.versions.map((v) => v.versionNumber));
    if (versionNumber === latestVersion) {
      throw new BadRequestException(
        'Cannot delete the current version. Please create a new version first.',
      );
    }

    try {
      // Delete the version file from storage
      await this.storageService.delete(versionToDelete.storagePath);

      // Remove the version from the aggregate
      document.versions = document.versions.filter((v) => v.versionNumber !== versionNumber);

      // Save the updated aggregate
      await this.documentRepository.save(document);

      this.logger.log(
        `Successfully deleted version ${versionNumber} of document ${documentId.value}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete version ${versionNumber} of document ${documentId.value}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Failed to delete version: ${error.message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private validateVersionCreation(document: Document, actor: Actor): void {
    if (document.isDeleted()) {
      throw new BadRequestException('Cannot create versions for a deleted document');
    }

    if (document.isVerified()) {
      throw new BadRequestException('Cannot create versions for a verified document');
    }

    if (document.isExpired()) {
      throw new BadRequestException('Cannot create versions for an expired document');
    }

    if (!document.isOwnedBy(actor.id) && !actor.isAdmin()) {
      throw new ForbiddenException('Only document owner or admin can create new versions');
    }
  }

  private generateVersionStoragePath(document: Document, originalFileName: string): StoragePath {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = originalFileName.split('.').pop() || 'bin';
    const versionNumber = document.versions.length + 1;

    const path = `/documents/${document.id.value}/versions/${timestamp}-v${versionNumber}-${randomString}.${fileExtension}`;
    return StoragePath.fromExisting(path);
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async cleanupFailedVersion(storagePath: StoragePath): Promise<void> {
    try {
      await this.storageService.delete(storagePath);
      this.logger.log(`Cleaned up failed version file: ${storagePath.value}`);
    } catch (deleteError) {
      this.logger.error(
        `Failed to cleanup version file ${storagePath.value}: ${deleteError.message}`,
      );
    }
  }

  private publishDomainEvents(document: Document): void {
    if (document.domainEvents.length === 0) return;

    this.logger.debug(
      `Publishing ${document.domainEvents.length} domain events for document ${document.id.value}`,
    );

    document.domainEvents.forEach((event) => {
      this.eventEmitter.emit(event.constructor.name, event);
    });

    document.clearDomainEvents();
  }
}
