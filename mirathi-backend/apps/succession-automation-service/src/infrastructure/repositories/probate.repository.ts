import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { ProbatePreview } from '../../domian/entities/probate-preview.entity';

@Injectable()
export class ProbatePreviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(preview: ProbatePreview): Promise<void> {
    const data = preview.toJSON();
    await this.prisma.probatePreview.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findByEstateId(estateId: string): Promise<ProbatePreview | null> {
    const data = await this.prisma.probatePreview.findFirst({
      where: { estateId },
      include: { formPreviews: true },
    });

    if (!data) return null;
    return ProbatePreview.fromPersistence(data as any);
  }
}
