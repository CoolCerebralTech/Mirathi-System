import { Injectable } from '@nestjs/common';
import { Prisma, CohabitationRecord as PrismaCohabitationRecord } from '@prisma/client';

import {
  CohabitationRecord,
  CohabitationRecordProps,
} from '../../../domain/entities/cohabitation-record.entity';

@Injectable()
export class CohabitationRecordMapper {
  /**
   * Converts a raw Prisma CohabitationRecord into a CohabitationRecord domain entity.
   * This method reconstitutes the entity from database data.
   * @param raw The raw data from Prisma.
   * @returns A CohabitationRecord entity instance, or null if raw is null.
   */
  toDomain(raw: PrismaCohabitationRecord | null): CohabitationRecord | null {
    if (!raw) {
      return null;
    }

    // Assemble the props required by the entity's reconstitution factory method.
    // The Prisma schema does not include a 'version' field, so we default it.
    const props: CohabitationRecordProps = {
      id: raw.id,
      familyId: raw.familyId,
      partner1Id: raw.partner1Id,
      partner2Id: raw.partner2Id,
      startDate: raw.startDate,
      endDate: raw.endDate ?? undefined,
      durationYears: raw.durationYears,
      isAcknowledged: raw.isAcknowledged,
      hasChildren: raw.hasChildren,
      childrenCount: raw.childrenCount,
      isRegistered: raw.isRegistered,
      rejectionReason: raw.rejectionReason ?? undefined,
      version: 1, // Defaulting version as it's not in the Prisma model
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    // Use the correct factory method for reconstituting an existing entity.
    return CohabitationRecord.createFromProps(props);
  }

  /**
   * Converts a CohabitationRecord domain entity into a Prisma-compatible data structure.
   * This method "flattens" the entity for persistence.
   * @param entity The CohabitationRecord entity instance.
   * @returns An object compatible with Prisma's `create` or `update` data input.
   */
  toPersistence(entity: CohabitationRecord): Prisma.CohabitationRecordUncheckedCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      familyId: props.familyId,
      partner1Id: props.partner1Id,
      partner2Id: props.partner2Id,
      startDate: props.startDate,
      endDate: props.endDate,
      durationYears: props.durationYears,
      isAcknowledged: props.isAcknowledged,
      hasChildren: props.hasChildren,
      childrenCount: props.childrenCount,
      isRegistered: props.isRegistered,
      rejectionReason: props.rejectionReason,
      // Note: The 'version' domain property is not persisted as it's not in the schema.
      // If you add it for optimistic concurrency, you would map it here:
      // version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
