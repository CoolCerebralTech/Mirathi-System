// succession-service/src/family-tree/infrastructure/persistence/repositories/family-member.prisma-repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { FamilyMemberRepositoryInterface } from '../../../domain/interfaces/family-member.repository.interface';
import { FamilyMember } from '../../../domain/entities/family-member.entity';
import { FamilyMemberMapper } from '../mappers/family-member.mapper';

@Injectable()
export class FamilyMemberPrismaRepository implements FamilyMemberRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // BASIC PERSISTENCE
  // --------------------------------------------------------------------------

  async save(member: FamilyMember): Promise<void> {
    const persistenceModel = FamilyMemberMapper.toPersistence(member);

    await this.prisma.familyMember.upsert({
      where: { id: persistenceModel.id },
      create: persistenceModel,
      update: persistenceModel,
    });
  }

  async saveMany(members: FamilyMember[]): Promise<void> {
    if (members.length === 0) return;

    const persistenceModels = members.map(FamilyMemberMapper.toPersistence);

    // Use transaction to ensure atomicity of bulk operations
    await this.prisma.$transaction(
      persistenceModels.map((model) =>
        this.prisma.familyMember.upsert({
          where: { id: model.id },
          create: model,
          update: model,
        }),
      ),
    );
  }

  async findById(id: string): Promise<FamilyMember | null> {
    const raw = await this.prisma.familyMember.findUnique({
      where: { id },
    });
    return raw ? FamilyMemberMapper.toDomain(raw) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.familyMember.delete({
      where: { id },
    });
  }

  // --------------------------------------------------------------------------
  // GRAPH QUERIES
  // --------------------------------------------------------------------------

  async findByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const rawMembers = await this.prisma.familyMember.findMany({
      where: { familyId, deletedAt: null },
      orderBy: { createdAt: 'asc' }, // oldest members first usually helps tree building
    });
    return rawMembers.map(FamilyMemberMapper.toDomain);
  }

  async findByUserId(userId: string): Promise<FamilyMember | null> {
    // Find the node linked to this system user.
    // Note: If a user is in multiple families, this finds the FIRST instance.
    // Context-aware lookups should use findByFamilyId filters.
    const raw = await this.prisma.familyMember.findFirst({
      where: { userId, deletedAt: null },
    });
    return raw ? FamilyMemberMapper.toDomain(raw) : null;
  }

  async findMinors(familyId: string): Promise<FamilyMember[]> {
    const rawMembers = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isMinor: true,
        deletedAt: null,
      },
    });
    return rawMembers.map(FamilyMemberMapper.toDomain);
  }

  async findDeceased(familyId: string): Promise<FamilyMember[]> {
    const rawMembers = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isDeceased: true,
        deletedAt: null,
      },
    });
    return rawMembers.map(FamilyMemberMapper.toDomain);
  }

  // --------------------------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------------------------

  async countByFamilyId(familyId: string): Promise<number> {
    return this.prisma.familyMember.count({
      where: { familyId, deletedAt: null },
    });
  }
}