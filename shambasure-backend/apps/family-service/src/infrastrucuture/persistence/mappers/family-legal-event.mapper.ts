import { Injectable } from '@nestjs/common';
import { Prisma, FamilyLegalEvent as PrismaFamilyLegalEvent } from '@prisma/client';

import {
  FamilyLegalEvent,
  FamilyLegalEventProps,
  LegalEventType,
} from '../../../domain/entities/family-legal-event.entity';

@Injectable()
export class FamilyLegalEventMapper {
  /**
   * Converts a raw Prisma FamilyLegalEvent record into a FamilyLegalEvent domain entity.
   * This method reconstitutes the entity from database data.
   * @param raw The raw data from Prisma.
   * @returns A FamilyLegalEvent entity instance, or null if raw is null.
   */
  toDomain(raw: PrismaFamilyLegalEvent | null): FamilyLegalEvent | null {
    if (!raw) {
      return null;
    }

    const metadata = (raw.metadata as Record<string, any>) ?? {};

    // The domain expects `occurredAt`, but the schema only has `createdAt`.
    // We retrieve `occurredAt` from the metadata, with a fallback to `createdAt`
    // for data integrity, ensuring the domain model is always valid.
    const occurredAt = metadata.occurredAt ? new Date(metadata.occurredAt) : raw.createdAt;

    const props: FamilyLegalEventProps = {
      id: raw.id,
      familyId: raw.familyId,
      eventType: raw.eventType as LegalEventType,
      description: raw.description,
      metadata: metadata,
      relatedUserId: raw.relatedUserId ?? undefined,
      relatedEstateId: raw.relatedEstateId ?? undefined,
      relatedCaseId: raw.relatedCaseId ?? undefined,
      recordedBy: raw.recordedBy ?? undefined,
      occurredAt: occurredAt,
      recordedAt: raw.createdAt, // DB `createdAt` maps to domain `recordedAt`
      version: 1, // Defaulting version as it's not in the Prisma model
    };

    return FamilyLegalEvent.createFromProps(props);
  }

  /**
   * Converts a FamilyLegalEvent domain entity into a Prisma-compatible data structure.
   * This method "flattens" the entity for persistence.
   * @param entity The FamilyLegalEvent entity instance.
   * @returns An object compatible with Prisma's `create` data input.
   */
  toPersistence(entity: FamilyLegalEvent): Prisma.FamilyLegalEventUncheckedCreateInput {
    const props = entity.toJSON();

    // To ensure no data loss, we embed the domain's `occurredAt` field
    // into the metadata JSON blob before persisting.
    const metadataWithOccurredAt = {
      ...props.metadata,
      occurredAt: props.occurredAt.toISOString(),
    };

    return {
      id: props.id,
      familyId: props.familyId,
      eventType: props.eventType,
      description: props.description,
      metadata: metadataWithOccurredAt,
      relatedUserId: props.relatedUserId,
      relatedEstateId: props.relatedEstateId,
      relatedCaseId: props.relatedCaseId,
      recordedBy: props.recordedBy,
      createdAt: props.recordedAt, // Domain `recordedAt` maps to DB `createdAt`
    };
  }
}
