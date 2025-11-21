// succession-service/src/family-tree/infrastructure/persistence/repositories/marriage.prisma-repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { MarriageRepositoryInterface } from '../../../domain/interfaces/marriage.repository.interface';
import { Marriage } from '../../../domain/entities/marriage.entity';
import { MarriageMapper } from '../mappers/marriage.mapper';

@Injectable()
export class MarriagePrismaRepository implements MarriageRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // BASIC PERSISTENCE
  // --------------------------------------------------------------------------

  async save(marriage: Marriage): Promise<void> {
    const persistenceModel = MarriageMapper.toPersistence(marriage);

    await this.prisma.marriage.upsert({
      where: { id: persistenceModel.id },
      create: persistenceModel,
      update: persistenceModel,
    });
  }

  async findById(id: string): Promise<Marriage | null> {
    const raw = await this.prisma.marriage.findUnique({
      where: { id },
    });
    return raw ? MarriageMapper.toDomain(raw) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.marriage.delete({
      where: { id },
    });
  }

  // --------------------------------------------------------------------------
  // DOMAIN LOOKUPS
  // --------------------------------------------------------------------------

  async findByFamilyId(familyId: string): Promise<Marriage[]> {
    const raw = await this.prisma.marriage.findMany({
      where: { familyId },
    });
    return raw.map(MarriageMapper.toDomain);
  }

  async findByMemberId(memberId: string): Promise<Marriage[]> {
    // Find where member is Spouse 1 OR Spouse 2
    const raw = await this.prisma.marriage.findMany({
      where: {
        OR: [
          { spouse1Id: memberId },
          { spouse2Id: memberId },
        ],
      },
    });
    return raw.map(MarriageMapper.toDomain);
  }

  async findActiveBetween(spouse1Id: string, spouse2Id: string): Promise<Marriage | null> {
    // Check both directional combinations for an Active marriage
    const raw = await this.prisma.marriage.findFirst({
      where: {
        isActive: true,
        OR: [
          { spouse1Id: spouse1Id, spouse2Id: spouse2Id },
          { spouse1Id: spouse2Id, spouse2Id: spouse1Id },
        ],
      },
    });
    return raw ? MarriageMapper.toDomain(raw) : null;
  }

  async findActiveMarriages(memberId: string): Promise<Marriage[]> {
    const raw = await this.prisma.marriage.findMany({
      where: {
        isActive: true,
        OR: [
          { spouse1Id: memberId },
          { spouse2Id: memberId },
        ],
      },
    });
    return raw.map(MarriageMapper.toDomain);
  }
}