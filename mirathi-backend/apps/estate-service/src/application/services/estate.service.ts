import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { Estate } from '../../domain/entities/estate.entity';
import { NetWorthCalculatorService } from '../../domain/services/net-worth-calculator.service';

// =============================================================================
// ESTATE SERVICES
// =============================================================================

@Injectable()
export class CreateEstateService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, userName: string, kraPin?: string): Promise<Estate> {
    // Check if estate already exists
    const existing = await this.prisma.estate.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('Estate already exists for this user');
    }

    const estate = Estate.create(userId, userName, kraPin);

    await this.prisma.estate.create({
      data: estate.toJSON(),
    });

    return estate;
  }
}

@Injectable()
export class GetEstateSummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly netWorthCalculator: NetWorthCalculatorService,
  ) {}

  async execute(userId: string) {
    const estate = await this.prisma.estate.findUnique({
      where: { userId },
      include: {
        _count: {
          select: { assets: true, debts: true },
        },
      },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    return {
      id: estate.id,
      userName: estate.userName,
      kraPin: estate.kraPin,
      totalAssets: Number(estate.totalAssets),
      totalDebts: Number(estate.totalDebts),
      netWorth: Number(estate.netWorth),
      isInsolvent: estate.isInsolvent,
      assetCount: estate._count.assets,
      debtCount: estate._count.debts,
      createdAt: estate.createdAt,
      updatedAt: estate.updatedAt,
    };
  }
}

@Injectable()
export class CalculateNetWorthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: NetWorthCalculatorService,
  ) {}

  async execute(estateId: string): Promise<void> {
    // Get all assets
    const assets = await this.prisma.asset.findMany({
      where: { estateId },
    });

    // Get all debts
    const debts = await this.prisma.debt.findMany({
      where: { estateId },
    });

    const totalAssets = this.calculator.calculateTotal(assets.map((a) => Number(a.estimatedValue)));

    const totalDebts = this.calculator.calculateTotal(
      debts.map((d) => Number(d.outstandingBalance)),
    );

    const netWorth = this.calculator.calculate(totalAssets, totalDebts);

    // Update estate
    await this.prisma.estate.update({
      where: { id: estateId },
      data: {
        totalAssets,
        totalDebts,
        netWorth: netWorth.netWorth.amount,
        isInsolvent: netWorth.isInsolvent,
        updatedAt: new Date(),
      },
    });
  }
}
