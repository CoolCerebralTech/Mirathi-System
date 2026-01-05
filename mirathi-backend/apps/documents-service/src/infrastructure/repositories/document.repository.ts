// apps/documents-service/src/infrastructure/repositories/document.repository.ts
import { Injectable } from '@nestjs/common';
import { Document, DocumentStatus, ReferenceType } from '@prisma/client';

import { PrismaService } from '@shamba/database';

export interface IDocumentRepository {
  create(data: CreateDocumentData): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findByUploader(uploaderId: string, status?: DocumentStatus): Promise<Document[]>;
  findPendingVerification(): Promise<Document[]>;
  findExpired(): Promise<Document[]>;
  updateStatus(id: string, status: DocumentStatus, data?: Partial<Document>): Promise<Document>;
  recordVerification(
    documentId: string,
    verifierId: string,
    action: string,
    notes?: string,
  ): Promise<void>;
  checkDuplicateReference(referenceNumber: string, referenceType: ReferenceType): Promise<boolean>;
  delete(id: string): Promise<void>;
}

export interface CreateDocumentData {
  uploaderId: string;
  documentName: string;
  referenceNumber?: string;
  referenceType?: ReferenceType;
  storageKey?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  ocrConfidence?: number;
  ocrExtractedText?: string;
  expiresAt: Date;
}

@Injectable()
export class DocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDocumentData): Promise<Document> {
    return this.prisma.document.create({
      data: {
        ...data,
        status: DocumentStatus.PENDING_UPLOAD,
      },
    });
  }

  async findById(id: string): Promise<Document | null> {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        verificationAttempts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async findByUploader(uploaderId: string, status?: DocumentStatus): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: {
        uploaderId,
        ...(status && { status }),
        deletedAt: null,
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findPendingVerification(): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: {
        status: DocumentStatus.PENDING_VERIFICATION,
        deletedAt: null,
      },
      orderBy: { uploadedAt: 'asc' },
    });
  }

  async findExpired(): Promise<Document[]> {
    const now = new Date();
    return this.prisma.document.findMany({
      where: {
        expiresAt: { lte: now },
        status: { not: DocumentStatus.VERIFIED },
        deletedAt: null,
      },
    });
  }

  async updateStatus(
    id: string,
    status: DocumentStatus,
    data?: Partial<Document>,
  ): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: {
        status,
        ...data,
      },
    });
  }

  async recordVerification(
    documentId: string,
    verifierId: string,
    action: string,
    notes?: string,
  ): Promise<void> {
    await this.prisma.verificationAttempt.create({
      data: {
        documentId,
        verifierId,
        action,
        notes,
      },
    });
  }

  async checkDuplicateReference(
    referenceNumber: string,
    referenceType: ReferenceType,
  ): Promise<boolean> {
    const existing = await this.prisma.document.findFirst({
      where: {
        referenceNumber,
        referenceType,
        status: { in: [DocumentStatus.VERIFIED, DocumentStatus.PENDING_VERIFICATION] },
        deletedAt: null,
      },
    });

    return !!existing;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
