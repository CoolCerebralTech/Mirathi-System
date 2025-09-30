import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService, Will, BeneficiaryAssignment } from '@shamba/database';

@Injectable()
export class WillsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.WillCreateInput): Promise<Will> {
    return this.prisma.will.create({ data });
  }

  async findOneOrFail(where: Prisma.WillWhereUniqueInput): Promise<Will & { beneficiaryAssignments: BeneficiaryAssignment[] }> {
    const will = await this.prisma.will.findUnique({
      where,
      include: { beneficiaryAssignments: true },
    });
    if (!will) {
      throw new NotFoundException('Will not found.');
    }
    return will;
  }
  
  async findMany(where: Prisma.WillWhereInput): Promise<Will[]> {
      return this.prisma.will.findMany({ where });
  }

  async update(id: string, data: Prisma.WillUpdateInput): Promise<Will> {
    return this.prisma.will.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Will> {
    // We rely on a transaction in the *service* layer to delete related assignments first.
    return this.prisma.will.delete({ where: { id } });
  }
  
  // --- Beneficiary Assignment Methods ---

  async addAssignment(data: Prisma.BeneficiaryAssignmentCreateInput): Promise<BeneficiaryAssignment> {
      return this.prisma.beneficiaryAssignment.create({ data });
  }
  
  async removeAssignment(where: Prisma.BeneficiaryAssignmentWhereUniqueInput): Promise<BeneficiaryAssignment> {
      return this.prisma.beneficiaryAssignment.delete({ where });
  }
  
  async findAssignments(where: Prisma.BeneficiaryAssignmentWhereInput): Promise<BeneficiaryAssignment[]> {
      return this.prisma.beneficiaryAssignment.findMany({ where });
  }
}