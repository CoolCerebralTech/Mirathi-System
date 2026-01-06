// =============================================================================
// WILL APPLICATION SERVICES
// Context: Law of Succession Act, S.11 (Formalities) & S.13 (Witnesses)
// =============================================================================
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BeneficiaryType, WillStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Will } from '../../domain/entities/will.entity';
import { WillPreviewGeneratorService } from '../../domain/services/will-preview-generator.service';
import { WillValidatorService } from '../../domain/services/will-validator.service';

@Injectable()
export class CreateWillService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, testatorName: string): Promise<Will> {
    // Transaction: Handle Versioning
    return await this.prisma.$transaction(async (tx) => {
      const activeWill = await tx.will.findFirst({
        where: { userId, status: { in: [WillStatus.DRAFT, WillStatus.ACTIVE] } },
      });

      let versionNumber = 1;
      if (activeWill) {
        versionNumber = activeWill.versionNumber + 1;
        await tx.will.update({
          where: { id: activeWill.id },
          data: { status: WillStatus.SUPERSEDED },
        });
      }

      const will = Will.create(userId, testatorName);
      const willData = will.toJSON();

      await tx.will.create({
        data: { ...willData, versionNumber },
      });

      return will;
    });
  }
}

@Injectable()
export class AddBeneficiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly willValidator: WillValidatorService,
  ) {}

  async execute(
    willId: string,
    beneficiaryData: {
      name: string;
      type: BeneficiaryType;
      description: string;
    },
  ): Promise<void> {
    const will = await this.prisma.will.findUnique({
      where: { id: willId },
      include: { bequests: true, witnesses: true },
    });
    if (!will) throw new NotFoundException('Will not found');

    // S.13 CHECK: Is this person already a witness?
    // In Kenya, a witness cannot be a beneficiary.
    const isWitness = will.witnesses.some(
      (w) => w.fullName.toLowerCase() === beneficiaryData.name.toLowerCase(),
    );
    if (isWitness) {
      throw new BadRequestException(
        `Conflict: '${beneficiaryData.name}' is already a witness. Under S.13 of the Law of Succession Act, a witness cannot inherit.`,
      );
    }

    // Transaction: Add Bequest & Update Score
    await this.prisma.$transaction(async (tx) => {
      await tx.bequest.create({
        data: {
          willId,
          beneficiaryName: beneficiaryData.name,
          beneficiaryType: beneficiaryData.type,
          description: beneficiaryData.description,
          bequestType: 'RESIDUAL', // Default, should be passed in DTO
        },
      });

      // Recalculate Completeness
      const completeness = this.willValidator.validateCompleteness(
        will.hasExecutor,
        will.bequests.length + 1,
        will.witnesses.length,
      );

      await tx.will.update({
        where: { id: willId },
        data: {
          hasBeneficiaries: completeness.hasBeneficiaries,
          completenessScore: completeness.score,
          validationWarnings: completeness.warnings,
          updatedAt: new Date(),
        },
      });
    });
  }
}

@Injectable()
export class AddWitnessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly willValidator: WillValidatorService,
  ) {}

  async execute(willId: string, witnessData: { fullName: string; email?: string }): Promise<void> {
    const will = await this.prisma.will.findUnique({
      where: { id: willId },
      include: { bequests: true, witnesses: true },
    });
    if (!will) throw new NotFoundException('Will not found');

    // S.13 CHECK: Is this person a beneficiary?
    const isBeneficiary = will.bequests.some(
      (b) => b.beneficiaryName.toLowerCase() === witnessData.fullName.toLowerCase(),
    );
    if (isBeneficiary) {
      throw new BadRequestException(
        `Conflict: '${witnessData.fullName}' is a beneficiary. Under S.13 of the Law of Succession Act, they cannot witness the will.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.witness.create({
        data: {
          willId,
          ...witnessData,
          status: 'PENDING',
        },
      });

      const completeness = this.willValidator.validateCompleteness(
        will.hasExecutor,
        will.bequests.length,
        will.witnesses.length + 1,
      );

      await tx.will.update({
        where: { id: willId },
        data: {
          hasWitnesses: completeness.hasWitnesses,
          isComplete: completeness.isComplete,
          completenessScore: completeness.score,
          validationWarnings: completeness.warnings,
          updatedAt: new Date(),
        },
      });
    });
  }
}

@Injectable()
export class GenerateWillPreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly previewGenerator: WillPreviewGeneratorService, // Added missing validator injection
  ) {}

  async execute(willId: string) {
    const will = await this.prisma.will.findUnique({
      where: { id: willId },
      include: { bequests: true, witnesses: true },
    });

    if (!will) throw new NotFoundException('Will not found');

    // 1. Prepare Data & FIX TYPES
    // We explicitly convert Prisma's `null` to `undefined` for compatibility
    const previewData = {
      testatorName: will.testatorName,
      nationalId: '__________', // Placeholder as it's not in Will entity currently
      versionNumber: will.versionNumber,

      // FIX 1: Handle null relationship safely
      executor: will.executorName
        ? {
            name: will.executorName,
            relationship: will.executorRelationship ?? undefined,
          }
        : undefined,

      beneficiaries: will.bequests.map((b) => ({
        name: b.beneficiaryName,
        type: b.beneficiaryType, // Enum remains Enum
        description: b.description,
        percentage: b.percentage ? Number(b.percentage) : null,
      })),

      witnesses: will.witnesses.map((w) => ({
        name: w.fullName,
        status: w.status,
      })),

      // FIX 2: Handle null strings safely
      funeralWishes: will.funeralWishes ?? undefined,
      burialLocation: will.burialLocation ?? undefined,
      specialInstructions: will.specialInstructions ?? undefined,
      createdAt: will.createdAt,
    };

    // 2. Generate Legal HTML
    // Now compatible with the signature
    const htmlPreview = this.previewGenerator.generateHtmlPreview(previewData);

    return {
      metadata: {
        willId: will.id,
        status: will.status,
        completenessScore: will.completenessScore,
        validationWarnings: will.validationWarnings,
      },
      htmlPreview,
    };
  }
}
