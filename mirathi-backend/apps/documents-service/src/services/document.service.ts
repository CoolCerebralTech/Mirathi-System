import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '@shamba/database';

// Adjust path to your Prisma Service
import { MinioService } from '../adapters/minio.service';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { VerifyDocumentDto } from '../dto/verify-document.dto';

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  /**
   * 1. Uploads file to MinIO
   * 2. Creates DB record with status PENDING_VERIFICATION
   */
  async upload(userId: string, dto: UploadDocumentDto, file: Express.Multer.File) {
    const fileExt = file.originalname.split('.').pop();
    // Path: estateId/category/uuid.ext
    const storagePath = `${dto.estateId}/${dto.category}/${uuidv4()}.${fileExt}`;

    // Upload to Storage
    await this.minioService.uploadFile(storagePath, file.buffer, file.mimetype);

    // Create Database Record
    return this.prisma.document.create({
      data: {
        estateId: dto.estateId,
        category: dto.category,
        type: dto.type,
        status: DocumentStatus.PENDING_VERIFICATION,
        uploaderId: userId,
        identityForUserId: dto.identityForUserId,
        assetId: dto.assetId,
        willId: dto.willId,
        versions: {
          create: {
            versionNumber: 1,
            storagePath: storagePath,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            uploadedBy: userId,
          },
        },
      },
    });
  }

  /**
   * Called by Admin/Verifier to see the document before approving.
   */
  async getViewLink(documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!doc || !doc.versions[0]) throw new NotFoundException('Document or file version not found');

    const url = await this.minioService.getPresignedUrl(doc.versions[0].storagePath);
    return { url, document: doc };
  }

  /**
   * Manual Verification Logic.
   * If APPROVED: Schedules file for deletion (Retention Policy).
   */
  async verify(documentId: string, verifierId: string, dto: VerifyDocumentDto) {
    const updateData: any = {
      status: dto.status,
      verifiedBy: verifierId,
      rejectionReason: dto.status === DocumentStatus.REJECTED ? dto.rejectionReason : null,
    };

    // PRIVACY/TRUST LOGIC:
    // If Verified, we set an expiration date (e.g., 24 hours from now).
    // The Cron job will pick this up and delete the physical file.
    if (dto.status === DocumentStatus.VERIFIED) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Keep file for 24h just in case, then purge.
      updateData.expiresAt = expiresAt;
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data: updateData,
    });
  }
}
