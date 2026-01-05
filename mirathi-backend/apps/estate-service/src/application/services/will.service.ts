// =============================================================================
// WILL SERVICES
// =============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { Will, WillStatus } from '../../domain/entities/will.entity';
import {
  WillPreviewGeneratorService,
  WillValidatorService,
} from '../../domain/services/will-validator.service';

@Injectable()
export class CreateWillService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, testatorName: string): Promise<Will> {
    // Check for active will
    const activeWill = await this.prisma.will.findFirst({
      where: {
        userId,
        status: { in: [WillStatus.DRAFT, WillStatus.ACTIVE] },
      },
    });

    let versionNumber = 1;
    if (activeWill) {
      versionNumber = activeWill.versionNumber + 1;
      // Supersede old will
      await this.prisma.will.update({
        where: { id: activeWill.id },
        data: { status: WillStatus.SUPERSEDED },
      });
    }

    const will = Will.create(userId, testatorName);
    const willData = will.toJSON();

    await this.prisma.will.create({
      data: {
        ...willData,
        versionNumber,
      },
    });

    return will;
  }
}

@Injectable()
export class AddBeneficiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly willValidator: WillValidatorService,
  ) {}

  async execute(willId: string, beneficiaryData: any): Promise<void> {
    const will = await this.prisma.will.findUnique({
      where: { id: willId },
      include: {
        bequests: true,
        witnesses: true,
      },
    });

    if (!will) {
      throw new NotFoundException('Will not found');
    }

    // Create bequest
    await this.prisma.bequest.create({
      data: {
        id: crypto.randomUUID(),
        willId,
        ...beneficiaryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update will completeness
    const beneficiaryCount = will.bequests.length + 1;
    const witnessCount = will.witnesses.length;

    const completeness = this.willValidator.validateCompleteness(
      will.hasExecutor,
      beneficiaryCount,
      witnessCount,
    );

    await this.prisma.will.update({
      where: { id: willId },
      data: {
        hasBeneficiaries: completeness.hasBeneficiaries,
        hasWitnesses: completeness.hasWitnesses,
        isComplete: completeness.isComplete,
        completenessScore: completeness.score,
        validationWarnings: completeness.warnings,
        updatedAt: new Date(),
      },
    });
  }
}

@Injectable()
export class AddWitnessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly willValidator: WillValidatorService,
  ) {}

  async execute(willId: string, witnessData: any): Promise<void> {
    const will = await this.prisma.will.findUnique({
      where: { id: willId },
      include: {
        bequests: true,
        witnesses: true,
      },
    });

    if (!will) {
      throw new NotFoundException('Will not found');
    }

    // Create witness
    await this.prisma.witness.create({
      data: {
        id: crypto.randomUUID(),
        willId,
        ...witnessData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update will completeness
    const beneficiaryCount = will.bequests.length;
    const witnessCount = will.witnesses.length + 1;

    const completeness = this.willValidator.validateCompleteness(
      will.hasExecutor,
      beneficiaryCount,
      witnessCount,
    );

    await this.prisma.will.update({
      where: { id: willId },
      data: {
        hasBeneficiaries: completeness.hasBeneficiaries,
        hasWitnesses: completeness.hasWitnesses,
        isComplete: completeness.isComplete,
        completenessScore: completeness.score,
        validationWarnings: completeness.warnings,
        updatedAt: new Date(),
      },
    });
  }
}

@Injectable()
export class GenerateWillPreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly previewGenerator: WillPreviewGeneratorService,
    private readonly willValidator: WillValidatorService,
  ) {}

  async execute(willId: string) {
    const will = await this.prisma.will.findUnique({
      where: { id: willId },
      include: {
        bequests: true,
        witnesses: true,
      },
    });

    if (!will) {
      throw new NotFoundException('Will not found');
    }

    const completeness = this.willValidator.validateCompleteness(
      will.hasExecutor,
      will.bequests.length,
      will.witnesses.length,
    );

    const previewData = {
      testatorName: will.testatorName,
      versionNumber: will.versionNumber,
      executor: will.executorName
        ? {
            name: will.executorName,
            relationship: will.executorRelationship,
          }
        : undefined,
      beneficiaries: will.bequests.map((b) => ({
        name: b.beneficiaryName,
        type: b.beneficiaryType,
        description: b.description,
      })),
      witnesses: will.witnesses.map((w) => ({
        name: w.fullName,
        status: w.status,
      })),
      funeralWishes: will.funeralWishes,
      burialLocation: will.burialLocation,
      specialInstructions: will.specialInstructions,
      createdAt: will.createdAt,
    };

    const htmlPreview = this.previewGenerator.generateHtmlPreview(previewData);

    return {
      willId: will.id,
      testatorName: will.testatorName,
      status: will.status,
      versionNumber: will.versionNumber,
      executor: previewData.executor,
      beneficiaries: previewData.beneficiaries,
      witnesses: previewData.witnesses,
      funeralWishes: will.funeralWishes,
      burialLocation: will.burialLocation,
      completeness: completeness,
      createdAt: will.createdAt,
      updatedAt: will.updatedAt,
      htmlPreview,
    };
  }
}
