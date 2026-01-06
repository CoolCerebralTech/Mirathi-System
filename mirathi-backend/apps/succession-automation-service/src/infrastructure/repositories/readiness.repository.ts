import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { ReadinessAssessment } from '../../domian/entities/readiness-assessment.entity';

// =============================================================================
// REPOSITORIES
// =============================================================================

@Injectable()
export class ReadinessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(assessment: ReadinessAssessment): Promise<void> {
    const data = assessment.toJSON();
    await this.prisma.readinessAssessment.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findByEstateId(estateId: string): Promise<ReadinessAssessment | null> {
    const data = await this.prisma.readinessAssessment.findFirst({
      where: { estateId },
      include: { riskFlags: true },
    });

    if (!data) return null;
    return ReadinessAssessment.fromPersistence(data as any);
  }

  async findById(id: string): Promise<ReadinessAssessment | null> {
    const data = await this.prisma.readinessAssessment.findUnique({
      where: { id },
      include: { riskFlags: true },
    });

    if (!data) return null;
    return ReadinessAssessment.fromPersistence(data as any);
  }
}
