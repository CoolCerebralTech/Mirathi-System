import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { FamilyMember } from '../../../domain/entities/family-member.entity';
import {
  FamilyMemberQueryCriteria,
  IFamilyMemberRepository,
} from '../../../domain/interfaces/repositories/ifamily-member.repository';
import { FamilyMemberMapper } from '../mappers/family-member.mapper';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class FamilyMemberRepository implements IFamilyMemberRepository {
  private readonly logger = new Logger(FamilyMemberRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly memberMapper: FamilyMemberMapper,
  ) {}

  // ============ CORE CRUD OPERATIONS ============
  async create(familyMember: FamilyMember): Promise<FamilyMember> {
    try {
      const persistenceData = this.memberMapper.toPersistenceCreate(familyMember);
      const savedMember = await this.prisma.familyMember.create({
        data: persistenceData,
      });
      return this.memberMapper.toDomain(savedMember)!;
    } catch (error) {
      this.logger.error(`Failed to create family member ${familyMember.id}:`, error);
      throw error;
    }
  }

  async findById(id: string): Promise<FamilyMember | null> {
    const member = await this.prisma.familyMember.findUnique({
      where: { id },
    });
    return member ? this.memberMapper.toDomain(member) : null;
  }

  async update(familyMember: FamilyMember): Promise<FamilyMember> {
    try {
      const persistenceData = this.memberMapper.toPersistenceUpdate(familyMember);

      // Extract the ID from the domain object, not from persistenceData
      const id = familyMember.id;

      // Create update data without the id field
      const updateData = { ...persistenceData };
      delete updateData.id;

      const savedMember = await this.prisma.familyMember.update({
        where: { id },
        data: updateData,
      });
      return this.memberMapper.toDomain(savedMember)!;
    } catch (error) {
      this.logger.error(`Failed to update family member ${familyMember.id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.familyMember.delete({
        where: { id },
      });
      this.logger.log(`Family member ${id} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete family member ${id}:`, error);
      throw error;
    }
  }

  async archive(id: string, deletedBy: string, reason: string): Promise<void> {
    try {
      await this.prisma.familyMember.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy,
          deletionReason: reason,
          isArchived: true,
        },
      });
      this.logger.log(`Family member ${id} archived by ${deletedBy}. Reason: ${reason}`);
    } catch (error) {
      this.logger.error(`Failed to archive family member ${id}:`, error);
      throw error;
    }
  }

  async unarchive(id: string): Promise<void> {
    try {
      await this.prisma.familyMember.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: null,
          deletionReason: null,
          isArchived: false,
        },
      });
      this.logger.log(`Family member ${id} unarchived`);
    } catch (error) {
      this.logger.error(`Failed to unarchive family member ${id}:`, error);
      throw error;
    }
  }

  // ============ IDENTITY & VERIFICATION QUERIES ============
  async findByNationalId(nationalId: string): Promise<FamilyMember | null> {
    const member = await this.prisma.familyMember.findUnique({
      where: { nationalId },
    });
    return member ? this.memberMapper.toDomain(member) : null;
  }

  async findByUserId(userId: string): Promise<FamilyMember | null> {
    const member = await this.prisma.familyMember.findUnique({
      where: { userId },
    });
    return member ? this.memberMapper.toDomain(member) : null;
  }

  async findByKraPin(kraPin: string): Promise<FamilyMember | null> {
    const member = await this.prisma.familyMember.findUnique({
      where: { kraPin },
    });
    return member ? this.memberMapper.toDomain(member) : null;
  }

  async findByDeathCertificateNumber(certificateNumber: string): Promise<FamilyMember | null> {
    const member = await this.prisma.familyMember.findUnique({
      where: { deathCertificateNumber: certificateNumber },
    });
    return member ? this.memberMapper.toDomain(member) : null;
  }

  async findWithVerifiedIdentity(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        nationalIdVerified: true,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findWithUnverifiedIdentity(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        nationalIdVerified: {
          not: true, // This excludes true, leaving false and null
        },
      },
    });
    return members
      .map((member) => this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }
  // ============ FAMILY-CENTRIC QUERIES ============
  async findAllByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: { familyId },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findAllByFamilyIdWithStatus(
    familyId: string,
    includeArchived: boolean = false,
  ): Promise<FamilyMember[]> {
    const where: Prisma.FamilyMemberWhereInput = { familyId };

    if (!includeArchived) {
      where.isArchived = false;
    }

    const members = await this.prisma.familyMember.findMany({ where });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async countByFamilyId(familyId: string): Promise<number> {
    return await this.prisma.familyMember.count({
      where: { familyId },
    });
  }

  // ============ LIFE STATUS QUERIES ============
  async findLivingByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isDeceased: false,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findDeceasedByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isDeceased: true,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findMissingByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        missingSince: { not: null },
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findActiveByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isArchived: false,
        isDeceased: false,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findInactiveByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        OR: [{ isArchived: true }, { isDeceased: true }],
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  // ============ S.29 DEPENDANT QUERIES ============
  async findPotentialS29Dependants(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isDeceased: false,
        OR: [
          { isMinor: true },
          { disabilityStatus: { not: null } },
          {
            dateOfBirth: {
              gte: new Date(new Date().setFullYear(new Date().getFullYear() - 25)), // Under 25
              lte: new Date(new Date().setFullYear(new Date().getFullYear() - 18)), // Over 18
            },
          },
        ],
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findMinorsByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isMinor: true,
        isDeceased: false,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findWithDisabilityByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        disabilityStatus: { not: null },
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findStudentsByFamilyId(familyId: string, maxAge: number = 25): Promise<FamilyMember[]> {
    const minDate = new Date(new Date().setFullYear(new Date().getFullYear() - maxAge));

    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isDeceased: false,
        dateOfBirth: { gte: minDate },
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findDependantEligibleMembers(familyId: string): Promise<FamilyMember[]> {
    return this.findPotentialS29Dependants(familyId);
  }

  // ============ S.40 POLYGAMOUS FAMILY QUERIES ============
  async findPolygamousHouseMembers(houseId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: { polygamousHouseId: houseId },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findPolygamousHouseHead(houseId: string): Promise<FamilyMember | null> {
    const member = await this.prisma.familyMember.findFirst({
      where: {
        polygamousHouseId: houseId,
        gender: 'MALE',
      },
    });
    return member ? this.memberMapper.toDomain(member) : null;
  }

  async findPolygamousHeadsByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        gender: 'MALE',
        polygamousHouseId: { not: null },
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findWivesByHouseId(houseId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        polygamousHouseId: houseId,
        gender: 'FEMALE',
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findChildrenByHouseId(houseId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        polygamousHouseId: houseId,
        isMinor: true,
        isDeceased: false,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  // ============ DEMOGRAPHIC & CATEGORY QUERIES ============
  async findByGender(familyId: string, gender: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        gender,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findByReligion(familyId: string, religion: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        religion,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findByEthnicity(familyId: string, ethnicity: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        customaryEthnicGroup: ethnicity,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findByAgeRange(familyId: string, minAge: number, maxAge: number): Promise<FamilyMember[]> {
    const maxDate = new Date(new Date().setFullYear(new Date().getFullYear() - minAge));
    const minDate = new Date(new Date().setFullYear(new Date().getFullYear() - maxAge));

    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        dateOfBirth: {
          gte: minDate,
          lte: maxDate,
        },
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  // ============ BULK OPERATIONS ============
  async saveMany(members: FamilyMember[]): Promise<FamilyMember[]> {
    if (members.length === 0) {
      return [];
    }

    const savedMembers: FamilyMember[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const member of members) {
        const persistenceData = this.memberMapper.toPersistenceCreate(member);
        const { id, ...updateData } = persistenceData;

        const saved = await tx.familyMember.upsert({
          where: { id },
          create: persistenceData,
          update: updateData,
        });

        savedMembers.push(this.memberMapper.toDomain(saved)!);
      }
    });

    return savedMembers;
  }

  async batchUpdateStatus(
    updates: Array<{ id: string; isDeceased: boolean; dateOfDeath?: Date }>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.familyMember.update({
          where: { id: update.id },
          data: {
            isDeceased: update.isDeceased,
            ...(update.dateOfDeath && { dateOfDeath: update.dateOfDeath }),
          },
        });
      }
    });
  }

  async batchArchive(memberIds: string[], deletedBy: string, reason: string): Promise<void> {
    await this.prisma.familyMember.updateMany({
      where: { id: { in: memberIds } },
      data: {
        deletedAt: new Date(),
        deletedBy,
        deletionReason: reason,
        isArchived: true,
      },
    });
    this.logger.log(`Archived ${memberIds.length} family members by ${deletedBy}`);
  }

  // ============ VALIDATION & EXISTENCE CHECKS ============
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.familyMember.count({
      where: { id },
    });
    return count > 0;
  }

  async existsByNationalId(nationalId: string): Promise<boolean> {
    const count = await this.prisma.familyMember.count({
      where: { nationalId },
    });
    return count > 0;
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.familyMember.count({
      where: { userId },
    });
    return count > 0;
  }

  async existsByKraPin(kraPin: string): Promise<boolean> {
    const count = await this.prisma.familyMember.count({
      where: { kraPin },
    });
    return count > 0;
  }

  async isMemberOfFamily(memberId: string, familyId: string): Promise<boolean> {
    const count = await this.prisma.familyMember.count({
      where: {
        id: memberId,
        familyId,
      },
    });
    return count > 0;
  }

  async validateFamilyMemberUniqueness(
    familyId: string,
    nationalId?: string,
    kraPin?: string,
    userId?: string,
  ): Promise<boolean> {
    const conditions: Prisma.FamilyMemberWhereInput[] = [];

    if (nationalId) {
      conditions.push({ nationalId });
    }
    if (kraPin) {
      conditions.push({ kraPin });
    }
    if (userId) {
      conditions.push({ userId });
    }

    if (conditions.length === 0) {
      return true;
    }

    const count = await this.prisma.familyMember.count({
      where: {
        familyId,
        OR: conditions,
      },
    });

    return count === 0;
  }

  // ============ STATISTICS & COUNTS ============
  async getFamilyMemberStatistics(familyId: string): Promise<{
    total: number;
    living: number;
    deceased: number;
    minors: number;
    withDisability: number;
    missing: number;
    archived: number;
    identityVerified: number;
    potentialDependants: number;
    polygamousHeads: number;
    averageAge: number;
  }> {
    const [
      total,
      living,
      deceased,
      minors,
      withDisability,
      missing,
      archived,
      identityVerified,
      potentialDependants,
      polygamousHeads,
      ageSum,
    ] = await Promise.all([
      this.countByFamilyId(familyId),
      this.prisma.familyMember.count({ where: { familyId, isDeceased: false } }),
      this.prisma.familyMember.count({ where: { familyId, isDeceased: true } }),
      this.prisma.familyMember.count({ where: { familyId, isMinor: true, isDeceased: false } }),
      this.prisma.familyMember.count({ where: { familyId, disabilityStatus: { not: null } } }),
      this.prisma.familyMember.count({ where: { familyId, missingSince: { not: null } } }),
      this.prisma.familyMember.count({ where: { familyId, isArchived: true } }),
      this.prisma.familyMember.count({ where: { familyId, nationalIdVerified: true } }),
      this.prisma.familyMember.count({
        where: {
          familyId,
          isDeceased: false,
          OR: [{ isMinor: true }, { disabilityStatus: { not: null } }],
        },
      }),
      this.prisma.familyMember.count({
        where: {
          familyId,
          gender: 'MALE',
          polygamousHouseId: { not: null },
        },
      }),
      this.prisma.familyMember.aggregate({
        where: { familyId, currentAge: { not: null } },
        _avg: { currentAge: true },
      }),
    ]);

    return {
      total,
      living,
      deceased,
      minors,
      withDisability,
      missing,
      archived,
      identityVerified,
      potentialDependants,
      polygamousHeads,
      averageAge: ageSum._avg.currentAge || 0,
    };
  }

  // ============ INHERITANCE & LEGAL ELIGIBILITY QUERIES ============
  async findInheritanceEligibleMembers(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isDeceased: false,
        nationalIdVerified: true,
        missingSince: null,
        isArchived: false,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findExcludedFromInheritance(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        OR: [
          { isDeceased: true },
          { nationalIdVerified: false },
          { missingSince: { not: null } },
          { isArchived: true },
        ],
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findWithDeathCertificates(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        deathCertificateNumber: { not: null },
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findWithoutDeathCertificates(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        isDeceased: true,
        deathCertificateNumber: null,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  // ============ SEARCH & ADVANCED FILTERING ============
  async searchByName(familyId: string, name: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        OR: [
          { firstName: { contains: name, mode: 'insensitive' } },
          { lastName: { contains: name, mode: 'insensitive' } },
          { middleName: { contains: name, mode: 'insensitive' } },
        ],
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
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
    if (criteria.isArchived !== undefined) {
      where.isArchived = criteria.isArchived;
    }
    if (criteria.isActive !== undefined) {
      if (criteria.isActive) {
        where.isArchived = false;
        where.isDeceased = false;
        where.missingSince = null;
      } else {
        where.OR = [{ isArchived: true }, { isDeceased: true }, { missingSince: { not: null } }];
      }
    }
    if (criteria.isIdentityVerified !== undefined) {
      where.nationalIdVerified = criteria.isIdentityVerified;
    }
    if (criteria.gender) {
      where.gender = criteria.gender;
    }
    if (criteria.religion) {
      where.religion = criteria.religion;
    }
    if (criteria.ethnicity) {
      where.customaryEthnicGroup = criteria.ethnicity;
    }
    if (criteria.polygamousHouseId) {
      where.polygamousHouseId = criteria.polygamousHouseId;
    }

    const members = await this.prisma.familyMember.findMany({ where });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findByOccupation(familyId: string, occupation: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        occupation: { contains: occupation, mode: 'insensitive' },
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  // ============ RELATIONSHIP & CONNECTIVITY QUERIES ============
  async findImmediateFamily(familyMemberId: string): Promise<{
    spouses: FamilyMember[];
    children: FamilyMember[];
    parents: FamilyMember[];
    siblings: FamilyMember[];
  }> {
    // First, get the family member to find their family
    const member = await this.findById(familyMemberId);
    if (!member) {
      return { spouses: [], children: [], parents: [], siblings: [] };
    }

    // Get all family members in the same family

    // This is a placeholder - in production, you'd query the FamilyRelationship model
    return {
      spouses: [], // Would require querying Marriage model
      children: [], // Would require querying FamilyRelationship model
      parents: [], // Would require querying FamilyRelationship model
      siblings: [], // Would require querying FamilyRelationship model
    };
  }

  // ============ CONCURRENCY & VERSION CONTROL ============
  async saveWithOptimisticLocking(
    familyMember: FamilyMember,
    expectedVersion: number,
  ): Promise<FamilyMember> {
    const id = familyMember.id;

    try {
      const persistenceData = this.memberMapper.toPersistenceUpdate(familyMember);

      // Ensure we're incrementing the version in the update
      const updateData = {
        ...persistenceData,
        version: { increment: 1 }, // Add version increment
      };

      // Remove id from update data if it exists
      delete updateData.id;

      const savedMember = await this.prisma.familyMember.update({
        where: {
          id,
          version: expectedVersion, // Prisma will handle version check atomically
        },
        data: updateData,
      });

      return this.memberMapper.toDomain(savedMember)!;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found or version mismatch
          throw new Error(
            `Optimistic locking conflict for family member ${id}. Expected version: ${expectedVersion}, but record was updated by another transaction.`,
          );
        }
      }

      this.logger.error(`Failed to save family member ${id} with optimistic locking:`, error);
      throw error;
    }
  }

  // ============ POLYGAMY-SPECIFIC QUERIES ============
  async findWivesWithMultipleHouses(familyId: string): Promise<FamilyMember[]> {
    try {
      // Get all polygamous house IDs that have more than one wife
      const housesWithMultipleWives = await this.prisma.familyMember.groupBy({
        by: ['polygamousHouseId'],
        where: {
          familyId,
          gender: 'FEMALE',
          polygamousHouseId: { not: null },
        },
        having: {
          polygamousHouseId: {
            _count: {
              gt: 1, // Houses with more than 1 wife
            },
          },
        },
      });

      if (housesWithMultipleWives.length === 0) {
        return [];
      }

      // Extract house IDs
      const houseIds = housesWithMultipleWives
        .map((house) => house.polygamousHouseId)
        .filter((id): id is string => id !== null);

      // Get all wives in those houses
      const wives = await this.prisma.familyMember.findMany({
        where: {
          familyId,
          gender: 'FEMALE',
          polygamousHouseId: { in: houseIds },
        },
      });

      return wives
        .map((member) => this.memberMapper.toDomain(member))
        .filter((member): member is FamilyMember => member !== null);
    } catch (error) {
      this.logger.error(`Error finding wives with multiple houses for family ${familyId}:`, error);
      return [];
    }
  }

  async findHeirsByPolygamousHouse(houseId: string): Promise<FamilyMember[]> {
    // Find all members in the house, plus children
    const houseMembers = await this.findPolygamousHouseMembers(houseId);
    return houseMembers;
  }

  // ============ CUSTOMARY LAW QUERIES ============
  async findCustomaryLawApplicable(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        OR: [{ customaryEthnicGroup: { not: null } }, { customaryClan: { not: null } }],
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findIslamicInheritanceApplicable(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        religion: 'ISLAMIC',
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  // ============ AUDIT & COMPLIANCE QUERIES ============
  async findMembersRequiringIdentityVerification(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        nationalId: { not: null },
        nationalIdVerified: false,
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  async findMembersWithMissingCriticalData(familyId: string): Promise<FamilyMember[]> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        OR: [{ nationalId: null }, { dateOfBirth: null }, { gender: null }],
      },
    });
    return members
      .map((member) => member && this.memberMapper.toDomain(member))
      .filter((member): member is FamilyMember => member !== null);
  }

  // ============ HELPER METHODS ============
  async withTransaction<T>(transactionFn: (client: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return transactionFn(tx as TransactionClient);
    });
  }
}
