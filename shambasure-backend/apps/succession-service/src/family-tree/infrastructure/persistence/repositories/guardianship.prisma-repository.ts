// succession-service/src/family-tree/infrastructure/persistence/repositories/guardianship.prisma-repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { GuardianshipRepositoryInterface } from '../../../domain/interfaces/guardianship.repository.interface';
import { Guardianship } from '../../../domain/entities/guardianship.entity';
import { GuardianshipMapper } from '../mappers/guardianship.mapper';

@Injectable()
export class GuardianshipPrismaRepository implements GuardianshipRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // BASIC PERSISTENCE
  // --------------------------------------------------------------------------

  async save(guardianship: Guardianship): Promise<void> {
    const persistenceModel = GuardianshipMapper.toPersistence(guardianship);

    await this.prisma.guardian.upsert({
      where: { id: persistenceModel.id },
      create: persistenceModel,
      update: persistenceModel,
    });
  }

  async findById(id: string): Promise<Guardianship | null> {
    const raw = await this.prisma.guardian.findUnique({
      where: { id },
    });
    return raw ? GuardianshipMapper.toDomain(raw) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.guardian.delete({
      where: { id },
    });
  }

  // --------------------------------------------------------------------------
  // DOMAIN LOOKUPS
  // --------------------------------------------------------------------------

  async findByWardId(wardId: string): Promise<Guardianship[]> {
    const raw = await this.prisma.guardian.findMany({
      where: { wardId },
    });
    return raw.map(GuardianshipMapper.toDomain);
  }

  async findByGuardianId(guardianId: string): Promise<Guardianship[]> {
    const raw = await this.prisma.guardian.findMany({
      where: { guardianId }, // Mapped correctly in schema
    });
    return raw.map(GuardianshipMapper.toDomain);
  }

  async findActiveByFamilyId(familyId: string): Promise<Guardianship[]> {
    // This requires a join to FamilyMember to filter by familyId
    // Prisma allows querying relations.
    const raw = await this.prisma.guardian.findMany({
      where: {
        ward: {
          familyId: familyId,
        },
        isActive: true,
        // Check logic: Valid until future date or null (indefinite)
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } }
        ]
      },
    });
    return raw.map(GuardianshipMapper.toDomain);
  }
}