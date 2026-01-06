import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { RiskFlag } from '../../domian/entities/risk-flag.entity';

@Injectable()
export class RiskFlagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(risk: RiskFlag): Promise<void> {
    const data = risk.toJSON();
    await this.prisma.riskFlag.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async saveMany(risks: RiskFlag[]): Promise<void> {
    await this.prisma.riskFlag.createMany({
      data: risks.map((r) => r.toJSON()),
      skipDuplicates: true,
    });
  }

  async findByAssessmentId(assessmentId: string): Promise<RiskFlag[]> {
    const data = await this.prisma.riskFlag.findMany({
      where: { assessmentId },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });

    return data.map((d) => RiskFlag.fromPersistence(d));
  }

  async deleteByAssessmentId(assessmentId: string): Promise<void> {
    await this.prisma.riskFlag.deleteMany({
      where: { assessmentId },
    });
  }
}
