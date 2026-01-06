import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetCategory, AssetStatus, WillStatus } from '@prisma/client';

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
  hasKraPin: boolean; // From Estate Owner profile
  taxClearance: boolean;
  assets: Array<{
    id: string;
    name: string;
    category: AssetCategory;
    estimatedValue: number;
    isVerified: boolean;
    isEncumbered: boolean;
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
      throw new NotFoundException(`Estate with ID ${estateId} not found`);
    }

    // Check for Will
    const will = await this.prisma.will.findFirst({
      where: {
        userId: estate.userId,
        status: { in: [WillStatus.DRAFT, WillStatus.ACTIVE] },
      },
      include: {
        witnesses: true,
        // Note: Executor is a field 'executorName', not a relation in your schema
      },
    });

    return {
      id: estate.id,
      userId: estate.userId,
      totalAssets: Number(estate.totalAssets),
      totalDebts: Number(estate.totalDebts),
      netWorth: Number(estate.netWorth),
      isInsolvent: estate.isInsolvent,

      // Will Logic
      hasWill: !!will,
      willWitnessCount: will?.witnesses?.length || 0,
      hasExecutor: !!will?.executorName, // Checked against schema

      hasKraPin: !!estate.kraPin,
      taxClearance: false, // Placeholder: needs integration with KRA service or flag

      assets: estate.assets.map((a) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        estimatedValue: Number(a.estimatedValue),
        isVerified: a.status === AssetStatus.VERIFIED,
        isEncumbered: a.isEncumbered,
      })),

      debts: estate.debts.map((d) => ({
        id: d.id,
        creditorName: d.creditorName,
        outstandingBalance: Number(d.outstandingBalance),
      })),
    };
  }
}
