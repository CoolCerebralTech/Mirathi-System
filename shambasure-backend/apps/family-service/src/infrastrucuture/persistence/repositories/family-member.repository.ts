import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { FamilyMember } from '../../../domain/entities/family-member.entity';
import {
  FamilyMemberQueryCriteria,
  IFamilyMemberRepository,
} from '../../../domain/interfaces/repositories/ifamily-member.repository';
import { FamilyMemberMapper } from '../mappers/family-member.mapper';

// This type allows us to use the regular Prisma client or a transactional client.
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class FamilyMemberRepository implements IFamilyMemberRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memberMapper: FamilyMemberMapper,
  ) {}

  async findById(id: string): Promise<FamilyMember | null> {
    const member = await this.prisma.familyMember.findUnique({
      where: { id },
    });
    return this.memberMapper.toDomain(member);
  }

  async findByNationalId(nationalId: string): Promise<FamilyMember | null> {
    const member = await this.prisma.familyMember.findUnique({
      where: { nationalId },
    });
    return this.memberMapper.toDomain(member);
  }

  async findByUserId(userId: string): Promise<FamilyMember | null> {
    const member = await this.prisma.familyMember.findUnique({
      where: { userId },
    });
    return this.memberMapper.toDomain(member);
  }

  async findAll(criteria: FamilyMemberQueryCriteria): Promise<FamilyMember[]> {
    const where: Prisma.FamilyMemberWhereInput = {};

    if (criteria.familyId) {
      where.familyId = criteria.familyId;
    }
    if (criteria.isDeceased !== undefined) {
      where.isDeceased = criteria.isDeceased;
    }
    if (criteria.isMinor !== undefined) {
      where.isMinor = criteria.isMinor;
    }
    if (criteria.hasDisability !== undefined) {
      where.disabilityStatus = criteria.hasDisability ? { not: null } : null;
    }
    if (criteria.isMissing !== undefined) {
      where.missingSince = criteria.isMissing ? { not: null } : null;
    }

    const members = await this.prisma.familyMember.findMany({ where });

    return members
      .map((member) => this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async save(member: FamilyMember, tx?: TransactionClient): Promise<FamilyMember> {
    const prismaClient = tx || this.prisma;
    const persistenceData = this.memberMapper.toPersistence(member);

    const { id, ...updateData } = persistenceData;

    const savedMember = await prismaClient.familyMember.upsert({
      where: { id },
      create: persistenceData,
      update: updateData,
    });

    return this.memberMapper.toDomain(savedMember)!;
  }

  async saveMany(members: FamilyMember[]): Promise<void> {
    const persistenceData = members.map(this.memberMapper.toPersistence);

    // Use a transaction to ensure all members are saved or none are.
    await this.prisma.$transaction(
      persistenceData.map((data) => {
        const { id, ...updateData } = data;
        return this.prisma.familyMember.upsert({
          where: { id },
          create: data,
          update: updateData,
        });
      }),
    );
  }

  async delete(id: string, tx?: TransactionClient): Promise<void> {
    const prismaClient = tx || this.prisma;
    // In this domain, deleting a member should almost always be a soft delete
    // for historical and legal integrity. We implement it as such.
    await prismaClient.familyMember.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isArchived: true,
        deletionReason: 'DELETED_BY_SYSTEM',
      },
    });
  }
}
