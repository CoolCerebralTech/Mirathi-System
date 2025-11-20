import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { IDocumentRepository, IStorageService } from '../../domain/interfaces';
import { Document, DocumentVersion } from '../../domain/models';
import {
  Actor,
  DocumentId,
  FileSize,
  MimeType,
  DocumentChecksum,
  StoragePath,
} from '../../domain/value-objects';
import { DocumentVersionMapper } from '../mappers';
import { FileValidatorService } from '../../infrastructure/storage/file-validator.service';
import {
  CreateDocumentVersionDto,
  CreateDocumentVersionResponseDto,
} from '../dtos/document-version.dto';
import * as crypto from 'crypto';
import { DOCUMENT_REPOSITORY, STORAGE_SERVICE } from '../../injection.tokens';

@Injectable()
export class DocumentVersionCommandService {
  private readonly logger = new Logger(DocumentVersionCommandService.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
    private readonly versionMapper: DocumentVersionMapper,
    private readonly fileValidator: FileValidatorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

    // 1. Fetch the Document aggregate root
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // 2. Check permissions and business rules
    this.validateVersionCreation(document, actor);

    // 3. Validate the new file
    const validationResult = this.fileValidator.validateFile(
      fileBuffer,
      originalFileName,
      document.mimeType.value,
    );

    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map((e) => e.message).join('; ');
      throw new BadRequestException(`File validation failed: ${errorMessages}`);
    }

    // 4. Generate storage path and calculate checksum
    const storagePathString = this.generateVersionStoragePath(document, originalFileName);
    const checksum = this.calculateChecksum(fileBuffer);

    // 5. Create domain value objects
    const fileSize = FileSize.create(fileBuffer.length);
    const mimeType = MimeType.create(document.mimeType.value);
    const documentChecksum = DocumentChecksum.create(checksum);
    const storagePath = StoragePath.fromExisting(storagePathString);

    try {
      // 6. Save the new file to storage first
      await this.storageService.save(fileBuffer, storagePath, {
        contentType: mimeType,
        metadata: {
          version: String(document.versions.length + 1),
          uploadedBy: actor.id.value,
          changeNote: dto.changeNote ?? '',
          parentDocumentId: documentId.value,
        },
      });

      // 7. Record new version in the Document aggregate
      document.recordNewVersion({
        uploadedBy: actor.id,
        storagePath,
        fileSize,
        mimeType,
        checksum: documentChecksum,
        changeNote: dto.changeNote,
      });

      // 8. Save the updated Document aggregate
      await this.documentRepository.save(document);

      // 9. Publish domain events
      this.publishDomainEvents(document);

      // 10. Get the newly created DocumentVersion and map to response
      const latestVersionFromArray = document.versions[document.versions.length - 1];

      if (!latestVersionFromArray) {
        throw new Error('Failed to retrieve the newly created document version.');
      }

      // Use proper type assertion for DocumentVersion
      const latestVersion = latestVersionFromArray as DocumentVersion;

      this.logger.log(
        `Created version ${latestVersion.versionNumber} for document ${documentId.value}`,
      );

      return this.versionMapper.toCreateResponseDto(latestVersion, document.fileName.value);
    } catch (error: unknown) {
      // Use the exact same error handling pattern as document.command.service
      if (error instanceof Error) {
        this.logger.error(`Failed to create version: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Failed to create version with an unknown error: ${String(error)}`);
      }

      await this.storageService.delete(storagePath).catch((deleteError: unknown) => {
        if (deleteError instanceof Error) {
          this.logger.error(
            `Failed to cleanup version file: ${deleteError.message}`,
            deleteError.stack,
          );
        } else {
          this.logger.error(
            `Failed to cleanup version file with an unknown error: ${String(deleteError)}`,
          );
        }
      });

      throw new BadRequestException('Failed to create document version');
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

    // Check permissions and business rules (same as above)
    if (!document.isOwnedBy(actor.id) && !actor.isAdmin()) {
      throw new ForbiddenException('Only document owner or admin can delete versions');
    }
    if (document.isDeleted()) {
      throw new BadRequestException('Cannot delete versions of a deleted document');
    }
    if (document.isVerified()) {
      throw new BadRequestException('Cannot delete versions of a verified document');
    }

    const versionToDelete = document.versions.find((v) => v.versionNumber === versionNumber);
    if (!versionToDelete) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }
    if (document.versions.length === 1) {
      throw new BadRequestException('Cannot delete the only version of a document');
    }
    const latestVersion = Math.max(...document.versions.map((v) => v.versionNumber));
    if (versionNumber === latestVersion) {
      throw new BadRequestException('Cannot delete the current version');
    }

    try {
      // Delete the version file from storage
      await this.storageService.delete(versionToDelete.storagePath);

      // Use the same pattern as in document.command.service - create a new document instance
      // This avoids unsafe type assertions while maintaining the domain integrity
      const documentProps = {
        // Include all document properties from persistence
        id: document.id.value,
        fileName: document.fileName.value,
        fileSize: document.fileSize.value,
        mimeType: document.mimeType.value,
        checksum: document.checksum?.value || null,
        storagePath: document.storagePath.value,
        category: document.category.value,
        status: document.status.value,
        uploaderId: document.uploaderId.value,
        verifiedBy: document.verifiedBy?.value || null,
        verifiedAt: document.verifiedAt,
        rejectionReason: document.rejectionReason?.value || null,
        assetId: document.assetId?.value || null,
        willId: document.willId?.value || null,
        identityForUserId: document.identityForUserId?.value || null,
        metadata: document.metadata,
        documentNumber: document.documentNumber,
        issueDate: document.issueDate,
        expiryDate: document.expiryDate,
        issuingAuthority: document.issuingAuthority,
        isPublic: document.isPublic(),
        encrypted: document.encrypted,
        allowedViewers: document.allowedViewers.toArray().map((id) => id.value),
        storageProvider: document.storageProvider.value,
        retentionPolicy: document.retentionPolicy?.value || null,
        expiresAt: document.expiresAt,
        isIndexed: document.isIndexed,
        indexedAt: document.indexedAt,
        version: document.version + 1,
        createdAt: document.createdAt,
        updatedAt: new Date(),
        deletedAt: document.deletedAt,
        versions: document.versions
          .filter((v) => v.versionNumber !== versionNumber)
          .map((v) => ({
            id: v.id.value,
            versionNumber: v.versionNumber,
            documentId: v.documentId.value,
            storagePath: v.storagePath.value,
            fileSize: v.fileSize.value,
            mimeType: v.mimeType.value,
            checksum: v.checksum?.value || null,
            changeNote: v.changeNote,
            uploadedBy: v.uploadedBy.value,
            createdAt: v.createdAt,
          })),
        verificationAttempts: document.verificationAttempts.map((a) => ({
          id: a.id.value,
          documentId: a.documentId.value,
          verifierId: a.verifierId.value,
          status: a.status.value,
          reason: a.reason?.value || null,
          metadata: a.metadata,
          createdAt: a.createdAt,
        })),
      };

      const updatedDocument = Document.fromPersistence(documentProps);
      await this.documentRepository.save(updatedDocument);

      this.logger.log(
        `Successfully deleted version ${versionNumber} of document ${documentId.value}`,
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(
        `Failed to delete version ${versionNumber} of document ${documentId.value}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(`Failed to delete version: ${errorMessage}`);
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

  private generateVersionStoragePath(document: Document, originalFileName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const versionNumber = document.versions.length + 1;
    const fileExtension = originalFileName.split('.').pop() || 'bin';
    return `/documents/${document.id.value}/versions/${timestamp}-v${versionNumber}-${randomString}.${fileExtension}`;
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
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
