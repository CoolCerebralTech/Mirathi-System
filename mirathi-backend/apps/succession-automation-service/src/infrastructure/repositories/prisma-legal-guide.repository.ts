// infrastructure/adapters/legal-guide.repository.ts
import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { LegalGuide } from '../../domain/entities/legal-guide.entity';
import { ILegalGuideRepository } from '../../domain/repositories/legal-guide.repository';

@Injectable()
export class PrismaLegalGuideRepository implements ILegalGuideRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<LegalGuide | null> {
    const raw = await this.prisma.legalGuide.findUnique({
      where: { slug },
    });

    if (!raw) return null;

    return LegalGuide.fromPersistence({
      id: raw.id,
      category: raw.category,
      title: raw.title,
      slug: raw.slug,
      summary: raw.summary,
      fullContent: raw.fullContent,
      appliesToRegime: raw.appliesToRegime,
      appliesToReligion: raw.appliesToReligion,
      legalSections: raw.legalSections,
      relatedFormTypes: raw.relatedFormTypes,
      relatedTasks: raw.relatedTasks,
      keywords: raw.keywords,
      viewCount: raw.viewCount,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findByCategory(category: string): Promise<LegalGuide[]> {
    const rawGuides = await this.prisma.legalGuide.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });

    return rawGuides.map((guide) =>
      LegalGuide.fromPersistence({
        id: guide.id,
        category: guide.category,
        title: guide.title,
        slug: guide.slug,
        summary: guide.summary,
        fullContent: guide.fullContent,
        appliesToRegime: guide.appliesToRegime,
        appliesToReligion: guide.appliesToReligion,
        legalSections: guide.legalSections,
        relatedFormTypes: guide.relatedFormTypes,
        relatedTasks: guide.relatedTasks,
        keywords: guide.keywords,
        viewCount: guide.viewCount,
        createdAt: guide.createdAt,
        updatedAt: guide.updatedAt,
      }),
    );
  }

  async findByRegimeAndReligion(regime: string, religion: string): Promise<LegalGuide[]> {
    const rawGuides = await this.prisma.legalGuide.findMany({
      where: {
        appliesToRegime: { has: regime },
        appliesToReligion: { has: religion },
      },
      orderBy: { viewCount: 'desc' },
    });

    return rawGuides.map((guide) =>
      LegalGuide.fromPersistence({
        id: guide.id,
        category: guide.category,
        title: guide.title,
        slug: guide.slug,
        summary: guide.summary,
        fullContent: guide.fullContent,
        appliesToRegime: guide.appliesToRegime,
        appliesToReligion: guide.appliesToReligion,
        legalSections: guide.legalSections,
        relatedFormTypes: guide.relatedFormTypes,
        relatedTasks: guide.relatedTasks,
        keywords: guide.keywords,
        viewCount: guide.viewCount,
        createdAt: guide.createdAt,
        updatedAt: guide.updatedAt,
      }),
    );
  }

  async save(guide: LegalGuide): Promise<void> {
    const data = guide.toJSON();

    await this.prisma.legalGuide.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        category: data.category,
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        fullContent: data.fullContent,
        appliesToRegime: data.appliesToRegime,
        appliesToReligion: data.appliesToReligion,
        legalSections: data.legalSections,
        relatedFormTypes: data.relatedFormTypes,
        relatedTasks: data.relatedTasks,
        keywords: data.keywords,
        viewCount: data.viewCount,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        viewCount: data.viewCount,
        updatedAt: data.updatedAt,
      },
    });
  }
}
