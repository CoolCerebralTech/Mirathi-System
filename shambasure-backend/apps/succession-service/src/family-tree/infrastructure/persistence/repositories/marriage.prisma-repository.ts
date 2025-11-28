import { Injectable } from '@nestjs/common';
import { MarriageStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Marriage } from '../../../domain/entities/marriage.entity';
import { MarriageRepositoryInterface } from '../../../domain/interfaces/marriage.repository.interface';
import { MarriageMapper } from '../mappers/marriage.mapper';

/**
 * Prisma Implementation of the Marriage Repository
 *
 * Handles persistence for spousal relationships.
 * Implements critical validation for Kenyan Marriage Act 2014 (Polygamy/Bigamy checks).
 */
@Injectable()
export class MarriagePrismaRepository implements MarriageRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(marriage: Marriage): Promise<void> {
    const data = MarriageMapper.toPersistence(marriage);

    await this.prisma.marriage.upsert({
      where: { id: marriage.getId() },
      create: {
        id: data.id,
        familyId: data.familyId,
        spouse1Id: data.spouse1Id,
        spouse2Id: data.spouse2Id,
        marriageDate: data.marriageDate,
        marriageType: data.marriageType,
        certificateNumber: data.certificateNumber,
        divorceDate: data.divorceDate,
        divorceCertNumber: data.divorceCertNumber,
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        marriageDate: data.marriageDate,
        marriageType: data.marriageType,
        certificateNumber: data.certificateNumber,
        divorceDate: data.divorceDate,
        divorceCertNumber: data.divorceCertNumber,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Marriage | null> {
    const record = await this.prisma.marriage.findUnique({
      where: { id },
    });

    return record ? MarriageMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.marriage.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------
  // DOMAIN LOOKUPS
  // ---------------------------------------------------------

  async findByFamilyId(familyId: string): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: { familyId },
      orderBy: { marriageDate: 'desc' },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  async findByMemberId(memberId: string): Promise<Marriage[]> {
    // Member can be either spouse1 OR spouse2
    const records = await this.prisma.marriage.findMany({
      where: {
        OR: [{ spouse1Id: memberId }, { spouse2Id: memberId }],
      },
      orderBy: { marriageDate: 'desc' },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  async findActiveBetween(spouse1Id: string, spouse2Id: string): Promise<Marriage | null> {
    // Check both directions (A-B or B-A)
    const record = await this.prisma.marriage.findFirst({
      where: {
        isActive: true,
        OR: [
          { spouse1Id: spouse1Id, spouse2Id: spouse2Id },
          { spouse1Id: spouse2Id, spouse2Id: spouse1Id },
        ],
      },
    });
    return record ? MarriageMapper.toDomain(record) : null;
  }

  async findActiveMarriages(memberId: string): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: {
        isActive: true,
        OR: [{ spouse1Id: memberId }, { spouse2Id: memberId }],
      },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // KENYAN MARRIAGE LAW SPECIFIC QUERIES
  // ---------------------------------------------------------

  async findCustomaryMarriages(familyId: string): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: {
        familyId,
        marriageType: MarriageStatus.CUSTOMARY_MARRIAGE,
      },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  async findPolygamousMarriages(familyId: string): Promise<Marriage[]> {
    // In Kenyan law, "Potentially Polygamous" marriages are Customary or Islamic.
    // "Polygamous" usually refers to the regime, not the individual bond.
    // Here we return marriages that fall under the polygamous regime definition.
    const records = await this.prisma.marriage.findMany({
      where: {
        familyId,
        marriageType: {
          in: [MarriageStatus.CUSTOMARY_MARRIAGE], // Add ISLAMIC if added to enum
        },
      },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  async findByCertificateNumber(certificateNumber: string): Promise<Marriage | null> {
    const record = await this.prisma.marriage.findFirst({
      where: { certificateNumber },
    });
    return record ? MarriageMapper.toDomain(record) : null;
  }

  async findDissolvedMarriages(familyId: string): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: {
        familyId,
        isActive: false,
        divorceDate: { not: null },
      },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  async findByMarriageDateRange(
    startDate: Date,
    endDate: Date,
    familyId?: string,
  ): Promise<Marriage[]> {
    const records = await this.prisma.marriage.findMany({
      where: {
        familyId,
        marriageDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    return records.map((record) => MarriageMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // VALIDATION & BUSINESS RULES
  // ---------------------------------------------------------

  async canMemberMarry(
    memberId: string,
    proposedMarriageType: MarriageStatus,
  ): Promise<{
    canMarry: boolean;
    reason?: string;
    existingMarriages: Marriage[];
  }> {
    const existingMarriages = await this.findActiveMarriages(memberId);
    const existingDomains = existingMarriages; // Already mapped

    // Rule 1: No existing active marriages? -> Can marry.
    if (existingDomains.length === 0) {
      return { canMarry: true, existingMarriages: [] };
    }

    // Rule 2: Check existing marriage types
    const hasMonogamousMarriage = existingDomains.some((m) => {
      const type = m.getMarriageType();
      // Civil, Christian, Hindu are strictly monogamous
      return (
        type === MarriageStatus.CIVIL_UNION || type === MarriageStatus.MARRIED // Assuming MARRIED = Christian/Civil generic
      );
    });

    if (hasMonogamousMarriage) {
      return {
        canMarry: false,
        reason: 'Member is in a strictly monogamous marriage (Civil/Christian).',
        existingMarriages: existingDomains,
      };
    }

    // Rule 3: Existing marriage is Customary (Potentially Polygamous)
    const isProposedMonogamous =
      proposedMarriageType === MarriageStatus.CIVIL_UNION ||
      proposedMarriageType === MarriageStatus.MARRIED;

    if (isProposedMonogamous) {
      // Cannot enter Civil union if currently in Customary marriage (Must dissolve first)
      return {
        canMarry: false,
        reason:
          'Cannot enter a Civil/Christian marriage while in an active Customary marriage. Convert or dissolve first.',
        existingMarriages: existingDomains,
      };
    }

    // Rule 4: Existing is Customary, Proposed is Customary -> Allowed (Polygamy)
    return {
      canMarry: true,
      existingMarriages: existingDomains,
    };
  }

  async validateMarriageEligibility(
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageStatus,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Check Self-Marriage
    if (spouse1Id === spouse2Id) {
      errors.push('Cannot marry oneself.');
      return { isValid: false, errors, warnings };
    }

    // 2. Check Capacity (Active Marriages)
    const spouse1Check = await this.canMemberMarry(spouse1Id, marriageType);
    const spouse2Check = await this.canMemberMarry(spouse2Id, marriageType);

    if (!spouse1Check.canMarry) {
      errors.push(`Spouse 1: ${spouse1Check.reason}`);
    }
    if (!spouse2Check.canMarry) {
      errors.push(`Spouse 2: ${spouse2Check.reason}`);
    }

    // 3. Check Incest/Prohibited Degrees (Requires Graph Traversal - Simplified here)
    // NOTE: This repository doesn't have the graph traversal logic.
    // That belongs in a higher-level Service or RelationshipRepository check.
    // warnings.push('Ensure spouses are not within prohibited degrees of consanguinity.');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ---------------------------------------------------------
  // ANALYTICS
  // ---------------------------------------------------------

  async getMarriageStatistics(familyId: string): Promise<{
    total: number;
    active: number;
    dissolved: number;
    customary: number;
    civil: number;
    averageDuration: number;
  }> {
    const allMarriages = await this.findByFamilyId(familyId);

    const total = allMarriages.length;
    let active = 0;
    let dissolved = 0;
    let customary = 0;
    let civil = 0;
    let totalDurationYears = 0;
    let durationCount = 0;

    for (const m of allMarriages) {
      if (m.getIsActive()) active++;
      else dissolved++;

      const type = m.getMarriageType();
      if (type === MarriageStatus.CUSTOMARY_MARRIAGE) customary++;
      if (type === MarriageStatus.CIVIL_UNION || type === MarriageStatus.MARRIED) civil++;

      const duration = m.getMarriageDuration();
      if (duration !== null) {
        totalDurationYears += duration;
        durationCount++;
      }
    }

    const averageDuration = durationCount > 0 ? totalDurationYears / durationCount : 0;

    return {
      total,
      active,
      dissolved,
      customary,
      civil,
      averageDuration: parseFloat(averageDuration.toFixed(1)),
    };
  }
}
