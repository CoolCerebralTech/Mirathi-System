// ============================================================================
// wills.repository.ts - Will Data Access Layer
// ============================================================================

import {
  Injectable as WillInjectable,
  NotFoundException as WillNotFoundException,
} from '@nestjs/common';
import {
  Prisma as WillPrisma,
  PrismaService as WillPrismaService,
  Will,
  BeneficiaryAssignment as Assignment,
  WillStatus,
} from '@shamba/database';

/**
 * WillsRepository - Pure data access for wills and beneficiary assignments
 *
 * RESPONSIBILITIES:
 * - CRUD operations for wills
 * - Manage beneficiary assignments
 * - Query wills by testator, status
 */
@WillInjectable()
export class WillsRepository {
  constructor(private readonly prisma: WillPrismaService) {}

  // ========================================================================
  // WILL OPERATIONS
  // ========================================================================

  async create(data: WillPrisma.WillCreateInput): Promise<Will> {
    return this.prisma.will.create({ data });
  }

  async findById(id: string): Promise<Will | null> {
    return this.prisma.will.findUnique({ where: { id } });
  }

  async findByIdWithAssignments(
    id: string,
  ): Promise<(Will & { beneficiaryAssignments: Assignment[] }) | null> {
    return this.prisma.will.findUnique({
      where: { id },
      include: { beneficiaryAssignments: true },
    });
  }

  async findOneOrFail(
    where: WillPrisma.WillWhereUniqueInput,
  ): Promise<Will & { beneficiaryAssignments: Assignment[] }> {
    const will = await this.prisma.will.findUnique({
      where,
      include: { beneficiaryAssignments: true },
    });
    if (!will) {
      const identifier = where.id || 'unknown';
      throw new WillNotFoundException(`Will with ID '${identifier}' not found`);
    }
    return will;
  }

  async findMany(where: WillPrisma.WillWhereInput): Promise<Will[]> {
    return this.prisma.will.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTestator(testatorId: string): Promise<Will[]> {
    return this.prisma.will.findMany({
      where: { testatorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTestatorAndStatus(testatorId: string, status: WillStatus): Promise<Will[]> {
    return this.prisma.will.findMany({
      where: { testatorId, status },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveWill(testatorId: string): Promise<Will | null> {
    return this.prisma.will.findFirst({
      where: { testatorId, status: WillStatus.ACTIVE },
    });
  }

  async update(id: string, data: WillPrisma.WillUpdateInput): Promise<Will> {
    return this.prisma.will.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: WillStatus): Promise<Will> {
    return this.prisma.will.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<Will> {
    // Cascading delete of assignments handled by Prisma schema
    return this.prisma.will.delete({ where: { id } });
  }

  // ========================================================================
  // BENEFICIARY ASSIGNMENT OPERATIONS
  // ========================================================================

  async addAssignment(data: WillPrisma.BeneficiaryAssignmentCreateInput): Promise<Assignment> {
    return this.prisma.beneficiaryAssignment.create({ data });
  }

  async findAssignmentById(id: string): Promise<Assignment | null> {
    return this.prisma.beneficiaryAssignment.findUnique({
      where: { id },
    });
  }

  async findAssignments(where: WillPrisma.BeneficiaryAssignmentWhereInput): Promise<Assignment[]> {
    return this.prisma.beneficiaryAssignment.findMany({ where });
  }

  async findAssignmentsByWill(willId: string): Promise<Assignment[]> {
    return this.prisma.beneficiaryAssignment.findMany({
      where: { willId },
    });
  }

  async findAssignmentsByAsset(assetId: string): Promise<Assignment[]> {
    return this.prisma.beneficiaryAssignment.findMany({
      where: { assetId },
    });
  }

  async findAssignmentsByBeneficiary(beneficiaryId: string): Promise<Assignment[]> {
    return this.prisma.beneficiaryAssignment.findMany({
      where: { beneficiaryId },
    });
  }

  async updateAssignment(
    id: string,
    data: WillPrisma.BeneficiaryAssignmentUpdateInput,
  ): Promise<Assignment> {
    return this.prisma.beneficiaryAssignment.update({
      where: { id },
      data,
    });
  }

  async removeAssignment(
    where: WillPrisma.BeneficiaryAssignmentWhereUniqueInput,
  ): Promise<Assignment> {
    return this.prisma.beneficiaryAssignment.delete({ where });
  }

  async removeAssignmentsByWill(willId: string): Promise<number> {
    const result = await this.prisma.beneficiaryAssignment.deleteMany({
      where: { willId },
    });
    return result.count;
  }

  async assignmentExists(willId: string, assetId: string, beneficiaryId: string): Promise<boolean> {
    const count = await this.prisma.beneficiaryAssignment.count({
      where: { willId, assetId, beneficiaryId },
    });
    return count > 0;
  }

  async getTotalShareForAsset(willId: string, assetId: string): Promise<number> {
    const assignments = await this.prisma.beneficiaryAssignment.findMany({
      where: { willId, assetId },
    });

    return assignments.reduce((total, assignment) => {
      return total + (assignment.sharePercent ? Number(assignment.sharePercent) : 0);
    }, 0);
  }
}
