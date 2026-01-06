import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { ExecutorRoadmap } from '../../domian/entities/executor-roadmap.entity';

@Injectable()
export class RoadmapRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(roadmap: ExecutorRoadmap): Promise<void> {
    const data = roadmap.toJSON();
    await this.prisma.executorRoadmap.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findByEstateId(estateId: string): Promise<ExecutorRoadmap | null> {
    const data = await this.prisma.executorRoadmap.findUnique({
      where: { estateId },
      include: { tasks: true },
    });

    if (!data) return null;
    return ExecutorRoadmap.fromPersistence(data as any);
  }

  async findById(id: string): Promise<ExecutorRoadmap | null> {
    const data = await this.prisma.executorRoadmap.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (!data) return null;
    return ExecutorRoadmap.fromPersistence(data as any);
  }
}
