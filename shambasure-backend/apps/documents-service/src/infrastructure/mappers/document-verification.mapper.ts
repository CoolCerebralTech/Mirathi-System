import { Prisma } from '@prisma/client';
import { DocumentVerificationAttempt } from '../../domain/models/document-verification.model';
import {
  VerificationAttemptId,
  DocumentId,
  UserId,
  DocumentStatus,
} from '../../domain/value-objects';
import {
  DocumentVerificationAttemptEntity,
  CreateDocumentVerificationAttemptEntity,
} from '../entities/document-verification.entity';

/**
 * DocumentVerificationAttempt Mapper - Handles Domain ↔ Persistence transformation
 *
 * RESPONSIBILITIES:
 * - Convert verification attempt entities to database records
 * - Rehydrate verification attempt entities from database
 * - Handle value object serialization/deserialization
 */
export class DocumentVerificationAttemptMapper {
  /**
   * Converts Domain entity to Persistence entity (for CREATE)
   */
  static toPersistence(
    attempt: Readonly<DocumentVerificationAttempt>,
  ): CreateDocumentVerificationAttemptEntity {
    return {
      id: attempt.id.value,
      documentId: attempt.documentId.value,
      verifierId: attempt.verifierId.value,
      status: attempt.status.value,
      reason: attempt.reason?.value ?? null,
      metadata: attempt.metadata === null ? Prisma.JsonNull : attempt.metadata,
    };
  }

  /**
   * Converts Persistence entity to Domain entity (for READ)
   */
  static toDomain(entity: DocumentVerificationAttemptEntity): DocumentVerificationAttempt {
    const metadata =
      entity.metadata && typeof entity.metadata === 'object' && !Array.isArray(entity.metadata)
        ? (entity.metadata as Record<string, any>)
        : null;

    return DocumentVerificationAttempt.fromPersistence({
      id: entity.id,
      documentId: entity.documentId,
      verifierId: entity.verifierId,
      status: entity.status,
      reason: entity.reason,
      metadata,
      createdAt: entity.createdAt,
    });
  }

  /**
   * Converts multiple entities to domain entities (batch operation)
   */
  static toDomainMany(
    entities: readonly DocumentVerificationAttemptEntity[],
  ): DocumentVerificationAttempt[] {
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Converts multiple domain entities to persistence entities (batch operation)
   */
  static toPersistenceMany(
    attempts: readonly Readonly<DocumentVerificationAttempt>[],
  ): CreateDocumentVerificationAttemptEntity[] {
    return attempts.map((attempt) => this.toPersistence(attempt));
  }

  /**
   * Maps an attempt entity with minimal fields (for performance)
   */
  static toMinimalDomain(entity: {
    id: string;
    documentId: string;
    verifierId: string;
    status: string; // The input from the database is a raw string
    createdAt: Date;
  }): {
    id: VerificationAttemptId;
    documentId: DocumentId;
    verifierId: UserId;
    status: DocumentStatus; // The output should be the domain Value Object
    createdAt: Date;
  } {
    return {
      id: new VerificationAttemptId(entity.id),
      documentId: new DocumentId(entity.documentId),
      verifierId: new UserId(entity.verifierId),
      status: DocumentStatus.create(entity.status),
      createdAt: entity.createdAt,
    };
  }

  /**
   * Maps verification attempt to audit summary (for logging/reporting)
   */
  static toAuditSummary(entity: DocumentVerificationAttemptEntity): {
    attemptId: string;
    documentId: string;
    verifierId: string;
    decision: 'APPROVED' | 'REJECTED';
    reason?: string;
    timestamp: Date;
  } {
    return {
      attemptId: entity.id,
      documentId: entity.documentId,
      verifierId: entity.verifierId,
      decision: entity.status === 'VERIFIED' ? 'APPROVED' : 'REJECTED',
      reason: entity.reason ?? undefined,
      timestamp: entity.createdAt,
    };
  }
}
