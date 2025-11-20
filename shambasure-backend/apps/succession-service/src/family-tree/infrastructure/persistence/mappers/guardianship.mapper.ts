import { Guardian as PrismaGuardian } from '@prisma/client';
import { Guardianship } from '../../../domain/entities/guardianship.entity';

export class GuardianshipMapper {
  /**
   * Domain -> Database
   */
  static toPersistence(domain: Guardianship): PrismaGuardian {
    return {
      id: domain.getId(),
      // Note: Schema calls this 'guardianId' (the person acting)
      guardianId: domain.getGuardianId(),
      wardId: domain.getWardId(),

      type: domain.getType(),
      appointedBy: domain.getAppointedBy() || null,

      // Dates
      appointmentDate: (domain as any).appointmentDate || new Date(),
      validUntil: domain.getValidUntil(),

      isActive: domain.getIsActiveRecord(),
      notes: (domain as any).notes || null,

      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as PrismaGuardian;
  }

  /**
   * Database -> Domain
   */
  static toDomain(raw: PrismaGuardian): Guardianship {
    return Guardianship.reconstitute({
      id: raw.id,
      guardianId: raw.guardianId,
      wardId: raw.wardId,
      type: raw.type,
      appointedBy: raw.appointedBy,

      appointmentDate: raw.appointmentDate,
      validUntil: raw.validUntil,

      isActive: raw.isActive,
      notes: raw.notes,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
