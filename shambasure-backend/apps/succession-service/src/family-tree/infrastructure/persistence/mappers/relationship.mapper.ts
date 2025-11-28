import { FamilyRelationship as PrismaRelationship, Prisma } from '@prisma/client';
import { Relationship, RelationshipMetadata } from '../../../domain/entities/relationship.entity';

/**
 * RelationshipMapper
 *
 * Transforms the Relationship Aggregate Root between Domain and Persistence layers.
 * Handles metadata JSON serialization for adoption/biology details.
 */
export class RelationshipMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaRelationship): Relationship {
    // 1. Safe JSON extraction for Metadata
    let metadata: RelationshipMetadata = {};

    if (raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata)) {
      metadata = raw.metadata as unknown as RelationshipMetadata;
    }

    return Relationship.reconstitute({
      id: raw.id,
      familyId: raw.familyId,
      fromMemberId: raw.fromMemberId,
      toMemberId: raw.toMemberId,

      // Strict Enum Cast
      type: raw.type,

      metadata: metadata,

      isVerified: raw.isVerified,
      verificationMethod: raw.verificationMethod,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,

      // Optional fields not in Schema (but Entity supports them)
      verifiedAt: null,
      verifiedBy: null,
    });
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(entity: Relationship): PrismaRelationship {
    const metadata = entity.getMetadata();

    // Prepare JSON for persistence
    // Ensure we don't save empty objects if not needed, but Prisma handles it fine.
    const metadataJson = metadata
      ? (JSON.parse(JSON.stringify(metadata)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    return {
      id: entity.getId(),
      familyId: entity.getFamilyId(),
      fromMemberId: entity.getFromMemberId(),
      toMemberId: entity.getToMemberId(),

      type: entity.getType(),

      // Map strict JSON
      metadata: metadataJson,

      isVerified: entity.getIsVerified(),
      verificationMethod: entity.getVerificationMethod() || null,

      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    };
  }
}
