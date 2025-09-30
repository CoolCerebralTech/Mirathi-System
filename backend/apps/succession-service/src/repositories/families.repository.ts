import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService, Family, FamilyMember } from '@shamba/database';

@Injectable()
export class FamiliesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.FamilyCreateInput): Promise<Family> {
    return this.prisma.family.create({ data });
  }

  async findOneOrFail(where: Prisma.FamilyWhereUniqueInput): Promise<Family & { members: FamilyMember[] }> {
    const family = await this.prisma.family.findUnique({
      where,
      include: { members: true },
    });
    if (!family) {
      throw new NotFoundException('Family not found.');
    }
    return family;
  }
  
  async findManyByMember(userId: string): Promise<Family[]> {
      return this.prisma.family.findMany({
          where: { members: { some: { userId } } }
      });
  }

  async addMember(data: Prisma.FamilyMemberUncheckedCreateInput): Promise<FamilyMember> {
    return this.prisma.familyMember.create({ data });
  }

  async removeMember(where: Prisma.FamilyMemberWhereUniqueInput): Promise<FamilyMember> {
    return this.prisma.familyMember.delete({ where });
  }

  async updateMember(
    where: Prisma.FamilyMemberWhereUniqueInput,
    data: Prisma.FamilyMemberUpdateInput,
  ): Promise<FamilyMember> {
    return this.prisma.familyMember.update({ where, data });
  }
}