import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

import { IDocumentRepository } from '../../3_domain/interfaces/document.repository.interface';
import { IDocumentVersionRepository } from '../../3_domain/interfaces/document-version.repository.interface';
import { IStorageService } from '../../3_domain/interfaces/storage.service.interface';
import { FileValidatorService } from '../../4_infrastructure/storage/file-validator.service';
import { DocumentVersionMapper } from '../mappers/document-version.mapper';
import { Document } from '../../3_domain/models/document.model';
import { DocumentVersion } from '../../3_domain/models/document-version.model';
import {
  DocumentId,
  UserId,
  StoragePath,
  FileMetadata,
  DocumentVersionId,
} from '../../3_domain/value-objects';
import { DocumentVersionResponseDto } from '../dtos';
import { DocumentVersionedEvent } from '../../3_domain/events';

export interface CreateDocumentVersionCommand {
  documentId: string;
  file: Buffer;
  filename: string;
  mimeType: string;
  uploadedBy: string;
  uploadedByName: string;
  changeNote?: string;
}

@Injectable()
export class DocumentVersionService {
  private readonly logger = new Logger(DocumentVersionService.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly documentVersionRepository: IDocumentVersionRepository,
    private readonly storageService: IStorageService,
    private readonly fileValidator: FileValidatorService,
    private readonly documentVersionMapper: DocumentVersionMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createVersion(command: CreateDocumentVersionCommand): Promise<DocumentVersionResponseDto> {
    try {
      const document = await this.documentRepository.findById(new DocumentId(command.documentId));
      if (!document) {
        throw new NotFoundException(`Document not found: ${command.documentId}`);
      }

      // Check permissions
      await this.ensureUserCanCreateVersion(document, new UserId(command.uploadedBy));

      // Validate file
      const validationResult = await this.fileValidator.validateFile(
        command.file,
        command.filename,
        command.mimeType,
      );

      if (!validationResult.isValid) {
        throw new BadRequestException(
          `File validation failed: ${validationResult.errors.join(', ')}`,
        );
      }

      // Get next version number
      const currentVersionCount = await this.documentVersionRepository.countByDocumentId(
        new DocumentId(command.documentId),
      );
      const versionNumber = currentVersionCount + 1;

      // Generate storage path for new version
      const storagePath = this.generateVersionStoragePath(
        document,
        command.filename,
        versionNumber,
      );

      // Save file to storage
      const storageResult = await this.storageService.save(command.file, storagePath.value, {
        contentType: command.mimeType,
        checksum: this.calculateChecksum(command.file),
      });

      // Create file metadata
      const fileMetadata = FileMetadata.create(
        command.filename,
        command.mimeType,
        command.file.length,
        storageResult.checksum,
      );

      // Create version entity
      const version = DocumentVersion.create({
        id: new DocumentVersionId(uuidv4()),
        versionNumber,
        documentId: new DocumentId(command.documentId),
        storagePath,
        fileMetadata,
        uploadedBy: new UserId(command.uploadedBy),
        uploadedByName: command.uploadedByName,
        changeNote: command.changeNote,
      });

      // Save version
      const savedVersion = await this.documentVersionRepository.create(version);

      // Update document to point to new version (if this is the new current version)
      document.createNewVersion(
        fileMetadata,
        storagePath,
        new UserId(command.uploadedBy),
        command.changeNote,
      );

      await this.documentRepository.update(document);

      // Publish domain event
      this.eventEmitter.emit(
        DocumentVersionedEvent.name,
        new DocumentVersionedEvent(
          document.id.value,
          versionNumber,
          versionNumber - 1,
          storagePath.value,
          command.uploadedBy,
          command.changeNote,
          command.file.length,
          storageResult.checksum,
        ),
      );

      this.logger.log(`Created version ${versionNumber} for document ${command.documentId}`);

      return this.documentVersionMapper.toResponseDto(savedVersion, {
        includeDownloadUrl: true,
      });
    } catch (error) {
      this.logger.error(`Failed to create document version: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDocumentVersions(
    documentId: string,
    requestingUserId: string,
    options: { includeDownloadUrl?: boolean } = {},
  ): Promise<DocumentVersionResponseDto[]> {
    try {
      const document = await this.documentRepository.findById(new DocumentId(documentId));
      if (!document) {
        throw new NotFoundException(`Document not found: ${documentId}`);
      }

      await this.ensureUserCanViewVersions(document, new UserId(requestingUserId));

      const versions = await this.documentVersionRepository.findByDocumentId(
        new DocumentId(documentId),
      );

      return this.documentVersionMapper.toResponseDtoList(versions, options);
    } catch (error) {
      this.logger.error(`Failed to get document versions: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getVersion(
    documentId: string,
    versionNumber: number,
    requestingUserId: string,
  ): Promise<DocumentVersionResponseDto> {
    try {
      const document = await this.documentRepository.findById(new DocumentId(documentId));
      if (!document) {
        throw new NotFoundException(`Document not found: ${documentId}`);
      }

      await this.ensureUserCanViewVersions(document, new UserId(requestingUserId));

      const version = await this.documentVersionRepository.findByDocumentIdAndVersion(
        new DocumentId(documentId),
        versionNumber,
      );

      if (!version) {
        throw new NotFoundException(
          `Version ${versionNumber} not found for document ${documentId}`,
        );
      }

      return this.documentVersionMapper.toResponseDto(version, {
        includeDownloadUrl: true,
      });
    } catch (error) {
      this.logger.error(`Failed to get document version: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getVersionFile(
    documentId: string,
    versionNumber: number,
    requestingUserId: string,
  ): Promise<Buffer> {
    try {
      const document = await this.documentRepository.findById(new DocumentId(documentId));
      if (!document) {
        throw new NotFoundException(`Document not found: ${documentId}`);
      }

      await this.ensureUserCanViewVersions(document, new UserId(requestingUserId));

      const version = await this.documentVersionRepository.findByDocumentIdAndVersion(
        new DocumentId(documentId),
        versionNumber,
      );

      if (!version) {
        throw new NotFoundException(
          `Version ${versionNumber} not found for document ${documentId}`,
        );
      }

      const fileContent = await this.storageService.retrieve(version.storagePath.value, {
        validateChecksum: true,
        expectedChecksum: version.fileMetadata.checksum.value,
      });

      return fileContent.buffer;
    } catch (error) {
      this.logger.error(`Failed to get version file: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async ensureUserCanCreateVersion(document: Document, userId: UserId): Promise<void> {
    if (!document.isOwnedBy(userId)) {
      throw new ForbiddenException('Only document owner can create new versions');
    }

    if (document.isVerified()) {
      throw new ForbiddenException('Cannot create new versions for verified documents');
    }
  }

  private async ensureUserCanViewVersions(document: Document, userId: UserId): Promise<void> {
    if (!document.canBeAccessedBy(userId)) {
      throw new ForbiddenException('Access denied to document versions');
    }
  }

  private generateVersionStoragePath(
    document: Document,
    filename: string,
    versionNumber: number,
  ): StoragePath {
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `documents/${document.uploaderId.value}/versions/${document.id.value}/v${versionNumber}_${safeFilename}`;
    return new StoragePath(path);
  }

  private calculateChecksum(buffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
