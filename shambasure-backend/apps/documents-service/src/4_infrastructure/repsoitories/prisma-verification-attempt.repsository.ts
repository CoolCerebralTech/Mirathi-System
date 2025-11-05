// src/4_infrastructure/repositories/prisma-document-verification-attempt.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { DocumentVerificationAttempt as PrismaVerificationAttempt } from '@prisma/client';

import {
  IDocumentVerificationAttemptRepository,
  FindVerificationAttemptsFilters,
} from '../../3_domain/interfaces';
import { DocumentVerificationAttempt } from '../../3_domain/models/document-verification-attempt.model';
import {
  VerificationAttemptId,
  DocumentId,
  UserId,
  DocumentStatus,
  RejectionReason,
  DocumentStatusEnum,
} from '../../3_domain/value-objects';

/**
 * Prisma implementation of the DocumentVerificationAttempt repository.
 */
@Injectable()
export class PrismaDocumentVerificationAttemptRepository
  implements IDocumentVerificationAttemptRepository
{
  private readonly logger = new Logger(PrismaDocumentVerificationAttemptRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // CREATE
  // ============================================================================

  async create(attempt: DocumentVerificationAttempt): Promise<DocumentVerificationAttempt> {
    try {
      const prismaAttempt = await this.prisma.documentVerificationAttempt.create({
        data: {
          id: attempt.id.value,
          documentId: attempt.documentId.value,
          verifierId: attempt.verifierId.value,
          status: attempt.status.value,
          reason: attempt.reason?.value || null,
          metadata: attempt.metadata as any,
          createdAt: attempt.createdAt,
        },
      });

      this.logger.log(
        `Verification attempt created: ${prismaAttempt.id} for document ${prismaAttempt.documentId}`,
      );
      return this.toDomain(prismaAttempt);
    } catch (error) {
      this.logger.error(`Failed to create verification attempt: ${error.message}`, error.stack);
      throw new Error(`Failed to create verification attempt: ${error.message}`);
    }
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  async findById(id: VerificationAttemptId): Promise<DocumentVerificationAttempt | null> {
    try {
      const prismaAttempt = await this.prisma.documentVerificationAttempt.findUnique({
        where: { id: id.value },
      });

      if (!prismaAttempt) return null;
      return this.toDomain(prismaAttempt);
    } catch (error) {
      this.logger.error(`Failed to find verification attempt by ID: ${error.message}`, error.stack);
      throw new Error(`Failed to find verification attempt by ID: ${error.message}`);
    }
  }

  async findByDocumentId(
    documentId: DocumentId,
    options: { limit?: number; orderBy?: 'createdAt' | 'updatedAt' } = {},
  ): Promise<DocumentVerificationAttempt[]> {
    try {
      const { limit, orderBy = 'createdAt' } = options;

      const prismaAttempts = await this.prisma.documentVerificationAttempt.findMany({
        where: { documentId: documentId.value },
        take: limit,
        orderBy: { [orderBy]: 'desc' },
      });

      return prismaAttempts.map((attempt) => this.toDomain(attempt));
    } catch (error) {
      this.logger.error(
        `Failed to find verification attempts by document ID: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find verification attempts by document ID: ${error.message}`);
    }
  }

  async findByVerifierId(verifierId: UserId): Promise<DocumentVerificationAttempt[]> {
    try {
      const prismaAttempts = await this.prisma.documentVerificationAttempt.findMany({
        where: { verifierId: verifierId.value },
        orderBy: { createdAt: 'desc' },
      });

      return prismaAttempts.map((attempt) => this.toDomain(attempt));
    } catch (error) {
      this.logger.error(
        `Failed to find verification attempts by verifier ID: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find verification attempts by verifier ID: ${error.message}`);
    }
  }

  async findLatestByDocumentId(
    documentId: DocumentId,
  ): Promise<DocumentVerificationAttempt | null> {
    try {
      const prismaAttempt = await this.prisma.documentVerificationAttempt.findFirst({
        where: { documentId: documentId.value },
        orderBy: { createdAt: 'desc' },
      });

      if (!prismaAttempt) return null;
      return this.toDomain(prismaAttempt);
    } catch (error) {
      this.logger.error(
        `Failed to find latest verification attempt: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to find latest verification attempt: ${error.message}`);
    }
  }

  async countByStatus(documentId: DocumentId): Promise<{ verified: number; rejected: number }> {
    try {
      const counts = await this.prisma.documentVerificationAttempt.groupBy({
        by: ['status'],
        where: { documentId: documentId.value },
        _count: true,
      });

      const result = { verified: 0, rejected: 0 };

      counts.forEach((item) => {
        if (item.status === DocumentStatusEnum.VERIFIED) {
          result.verified = item._count;
        } else if (item.status === DocumentStatusEnum.REJECTED) {
          result.rejected = item._count;
        }
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to count verification attempts by status: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to count verification attempts by status: ${error.message}`);
    }
  }

  async getVerifierStats(
    verifierId: UserId,
    timeRange?: { start: Date; end: Date },
  ): Promise<{
    totalAttempts: number;
    verified: number;
    rejected: number;
    averageProcessingTime: number;
  }> {
    try {
      const where: any = { verifierId: verifierId.value };

      if (timeRange) {
        where.createdAt = {
          gte: timeRange.start,
          lte: timeRange.end,
        };
      }

      const [totalAttempts, verifiedCount, rejectedCount, processingTimes] = await Promise.all([
        this.prisma.documentVerificationAttempt.count({ where }),
        this.prisma.documentVerificationAttempt.count({
          where: { ...where, status: DocumentStatusEnum.VERIFIED },
        }),
        this.prisma.documentVerificationAttempt.count({
          where: { ...where, status: DocumentStatusEnum.REJECTED },
        }),
        this.prisma.documentVerificationAttempt.findMany({
          where,
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      // Calculate average processing time (simplified - in real scenario, you might track start/end times)
      let averageProcessingTime = 0;
      if (processingTimes.length > 1) {
        const timeDifferences: number[] = [];
        for (let i = 1; i < processingTimes.length; i++) {
          const diff =
            processingTimes[i].createdAt.getTime() - processingTimes[i - 1].createdAt.getTime();
          timeDifferences.push(diff);
        }
        averageProcessingTime =
          timeDifferences.reduce((sum, diff) => sum + diff, 0) / timeDifferences.length;
      }

      return {
        totalAttempts,
        verified: verifiedCount,
        rejected: rejectedCount,
        averageProcessingTime,
      };
    } catch (error) {
      this.logger.error(`Failed to get verifier stats: ${error.message}`, error.stack);
      throw new Error(`Failed to get verifier stats: ${error.message}`);
    }
  }

  async exists(id: VerificationAttemptId): Promise<boolean> {
    try {
      const count = await this.prisma.documentVerificationAttempt.count({
        where: { id: id.value },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Failed to check verification attempt existence: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to check verification attempt existence: ${error.message}`);
    }
  }

  // ============================================================================
  // MAPPING HELPERS
  // ============================================================================

  private toDomain(prismaAttempt: PrismaVerificationAttempt): DocumentVerificationAttempt {
    // Create value objects
    const documentId = new DocumentId(prismaAttempt.documentId);
    const verifierId = new UserId(prismaAttempt.verifierId);
    const status = new DocumentStatus(prismaAttempt.status as DocumentStatusEnum);

    // Optional value objects
    const reason = prismaAttempt.reason ? new RejectionReason(prismaAttempt.reason) : null;

    // For now, we'll handle verifier names in the service layer
    const verifierName = 'Unknown'; // Will be enriched at service layer

    return DocumentVerificationAttempt.fromPersistence({
      id: prismaAttempt.id,
      documentId: documentId.value,
      verifierId: verifierId.value,
      verifierName,
      status: status.value,
      reason: reason?.value || null,
      metadata: prismaAttempt.metadata as Record<string, any> | null,
      createdAt: prismaAttempt.createdAt,
      updatedAt: prismaAttempt.createdAt, // Prisma model doesn't have updatedAt, using createdAt
    });
  }
}
