import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { RoadmapTask } from '../../domian/entities/roadmap-task.entity';

@Injectable()
export class RoadmapTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(task: RoadmapTask): Promise<void> {
    const data = task.toJSON();
    await this.prisma.roadmapTask.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async saveMany(tasks: RoadmapTask[]): Promise<void> {
    await this.prisma.roadmapTask.createMany({
      data: tasks.map((t) => t.toJSON()),
      skipDuplicates: true,
    });
  }

  async findByRoadmapId(roadmapId: string): Promise<RoadmapTask[]> {
    const data = await this.prisma.roadmapTask.findMany({
      where: { roadmapId },
      orderBy: [{ phase: 'asc' }, { orderIndex: 'asc' }],
    });

    return data.map((d) => RoadmapTask.fromPersistence(d));
  }

  async findById(id: string): Promise<RoadmapTask | null> {
    const data = await this.prisma.roadmapTask.findUnique({
      where: { id },
    });

    if (!data) return null;
    return RoadmapTask.fromPersistence(data as any);
  }
}
