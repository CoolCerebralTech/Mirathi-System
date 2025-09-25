import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { DocumentEntity, DocumentVersionEntity } from '../entities/document.entity';
import { UploadDocumentDto, UpdateDocumentDto, DocumentStatus } from '@shamba/common';

@Injectable()
export class DocumentRepository {
  constructor(private prisma: PrismaService) {}

  async create(uploaderId: string, uploadDocumentDto: UploadDocumentDto, storageResult: any): Promise<DocumentEntity> {
    const document = await this.prisma.document.create({
      data: {
        filename: uploadDocumentDto.filename,
        storagePath: storageResult.filePath,
        mimeType: uploadDocumentDto.mimeType,
        sizeBytes: uploadDocumentDto.sizeBytes,
        status: uploadDocumentDto.status || DocumentStatus.PENDING_VERIFICATION,
        uploaderId,
        metadata: {
          ...storageResult.metadata,
          checksum: storageResult.checksum,
          originalFilename: uploadDocumentDto.filename,
        },
        versions: {
          create: {
            versionNumber: 1,
            storagePath: storageResult.filePath,
            changeNote: 'Initial version',
          },
        },
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    return new DocumentEntity(document);
  }

  async findById(id: string): Promise<DocumentEntity> {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return new DocumentEntity(document);
  }

  async findByUploaderId(uploaderId: string): Promise<DocumentEntity[]> {
    const documents = await this.prisma.document.findMany({
      where: { uploaderId },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map(doc => new DocumentEntity(doc));
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<DocumentEntity> {
    await this.findById(id); // Verify document exists

    const document = await this.prisma.document.update({
      where: { id },
      data: updateDocumentDto,
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    return new DocumentEntity(document);
  }

  async updateStatus(id: string, status: DocumentStatus, verifiedBy?: string): Promise<DocumentEntity> {
    const updateData: any = { status };
    
    if (status === DocumentStatus.VERIFIED && verifiedBy) {
      updateData.metadata = {
        verifiedBy,
        verifiedAt: new Date().toISOString(),
      };
    }

    const document = await this.prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    return new DocumentEntity(document);
  }

  async delete(id: string): Promise<void> {
    const document = await this.findById(id);

    if (!document.canBeDeleted()) {
      throw new ConflictException('Cannot delete verified documents');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete versions first
      await tx.documentVersion.deleteMany({
        where: { documentId: id },
      });

      // Then delete document
      await tx.document.delete({
        where: { id },
      });
    });
  }

  async addVersion(
    documentId: string,
    storagePath: string,
    changeNote?: string,
  ): Promise<DocumentVersionEntity> {
    const document = await this.findById(documentId);
    const nextVersion = (document.versions?.[0]?.versionNumber || 0) + 1;

    const version = await this.prisma.documentVersion.create({
      data: {
        versionNumber: nextVersion,
        storagePath,
        changeNote: changeNote || `Version ${nextVersion}`,
        documentId,
      },
      include: {
        document: true,
      },
    });

    return new DocumentVersionEntity(version);
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersionEntity[]> {
    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      include: {
        document: true,
      },
    });

    return versions.map(version => new DocumentVersionEntity(version));
  }

  async searchDocuments(
    uploaderId: string,
    query: string,
    status?: DocumentStatus,
  ): Promise<DocumentEntity[]> {
    const where: any = { uploaderId };

    if (query) {
      where.OR = [
        { filename: { contains: query, mode: 'insensitive' } },
        { metadata: { path: ['originalFilename'], string_contains: query } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const documents = await this.prisma.document.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map(doc => new DocumentEntity(doc));
  }

  async getDocumentStats(uploaderId: string): Promise<{
    totalDocuments: number;
    documentsByStatus: Record<string, number>;
    totalSizeBytes: number;
    averageSizeBytes: number;
    documentsByType: Record<string, number>;
  }> {
    const documents = await this.findByUploaderId(uploaderId);
    
    const totalDocuments = documents.length;
    const totalSizeBytes = documents.reduce((sum, doc) => sum + doc.sizeBytes, 0);
    const averageSizeBytes = totalDocuments > 0 ? totalSizeBytes / totalDocuments : 0;

    const documentsByStatus: Record<string, number> = {};
    const documentsByType: Record<string, number> = {};

    documents.forEach(doc => {
      // Count by status
      documentsByStatus[doc.status] = (documentsByStatus[doc.status] || 0) + 1;

      // Count by type
      const type = doc.mimeType.split('/')[0]; // image, application, etc.
      documentsByType[type] = (documentsByType[type] || 0) + 1;
    });

    return {
      totalDocuments,
      documentsByStatus,
      totalSizeBytes,
      averageSizeBytes,
      documentsByType,
    };
  }

  async getDocumentsRequiringVerification(): Promise<DocumentEntity[]> {
    const documents = await this.prisma.document.findMany({
      where: { status: DocumentStatus.PENDING_VERIFICATION },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return documents.map(doc => new DocumentEntity(doc));
  }

  async bulkUpdateStatus(documentIds: string[], status: DocumentStatus, verifiedBy?: string): Promise<number> {
    const updateData: any = { status };
    
    if (status === DocumentStatus.VERIFIED && verifiedBy) {
      updateData.metadata = {
        verifiedBy,
        verifiedAt: new Date().toISOString(),
      };
    }

    const result = await this.prisma.document.updateMany({
      where: { id: { in: documentIds } },
      data: updateData,
    });

    return result.count;
  }
}