import { Injectable, Logger } from '@nestjs/common';
import { Prisma, CohabitationRecord as PrismaCohabitationRecord } from '@prisma/client';

import {
  CohabitationRecord,
  CohabitationRecordProps,
} from '../../../domain/entities/cohabitation-record.entity';

@Injectable()
export class CohabitationRecordMapper {
  private readonly logger = new Logger(CohabitationRecordMapper.name);

  /**
   * Converts a raw Prisma CohabitationRecord into a CohabitationRecord domain entity.
   */
  toDomain(raw: PrismaCohabitationRecord | null): CohabitationRecord | null {
    if (!raw) {
      return null;
    }

    try {
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
        // FIX: Map the actual version from DB to maintain concurrency control
        version: raw.version,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };

      return CohabitationRecord.createFromProps(props);
    } catch (error) {
      this.logger.error(`Failed to reconstitute CohabitationRecord ${raw?.id}`, error.stack);
      throw new Error(`Data integrity error for CohabitationRecord ${raw?.id}: ${error.message}`);
    }
  }

  /**
   * Converts a CohabitationRecord domain entity into a Prisma-compatible data structure.
   */
  toPersistence(entity: CohabitationRecord): Prisma.CohabitationRecordUncheckedCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      familyId: props.familyId,
      partner1Id: props.partner1Id,
      partner2Id: props.partner2Id,
      startDate: props.startDate,
      endDate: props.endDate ?? null,
      durationYears: props.durationYears,
      isAcknowledged: props.isAcknowledged,
      hasChildren: props.hasChildren,
      childrenCount: props.childrenCount,
      isRegistered: props.isRegistered,
      rejectionReason: props.rejectionReason ?? null,
      // FIX: Persist the version so increments in the domain are saved to DB
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Helper for updates (excludes ID and createdAt)
   */
  toPrismaUpdate(entity: CohabitationRecord): Prisma.CohabitationRecordUncheckedUpdateInput {
    const props = entity.toJSON();

    return {
      endDate: props.endDate ?? null,
      durationYears: props.durationYears,
      isAcknowledged: props.isAcknowledged,
      hasChildren: props.hasChildren,
      childrenCount: props.childrenCount,
      isRegistered: props.isRegistered,
      rejectionReason: props.rejectionReason ?? null,
      version: props.version,
      updatedAt: props.updatedAt,
    };
  }
}
