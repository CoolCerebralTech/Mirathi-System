import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { FamilyRepositoryInterface } from '../../../domain/interfaces/family.repository.interface';
import { Family } from '../../../domain/entities/family.entity';
import { FamilyMapper } from '../mappers/family.mapper';

@Injectable()
export class FamilyPrismaRepository implements FamilyRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // BASIC PERSISTENCE
  // --------------------------------------------------------------------------

  async save(family: Family): Promise<void> {
    const persistenceModel = FamilyMapper.toPersistence(family);

    await this.prisma.family.upsert({
      where: { id: persistenceModel.id },
      create: persistenceModel,
      update: persistenceModel,
    });
  }

  async findById(id: string): Promise<Family | null> {
    const raw = await this.prisma.family.findUnique({
      where: { id },
    });
    return raw ? FamilyMapper.toDomain(raw) : null;
  }

  async delete(id: string): Promise<void> {
    // Hard delete (Cascade usually handles members, but strict logic depends on DB FKs)
    await this.prisma.family.delete({
      where: { id },
    });
  }

  // --------------------------------------------------------------------------
  // DOMAIN LOOKUPS
  // --------------------------------------------------------------------------

  async findByOwnerId(ownerId: string): Promise<Family[]> {
    const rawFamilies = await this.prisma.family.findMany({
      where: { creatorId: ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rawFamilies.map(FamilyMapper.toDomain);
  }

  async findByName(ownerId: string, name: string): Promise<Family | null> {
    const raw = await this.prisma.family.findFirst({
      where: {
        creatorId: ownerId,
        name: name,
        deletedAt: null,
      },
    });
    return raw ? FamilyMapper.toDomain(raw) : null;
  }
}