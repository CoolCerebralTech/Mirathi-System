import { Injectable } from '@nestjs/common';
import { KenyanFormType } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { FormPreview } from '../../domain/entities/form-preview.entity';
import { ProbatePreview } from '../../domain/entities/probate-preview.entity';
import { IProbatePreviewRepository } from '../../domain/repositories/probate-preview.repository';

@Injectable()
export class PrismaProbatePreviewRepository implements IProbatePreviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEstateId(estateId: string): Promise<ProbatePreview | null> {
    // FIXED: Changed to findFirst because `estateId` is part of a compound unique key,
    // it is not unique by itself in the schema.
    const raw = await this.prisma.probatePreview.findFirst({
      where: { estateId },
      include: { formPreviews: true },
    });

    if (!raw) return null;

    return ProbatePreview.fromPersistence({
      id: raw.id,
      userId: raw.userId,
      estateId: raw.estateId,
      assessmentId: raw.assessmentId ?? undefined,
      regime: raw.regime,
      targetCourt: raw.targetCourt,
      requiredForms: raw.requiredForms,
      isReady: raw.isReady,
      readinessScore: raw.readinessScore,
      disclaimer: raw.disclaimer,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async save(preview: ProbatePreview): Promise<void> {
    const data = preview.toJSON();

    await this.prisma.probatePreview.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId: data.userId,
        estateId: data.estateId,
        assessmentId: data.assessmentId,
        regime: data.regime,
        targetCourt: data.targetCourt,
        requiredForms: data.requiredForms,
        isReady: data.isReady,
        readinessScore: data.readinessScore,
        disclaimer: data.disclaimer,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        isReady: data.isReady,
        readinessScore: data.readinessScore,
        requiredForms: data.requiredForms,
        updatedAt: data.updatedAt,
      },
    });
  }

  async saveFormPreviews(previews: FormPreview[]): Promise<void> {
    if (previews.length === 0) return;

    await this.prisma.$transaction(
      previews.map((preview) => {
        const data = preview.toJSON();
        // Since Domain Entity now returns proper Enums (KenyanFormType),
        // Prisma will accept it directly.
        return this.prisma.formPreview.upsert({
          where: { id: data.id },
          create: {
            id: data.id,
            probatePreviewId: data.probatePreviewId,
            formType: data.formType as unknown as KenyanFormType,
            formTitle: data.formTitle,
            formCode: data.formCode,
            htmlPreview: data.htmlPreview,
            dataSnapshot: data.dataSnapshot,
            purpose: data.purpose,
            legalBasis: data.legalBasis,
            instructions: data.instructions,
            missingFields: data.missingFields,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          },
          update: {
            htmlPreview: data.htmlPreview,
            dataSnapshot: data.dataSnapshot,
            missingFields: data.missingFields,
            updatedAt: data.updatedAt,
          },
        });
      }),
    );
  }
}
