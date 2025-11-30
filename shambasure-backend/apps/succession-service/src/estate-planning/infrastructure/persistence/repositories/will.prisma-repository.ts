import { Injectable } from '@nestjs/common';
import { Prisma, WillStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { WillAggregate } from '../../../domain/aggregates/will.aggregate';
import { WillRepositoryInterface } from '../../../domain/interfaces/will.repository.interface';
import { WillMapper } from '../mappers/will.mapper';

@Injectable()
export class WillPrismaRepository implements WillRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(aggregate: WillAggregate): Promise<void> {
    const persistenceData = WillMapper.toPersistence(aggregate);

    await this.prisma.$transaction(async (tx) => {
      await tx.will.upsert({
        where: { id: aggregate.getWill().id },
        create: persistenceData,
        update: WillMapper.toUpdatePersistence(aggregate),
      });

      // TODO: Handle child entity updates (executors, witnesses, beneficiaries)
      // This would require additional transaction logic for the full aggregate
    });
  }

  async findById(id: string): Promise<WillAggregate | null> {
    const record = await this.prisma.will.findUnique({
      where: { id, deletedAt: null },
      include: {
        // Include beneficiary assignments with their related assets
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } }, // Only include non-deleted assets
          include: {
            asset: true,
            familyMember: true,
            beneficiary: true,
          },
        },
        executors: true,
        witnesses: {
          include: {
            identityDocuments: true,
          },
        },
        disputes: {
          where: {
            status: { in: ['FILED', 'UNDER_REVIEW', 'MEDIATION', 'COURT_PROCEEDING'] },
          },
        },
      },
    });

    if (!record) return null;

    // Extract assets from beneficiary assignments
    const assets = record.beneficiaryAssignments
      .map((assignment) => assignment.asset)
      .filter((asset) => asset !== null);

    return WillMapper.toDomain({
      ...record,
      assets,
      beneficiaries: record.beneficiaryAssignments,
      executors: record.executors,
      witnesses: record.witnesses,
    });
  }

  async findByTestatorId(testatorId: string): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: {
        testatorId,
        deletedAt: null,
        isActiveRecord: true,
      },
      orderBy: { willDate: 'desc' },
      include: {
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } },
          include: {
            asset: true,
          },
        },
        executors: true,
        witnesses: true,
      },
    });

    return records.map((record) => {
      const assets = record.beneficiaryAssignments
        .map((assignment) => assignment.asset)
        .filter((asset) => asset !== null);

      return WillMapper.toDomain({
        ...record,
        assets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.will.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.will.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.will.update({
      where: { id },
      data: {
        isActiveRecord: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // ---------------------------------------------------------
  // DOMAIN-SPECIFIC LOOKUP OPERATIONS
  // ---------------------------------------------------------

  async findByStatus(status: WillStatus): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: {
        status,
        deletedAt: null,
        isActiveRecord: true,
      },
      include: {
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } },
          include: {
            asset: true,
          },
        },
        executors: true,
        witnesses: true,
      },
    });

    return records.map((record) => {
      const assets = record.beneficiaryAssignments
        .map((assignment) => assignment.asset)
        .filter((asset) => asset !== null);

      return WillMapper.toDomain({
        ...record,
        assets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  async findActiveWillByTestatorId(testatorId: string): Promise<WillAggregate | null> {
    const record = await this.prisma.will.findFirst({
      where: {
        testatorId,
        status: WillStatus.ACTIVE,
        deletedAt: null,
        isActiveRecord: true,
      },
      include: {
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } },
          include: {
            asset: true,
          },
        },
        executors: true,
        witnesses: true,
      },
    });

    if (!record) return null;

    const assets = record.beneficiaryAssignments
      .map((assignment) => assignment.asset)
      .filter((asset) => asset !== null);

    return WillMapper.toDomain({
      ...record,
      assets,
      beneficiaries: record.beneficiaryAssignments,
      executors: record.executors,
      witnesses: record.witnesses,
    });
  }

  async findSupersededWills(originalWillId: string): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: {
        supersedes: originalWillId,
        deletedAt: null,
      },
      include: {
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } },
          include: {
            asset: true,
          },
        },
        executors: true,
        witnesses: true,
      },
    });

    return records.map((record) => {
      const assets = record.beneficiaryAssignments
        .map((assignment) => assignment.asset)
        .filter((asset) => asset !== null);

      return WillMapper.toDomain({
        ...record,
        assets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  async findContestedWills(): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: {
        deletedAt: null,
        isActiveRecord: true,
        disputes: {
          some: {
            status: { in: ['FILED', 'UNDER_REVIEW', 'MEDIATION', 'COURT_PROCEEDING'] },
          },
        },
      },
      include: {
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } },
          include: {
            asset: true,
          },
        },
        executors: true,
        witnesses: true,
        disputes: true,
      },
    });

    return records.map((record) => {
      const assets = record.beneficiaryAssignments
        .map((assignment) => assignment.asset)
        .filter((asset) => asset !== null);

      return WillMapper.toDomain({
        ...record,
        assets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  // ---------------------------------------------------------
  // WORKFLOW & LIFECYCLE QUERIES
  // ---------------------------------------------------------

  async findWillsRequiringWitnesses(): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: {
        status: { in: [WillStatus.DRAFT, WillStatus.PENDING_WITNESS] },
        requiresWitnesses: true,
        hasAllWitnesses: false,
        deletedAt: null,
        isActiveRecord: true,
      },
      include: {
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } },
          include: {
            asset: true,
          },
        },
        executors: true,
        witnesses: true,
      },
    });

    return records.map((record) => {
      const assets = record.beneficiaryAssignments
        .map((assignment) => assignment.asset)
        .filter((asset) => asset !== null);

      return WillMapper.toDomain({
        ...record,
        assets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  async findWillsPendingActivation(): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: {
        status: WillStatus.WITNESSED,
        deletedAt: null,
        isActiveRecord: true,
      },
      include: {
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } },
          include: {
            asset: true,
          },
        },
        executors: true,
        witnesses: true,
      },
    });

    return records.map((record) => {
      const assets = record.beneficiaryAssignments
        .map((assignment) => assignment.asset)
        .filter((asset) => asset !== null);

      return WillMapper.toDomain({
        ...record,
        assets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  async findWillsReadyForProbate(): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: {
        status: WillStatus.ACTIVE,
        grantOfProbateIssued: false,
        deletedAt: null,
        isActiveRecord: true,
        // Additional Kenyan probate readiness criteria
        legalCapacityStatus: 'ASSESSED_COMPETENT',
        hasTestatorSignature: true,
        signatureWitnessed: true,
        meetsKenyanFormalities: true,
      },
      include: {
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } },
          include: {
            asset: true,
          },
        },
        executors: {
          where: {
            status: { in: ['NOMINATED', 'ACTIVE'] },
            eligibilityStatus: 'ELIGIBLE',
          },
        },
        witnesses: {
          where: {
            status: { in: ['SIGNED', 'VERIFIED'] },
          },
        },
      },
    });

    return records.map((record) => {
      const assets = record.beneficiaryAssignments
        .map((assignment) => assignment.asset)
        .filter((asset) => asset !== null);

      return WillMapper.toDomain({
        ...record,
        assets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  // ---------------------------------------------------------
  // VERSIONING & AUDIT TRAIL OPERATIONS
  // ---------------------------------------------------------

  async saveVersion(
    willId: string,
    versionNumber: number,
    versionData: Record<string, any>,
  ): Promise<void> {
    await this.prisma.willVersion.create({
      data: {
        willId,
        versionNumber,
        snapshot: versionData as Prisma.InputJsonValue,
        changeLog: `Version ${versionNumber} saved`,
        changedBy: 'SYSTEM',
        isLegallySignificant: false,
      },
    });
  }

  async findVersions(willId: string): Promise<{ version: number; data: any; createdAt: Date }[]> {
    const versions = await this.prisma.willVersion.findMany({
      where: { willId },
      orderBy: { versionNumber: 'desc' },
    });

    return versions.map((v) => ({
      version: v.versionNumber,
      data: v.snapshot,
      createdAt: v.createdAt,
    }));
  }

  // ---------------------------------------------------------
  // ANALYTICS & BULK OPERATION QUERIES
  // ---------------------------------------------------------

  async countByTestatorId(testatorId: string): Promise<number> {
    return this.prisma.will.count({
      where: {
        testatorId,
        deletedAt: null,
        isActiveRecord: true,
      },
    });
  }

  async findRecentWills(days: number): Promise<WillAggregate[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);

    const records = await this.prisma.will.findMany({
      where: {
        updatedAt: { gte: thresholdDate },
        deletedAt: null,
        isActiveRecord: true,
      },
      include: {
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } },
          include: {
            asset: true,
          },
        },
        executors: true,
        witnesses: true,
      },
    });

    return records.map((record) => {
      const assets = record.beneficiaryAssignments
        .map((assignment) => assignment.asset)
        .filter((asset) => asset !== null);

      return WillMapper.toDomain({
        ...record,
        assets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  // ---------------------------------------------------------
  // ADDITIONAL KENYAN LEGAL QUERIES
  // ---------------------------------------------------------

  async findWillsWithDependantProvision(): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: {
        hasDependantProvision: true,
        deletedAt: null,
        isActiveRecord: true,
      },
      include: {
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } },
          include: {
            asset: true,
          },
        },
        executors: true,
        witnesses: true,
      },
    });

    return records.map((record) => {
      const assets = record.beneficiaryAssignments
        .map((assignment) => assignment.asset)
        .filter((asset) => asset !== null);

      return WillMapper.toDomain({
        ...record,
        assets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }

  async findRevokedWillsByTestator(testatorId: string): Promise<WillAggregate[]> {
    const records = await this.prisma.will.findMany({
      where: {
        testatorId,
        isRevoked: true,
        deletedAt: null,
      },
      include: {
        beneficiaryAssignments: {
          where: { asset: { deletedAt: null } },
          include: {
            asset: true,
          },
        },
        executors: true,
        witnesses: true,
      },
    });

    return records.map((record) => {
      const assets = record.beneficiaryAssignments
        .map((assignment) => assignment.asset)
        .filter((asset) => asset !== null);

      return WillMapper.toDomain({
        ...record,
        assets,
        beneficiaries: record.beneficiaryAssignments,
        executors: record.executors,
        witnesses: record.witnesses,
      });
    });
  }
}
