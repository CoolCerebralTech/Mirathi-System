import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

export interface EstateData {
  id: string;
  userId: string;
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
  isInsolvent: boolean;
  hasWill: boolean;
  willWitnessCount: number;
  hasExecutor: boolean;
  hasKraPin: boolean;
  taxClearance: boolean;
  assets: Array<{
    id: string;
    name: string;
    category: string;
    estimatedValue: number;
    isVerified: boolean;
  }>;
  debts: Array<{
    id: string;
    creditorName: string;
    outstandingBalance: number;
  }>;
}

@Injectable()
export class EstateServiceAdapter {
  constructor(private readonly prisma: PrismaService) {}

  async getEstateData(estateId: string): Promise<EstateData> {
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
      include: {
        assets: true,
        debts: true,
      },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Check for will
    const will = await this.prisma.will.findFirst({
      where: {
        userId: estate.userId,
        status: { in: ['DRAFT', 'ACTIVE'] },
      },
      include: {
        witnesses: true,
        executors: true,
      },
    });

    return {
      id: estate.id,
      userId: estate.userId,
      totalAssets: Number(estate.totalAssets),
      totalDebts: Number(estate.totalDebts),
      netWorth: Number(estate.netWorth),
      isInsolvent: estate.isInsolvent,
      hasWill: !!will,
      willWitnessCount: will?.witnesses?.length || 0,
      hasExecutor: will?.executors?.length > 0 || false,
      hasKraPin: !!estate.kraPin,
      taxClearance: false, // TODO: Check tax compliance
      assets: estate.assets.map((a) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        estimatedValue: Number(a.estimatedValue),
        isVerified: a.isVerified,
      })),
      debts: estate.debts.map((d) => ({
        id: d.id,
        creditorName: d.creditorName,
        outstandingBalance: Number(d.outstandingBalance),
      })),
    };
  }
}
