// =============================================================================
// ESTATE APPLICATION SERVICES
// Context: The "Economic Truth" of the User
// =============================================================================
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { Estate } from '../../domain/entities/estate.entity';
import { KenyanSuccessionRulesService } from '../../domain/services/kenyan-succession-rule.service';
import { NetWorthCalculatorService } from '../../domain/services/net-worth-calculator.service';
import { KenyanIdentity } from '../../domain/value-objects/kenyan-identity.vo';

@Injectable()
export class CreateEstateService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, userName: string, kraPin?: string): Promise<Estate> {
    // 1. Strict Validation
    if (kraPin) {
      KenyanIdentity.validateKraPin(kraPin); // Throws if invalid format (A000000000Z)
    }

    const existing = await this.prisma.estate.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('Estate already exists for this user');

    // 2. Create Domain Entity
    const estate = Estate.create(userId, userName, kraPin);

    // 3. Persist
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
    private readonly successionRules: KenyanSuccessionRulesService,
  ) {}

  async execute(userId: string) {
    const estate = await this.prisma.estate.findUnique({
      where: { userId },
      include: {
        _count: { select: { assets: true, debts: true } },
        // Check for a valid will to give better recommendations
        // This relies on the relation existing in schema or a separate query
      },
    });

    if (!estate) throw new NotFoundException('Estate not found');

    // Check for Will existence (Separate query to keep it clean)
    const hasWill =
      (await this.prisma.will.count({
        where: { userId, status: 'ACTIVE' },
      })) > 0;

    const netWorthVal = Number(estate.netWorth);

    // INNOVATION: The "Digital Lawyer" Recommendation
    const recommendation = this.successionRules.recommendProbateForm(hasWill, netWorthVal);
    const estimatedFees = this.successionRules.estimateCourtFees(netWorthVal, recommendation.form);

    return {
      overview: {
        id: estate.id,
        userName: estate.userName,
        kraPin: estate.kraPin,
        netWorth: netWorthVal,
        currency: 'KES',
        isInsolvent: estate.isInsolvent,
      },
      stats: {
        totalAssets: Number(estate.totalAssets),
        totalDebts: Number(estate.totalDebts),
        assetCount: estate._count.assets,
        debtCount: estate._count.debts,
      },
      // The "Smart" Part
      legalInsights: {
        recommendedForm: recommendation.form, // e.g., "PA80_INTESTATE"
        explanation: recommendation.explanation,
        estimatedCourtFees: estimatedFees.toCourtFormat(),
        jurisdiction: this.successionRules.determineJurisdiction(netWorthVal),
      },
      timestamps: {
        createdAt: estate.createdAt,
        updatedAt: estate.updatedAt,
      },
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
    const assets = await this.prisma.asset.findMany({ where: { estateId } });
    const debts = await this.prisma.debt.findMany({ where: { estateId } });

    const totalAssets = this.calculator.calculateTotal(assets.map((a) => Number(a.estimatedValue)));
    const totalDebts = this.calculator.calculateTotal(
      debts.map((d) => Number(d.outstandingBalance)),
    );

    const result = this.calculator.calculate(totalAssets, totalDebts);

    await this.prisma.estate.update({
      where: { id: estateId },
      data: {
        totalAssets: result.totalAssets.amount, // Decimal handling implicitly done by Prisma
        totalDebts: result.totalDebts.amount,
        netWorth: result.netWorth.amount,
        isInsolvent: result.isInsolvent,
        updatedAt: new Date(),
      },
    });
  }
}
