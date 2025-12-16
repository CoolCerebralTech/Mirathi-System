import { Injectable, Logger } from '@nestjs/common';
import { Prisma, FamilyLegalEvent as PrismaFamilyLegalEvent } from '@prisma/client';

import {
  FamilyLegalEvent,
  FamilyLegalEventProps,
  LegalEventType,
} from '../../../domain/entities/family-legal-event.entity';

@Injectable()
export class FamilyLegalEventMapper {
  private readonly logger = new Logger(FamilyLegalEventMapper.name);

  /**
   * Converts a raw Prisma FamilyLegalEvent record into a FamilyLegalEvent domain entity.
   */
  toDomain(raw: PrismaFamilyLegalEvent | null): FamilyLegalEvent | null {
    if (!raw) {
      return null;
    }

    try {
      // 1. Safe Metadata Parsing
      const metadata =
        raw.metadata && typeof raw.metadata === 'object'
          ? (raw.metadata as Record<string, any>)
          : {};

      // 2. Extract occurredAt from metadata (fallback to recordedAt/createdAt if missing)
      // This supports historical data entry where the event happened years ago.
      let occurredAt = raw.createdAt;
      if (metadata.occurredAt) {
        const parsedDate = new Date(metadata.occurredAt);
        if (!isNaN(parsedDate.getTime())) {
          occurredAt = parsedDate;
        }
      }

      // 3. Enum Casting
      // Ensure DB string matches Domain Enum, default to generic if unknown
      const eventType = Object.values(LegalEventType).includes(raw.eventType as LegalEventType)
        ? (raw.eventType as LegalEventType)
        : LegalEventType.MARRIAGE_REGISTERED; // Fallback or throw based on strictness

      const props: FamilyLegalEventProps = {
        id: raw.id,
        familyId: raw.familyId,
        eventType: eventType,
        description: raw.description,
        metadata: metadata,
        relatedUserId: raw.relatedUserId ?? undefined,
        relatedEstateId: raw.relatedEstateId ?? undefined,
        relatedCaseId: raw.relatedCaseId ?? undefined,
        recordedBy: raw.recordedBy ?? undefined,
        occurredAt: occurredAt,
        recordedAt: raw.createdAt, // DB `createdAt` maps to domain `recordedAt`
        // FIX: Map the actual version from DB schema
        version: raw.version,
      };

      return FamilyLegalEvent.createFromProps(props);
    } catch (error) {
      this.logger.error(`Failed to reconstitute FamilyLegalEvent ${raw?.id}`, error.stack);
      throw new Error(`Data integrity error for FamilyLegalEvent ${raw?.id}: ${error.message}`);
    }
  }

  /**
   * Converts a FamilyLegalEvent domain entity into a Prisma-compatible data structure.
   */
  toPersistence(entity: FamilyLegalEvent): Prisma.FamilyLegalEventUncheckedCreateInput {
    const props = entity.toJSON();

    // Strategy: We embed the domain's `occurredAt` into the metadata JSON
    // because the Schema doesn't have a specific column for it.
    const metadataWithOccurredAt = {
      ...props.metadata,
      occurredAt: props.occurredAt.toISOString(),
    };

    return {
      id: props.id,
      familyId: props.familyId,
      eventType: props.eventType,
      description: props.description,
      metadata: metadataWithOccurredAt as Prisma.InputJsonValue,
      relatedUserId: props.relatedUserId,
      relatedEstateId: props.relatedEstateId,
      relatedCaseId: props.relatedCaseId,
      recordedBy: props.recordedBy,
      // DB 'createdAt' represents when the record was inserted (recordedAt)
      createdAt: props.recordedAt,
      version: props.version,
    };
  }

  /**
   * Creates a partial update input (though Legal Events are usually immutable)
   */
  toPrismaUpdate(entity: FamilyLegalEvent): Prisma.FamilyLegalEventUncheckedUpdateInput {
    const props = entity.toJSON();

    // Only mutable fields (e.g., if correcting a typo in description)
    return {
      description: props.description,
      metadata: {
        ...props.metadata,
        occurredAt: props.occurredAt.toISOString(),
      } as Prisma.InputJsonValue,
      version: props.version,
    };
  }
}
