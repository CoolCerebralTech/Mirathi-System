import { Injectable } from '@nestjs/common';
import { WitnessStatus, WitnessVerificationMethod } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Witness } from '../../../domain/entities/witness.entity';
import { WitnessRepositoryInterface } from '../../../domain/interfaces/witness.repository.interface';
import { WitnessMapper } from '../mappers/witness.mapper';

@Injectable()
export class WitnessPrismaRepository implements WitnessRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(witness: Witness): Promise<void> {
    const persistenceData = WitnessMapper.toPersistence(witness);

    await this.prisma.willWitness.upsert({
      where: { id: witness.id },
      create: persistenceData,
      update: WitnessMapper.toUpdatePersistence(witness),
    });
  }

  async findById(id: string): Promise<Witness | null> {
    const record = await this.prisma.willWitness.findUnique({
      where: { id },
      include: {
        will: {
          select: {
            id: true,
            title: true,
            status: true,
            isActiveRecord: true,
            deletedAt: true,
          },
        },
        identityDocuments: true,
      },
    });

    // Only return if will is active and not deleted
    if (!record || record.will.deletedAt || !record.will.isActiveRecord) {
      return null;
    }

    return WitnessMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.willWitness.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------
  // SCOPE & RELATIONSHIP LOOKUPS
  // ---------------------------------------------------------

  async findByWillId(willId: string): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        willId,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findByWitnessUserId(userId: string): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        witnessId: userId,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findByEmail(email: string): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findByIdNumber(idNumber: string): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        idNumber,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // STATUS & VERIFICATION QUERIES
  // ---------------------------------------------------------

  async findByStatus(willId: string, status: WitnessStatus): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        willId,
        status,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findPendingVerification(willId?: string): Promise<Witness[]> {
    const whereClause: any = {
      status: WitnessStatus.SIGNED,
      will: {
        deletedAt: null,
        isActiveRecord: true,
      },
    };

    if (willId) {
      whereClause.willId = willId;
    }

    const records = await this.prisma.willWitness.findMany({
      where: whereClause,
      orderBy: { signedAt: 'asc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findIneligibleWitnesses(willId: string): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        willId,
        eligibilityStatus: {
          in: [
            'INELIGIBLE_MINOR',
            'INELIGIBLE_BENEFICIARY',
            'INELIGIBLE_SPOUSE',
            'INELIGIBLE_EXECUTOR',
            'INELIGIBLE_RELATIONSHIP',
            'INELIGIBLE_MENTAL_CAPACITY',
            'INELIGIBLE_CRIMINAL_RECORD',
          ],
        },
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findProfessionalWitnesses(willId: string): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        willId,
        isProfessionalWitness: true,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // VALIDATION & INTEGRITY QUERIES
  // ---------------------------------------------------------

  async countValidWitnesses(willId: string): Promise<number> {
    const count = await this.prisma.willWitness.count({
      where: {
        willId,
        status: {
          in: [WitnessStatus.SIGNED, WitnessStatus.VERIFIED],
        },
        isEligible: true,
        hasConflictOfInterest: false,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
    });

    return count;
  }

  // ---------------------------------------------------------
  // BULK OPERATIONS
  // ---------------------------------------------------------

  async bulkUpdateStatus(
    witnessIds: string[],
    status: WitnessStatus,
    reason?: string,
  ): Promise<void> {
    if (witnessIds.length === 0) return;

    await this.prisma.willWitness.updateMany({
      where: {
        id: { in: witnessIds },
      },
      data: {
        status,
        ineligibilityReason: reason || undefined,
        updatedAt: new Date(),
      },
    });
  }

  // ---------------------------------------------------------
  // ADDITIONAL BUSINESS LOGIC QUERIES
  // ---------------------------------------------------------

  async findWitnessesWithConflicts(willId: string): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        willId,
        hasConflictOfInterest: true,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      include: {
        will: {
          select: {
            title: true,
            testatorId: true,
          },
        },
      },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findWitnessesPendingEligibilityCheck(): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        eligibilityStatus: 'PENDING_ELIGIBILITY_CHECK',
        status: { in: ['PENDING', 'SIGNED'] },
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findWitnessesRequiringReminder(daysSinceInvitation: number): Promise<Witness[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysSinceInvitation);

    const records = await this.prisma.willWitness.findMany({
      where: {
        status: WitnessStatus.PENDING,
        invitationSentAt: {
          lt: thresholdDate,
        },
        reminderSentAt: null, // No reminder sent yet
        will: {
          deletedAt: null,
          isActiveRecord: true,
          status: { in: ['DRAFT', 'PENDING_WITNESS'] }, // Only relevant for active wills
        },
      },
      include: {
        will: {
          select: {
            title: true,
            testatorId: true,
          },
        },
      },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  async findVerifiedWitnesses(willId: string): Promise<Witness[]> {
    return this.findByStatus(willId, WitnessStatus.VERIFIED);
  }

  async getWitnessStatistics(willId: string): Promise<{
    total: number;
    byStatus: Record<WitnessStatus, number>;
    byEligibility: Record<string, number>;
    professionalCount: number;
    verifiedCount: number;
    pendingCount: number;
  }> {
    // Get counts by status
    const statusGroups = await this.prisma.willWitness.groupBy({
      by: ['status'],
      where: {
        willId,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      _count: { _all: true },
    });

    // Get counts by eligibility
    const eligibilityGroups = await this.prisma.willWitness.groupBy({
      by: ['eligibilityStatus'],
      where: {
        willId,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      _count: { _all: true },
    });

    // Get professional count
    const professionalCount = await this.prisma.willWitness.count({
      where: {
        willId,
        isProfessionalWitness: true,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
    });

    // Get verified count
    const verifiedCount = await this.prisma.willWitness.count({
      where: {
        willId,
        status: WitnessStatus.VERIFIED,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
    });

    // Get pending count
    const pendingCount = await this.prisma.willWitness.count({
      where: {
        willId,
        status: WitnessStatus.PENDING,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
    });

    // Get total count
    const total = await this.prisma.willWitness.count({
      where: {
        willId,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
    });

    // Initialize result objects with all enum values set to 0
    const byStatus = Object.values(WitnessStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<WitnessStatus, number>,
    );

    const byEligibility: Record<string, number> = {};

    // Fill with actual data
    statusGroups.forEach((group) => {
      byStatus[group.status] = group._count._all;
    });

    eligibilityGroups.forEach((group) => {
      byEligibility[group.eligibilityStatus] = group._count._all;
    });

    return {
      total,
      byStatus,
      byEligibility,
      professionalCount,
      verifiedCount,
      pendingCount,
    };
  }

  async findWitnessesByVerificationMethod(method: WitnessVerificationMethod): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        verificationMethod: method,
        status: WitnessStatus.VERIFIED,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { verifiedAt: 'desc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // ENUM-SAFE UTILITY METHODS
  // ---------------------------------------------------------

  async findWitnessesByVerificationMethodString(method: string): Promise<Witness[]> {
    // Validate that the string is a valid WitnessVerificationMethod enum value
    const validMethods = Object.values(WitnessVerificationMethod);
    if (!validMethods.includes(method as WitnessVerificationMethod)) {
      throw new Error(`Invalid verification method: ${method}`);
    }

    return this.findWitnessesByVerificationMethod(method as WitnessVerificationMethod);
  }

  async findWitnessesByMultipleVerificationMethods(
    methods: WitnessVerificationMethod[],
  ): Promise<Witness[]> {
    const records = await this.prisma.willWitness.findMany({
      where: {
        verificationMethod: { in: methods },
        status: WitnessStatus.VERIFIED,
        will: {
          deletedAt: null,
          isActiveRecord: true,
        },
      },
      orderBy: { verifiedAt: 'desc' },
    });

    return records.map((record) => WitnessMapper.toDomain(record));
  }
}
