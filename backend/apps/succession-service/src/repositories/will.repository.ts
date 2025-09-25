import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { WillEntity, BeneficiaryAssignmentEntity } from '../entities/will.entity';
import { CreateWillDto, UpdateWillDto, WillStatus } from '@shamba/common';

@Injectable()
export class WillRepository {
  constructor(private prisma: PrismaService) {}

  async create(testatorId: string, createWillDto: CreateWillDto): Promise<WillEntity> {
    const will = await this.prisma.will.create({
      data: {
        ...createWillDto,
        testatorId,
      },
      include: {
        testator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        beneficiaryAssignments: {
          include: {
            asset: true,
            beneficiary: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return new WillEntity(will);
  }

  async findById(id: string): Promise<WillEntity> {
    const will = await this.prisma.will.findUnique({
      where: { id },
      include: {
        testator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        beneficiaryAssignments: {
          include: {
            asset: true,
            beneficiary: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!will) {
      throw new NotFoundException(`Will with ID ${id} not found`);
    }

    return new WillEntity(will);
  }

  async findByTestatorId(testatorId: string): Promise<WillEntity[]> {
    const wills = await this.prisma.will.findMany({
      where: { testatorId },
      include: {
        beneficiaryAssignments: {
          include: {
            asset: true,
            beneficiary: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return wills.map(will => new WillEntity(will));
  }

  async update(id: string, updateWillDto: UpdateWillDto): Promise<WillEntity> {
    await this.findById(id); // Verify will exists

    const will = await this.prisma.will.update({
      where: { id },
      data: updateWillDto,
      include: {
        testator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        beneficiaryAssignments: {
          include: {
            asset: true,
            beneficiary: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return new WillEntity(will);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id); // Verify will exists

    await this.prisma.$transaction(async (tx) => {
      // Delete beneficiary assignments first
      await tx.beneficiaryAssignment.deleteMany({
        where: { willId: id },
      });

      // Then delete will
      await tx.will.delete({
        where: { id },
      });
    });
  }

  async activateWill(id: string): Promise<WillEntity> {
    const will = await this.findById(id);
    
    if (will.status !== WillStatus.DRAFT) {
      throw new ConflictException('Only draft wills can be activated');
    }

    // Validate will before activation
    const validation = will.validateForActivation();
    if (!validation.isValid) {
      throw new ConflictException(`Will cannot be activated: ${validation.errors.join(', ')}`);
    }

    return this.update(id, { status: WillStatus.ACTIVE });
  }

  async revokeWill(id: string): Promise<WillEntity> {
    const will = await this.findById(id);
    
    if (will.status !== WillStatus.ACTIVE) {
      throw new ConflictException('Only active wills can be revoked');
    }

    return this.update(id, { status: WillStatus.REVOKED });
  }

  async addBeneficiaryAssignment(
    willId: string,
    assetId: string,
    beneficiaryId: string,
    sharePercent?: number,
  ): Promise<BeneficiaryAssignmentEntity> {
    await this.findById(willId); // Verify will exists

    try {
      const assignment = await this.prisma.beneficiaryAssignment.create({
        data: {
          willId,
          assetId,
          beneficiaryId,
          sharePercent,
        },
        include: {
          will: true,
          asset: true,
          beneficiary: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return new BeneficiaryAssignmentEntity(assignment);
    } catch (error) {
      if (error.code === 'P2002') { // Unique constraint violation
        throw new ConflictException('Beneficiary assignment already exists for this asset');
      }
      throw error;
    }
  }

  async removeBeneficiaryAssignment(assignmentId: string): Promise<void> {
    const assignment = await this.prisma.beneficiaryAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Beneficiary assignment not found');
    }

    await this.prisma.beneficiaryAssignment.delete({
      where: { id: assignmentId },
    });
  }

  async getWillStats(testatorId: string): Promise<{
    totalWills: number;
    activeWills: number;
    draftWills: number;
    revokedWills: number;
    totalAssets: number;
    totalBeneficiaries: number;
  }> {
    const wills = await this.findByTestatorId(testatorId);
    
    const totalWills = wills.length;
    const activeWills = wills.filter(w => w.status === WillStatus.ACTIVE).length;
    const draftWills = wills.filter(w => w.status === WillStatus.DRAFT).length;
    const revokedWills = wills.filter(w => w.status === WillStatus.REVOKED).length;

    // Get unique assets and beneficiaries across all wills
    const allAssets = new Set<string>();
    const allBeneficiaries = new Set<string>();

    wills.forEach(will => {
      will.beneficiaryAssignments?.forEach(assignment => {
        allAssets.add(assignment.assetId);
        allBeneficiaries.add(assignment.beneficiaryId);
      });
    });

    return {
      totalWills,
      activeWills,
      draftWills,
      revokedWills,
      totalAssets: allAssets.size,
      totalBeneficiaries: allBeneficiaries.size,
    };
  }
}