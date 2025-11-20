import { FamilyRelationship as PrismaRelationship } from '@prisma/client';
import { Relationship, RelationshipMetadata } from '../../../domain/entities/relationship.entity';

export class RelationshipMapper {
  /**
   * Domain -> Database
   */
  static toPersistence(domain: Relationship): PrismaRelationship {
    const metadata = domain.getMetadata();

    return {
      id: domain.getId(),
      familyId: domain.getFamilyId(),

      // Directional Edge
      fromMemberId: domain.getFromMemberId(),
      toMemberId: domain.getToMemberId(),

      type: domain.getType(),

      // Serialize Metadata (JSONB in Postgres)
      metadata: metadata ? (metadata as any) : null,

      // Trust Layer
      isVerified: domain.getIsVerified(),
      verificationMethod: (domain as any).verificationMethod || null,

      createdAt: new Date(), // Managed by DB default usually, but safe to pass
      updatedAt: new Date(),
    } as unknown as PrismaRelationship;
    // Cast required because Prisma types are strict about Json input types vs domain objects
  }

  /**
   * Database -> Domain
   */
  static toDomain(raw: PrismaRelationship): Relationship {
    // Parse Metadata
    let metadata: RelationshipMetadata = {};

    if (raw.metadata) {
      // Prisma Client automatically parses JSON columns into objects.
      // We check type just to be safe against legacy string data.
      if (typeof raw.metadata === 'string') {
        try {
          metadata = JSON.parse(raw.metadata);
        } catch (e) {
          metadata = {};
        }
      } else {
        metadata = raw.metadata as unknown as RelationshipMetadata;
      }
    }

    return Relationship.reconstitute({
      id: raw.id,
      familyId: raw.familyId,
      fromMemberId: raw.fromMemberId,
      toMemberId: raw.toMemberId,
      type: raw.type,

      metadata: metadata,

      isVerified: raw.isVerified,
      verificationMethod: raw.verificationMethod,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
