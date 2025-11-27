import { Guardian as PrismaGuardian } from '@prisma/client';
import {
  Guardianship,
  KenyanGuardianshipMetadata,
} from '../../../domain/entities/guardianship.entity';

/**
 * GuardianshipMapper
 *
 * Transforms the Guardianship Aggregate Root between Domain and Persistence layers.
 * Handles metadata serialization for court orders and conditions.
 */
export class GuardianshipMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaGuardian & { ward?: { familyId: string } }): Guardianship {
    // 1. Construct Metadata
    // Since the schema provided earlier lacks a specific 'metadata' column on Guardian table,
    // we use defaults. If 'notes' contains JSON, we could parse it, but that is risky.
    const metadata: KenyanGuardianshipMetadata = {
      isTemporary: false,
      conditions: [],
      reportingRequirements: [],
      restrictedPowers: [],
      courtOrderNumber: undefined,
      courtName: undefined,
      caseNumber: undefined,
      reviewDate: undefined,
    };

    return Guardianship.reconstitute({
      id: raw.id,
      guardianId: raw.guardianId,
      wardId: raw.wardId,
      type: raw.type,

      appointmentDate: raw.appointmentDate,
      appointedBy: raw.appointedBy,
      validUntil: raw.validUntil,

      isActiveRecord: raw.isActive,
      notes: raw.notes,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,

      metadata: metadata,

      // If we loaded the relation (ward), we can set familyId.
      // Otherwise, the Entity logic might need to fetch it separately.
      familyId: raw.ward?.familyId || undefined,

      // wardDateOfBirth is not in the Guardian table.
      // The Entity Factory usually needs it, but Reconstitute handles nulls.
    });
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(entity: Guardianship): PrismaGuardian {
    // Note: familyId is not stored on the Guardian table (it is derived from ward).
    // Metadata is also not stored in the current schema (columns don't exist).

    return {
      id: entity.getId(),
      guardianId: entity.getGuardianId(),
      wardId: entity.getWardId(),
      type: entity.getType(),

      appointedBy: entity.getAppointedBy() || null,
      appointmentDate: entity.getAppointmentDate(),
      validUntil: entity.getValidUntil(),

      isActive: entity.getIsActiveRecord(),
      notes: entity.getNotes() || null,

      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    };
  }
}
