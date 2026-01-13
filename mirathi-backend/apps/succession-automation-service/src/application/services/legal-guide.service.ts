// apps/succession-automation-service/src/application/services/legal-guide.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SuccessionRegime, SuccessionReligion } from '@prisma/client';

import { LegalGuide } from '../../domain/entities/legal-guide.entity';
import type { ILegalGuideRepository } from '../../domain/repositories/legal-guide.repository';
import { LEGAL_GUIDE_REPO } from '../../domain/repositories/legal-guide.repository';

@Injectable()
export class LegalGuideService {
  constructor(
    @Inject(LEGAL_GUIDE_REPO)
    private readonly legalGuideRepo: ILegalGuideRepository,
  ) {}

  /**
   * Fetch a specific legal guide by its URL-friendly slug.
   * Automatically increments the view count.
   */
  async getGuideBySlug(slug: string): Promise<LegalGuide> {
    const guide = await this.legalGuideRepo.findBySlug(slug);

    if (!guide) {
      throw new NotFoundException(`Legal guide with slug '${slug}' not found`);
    }

    // Business Logic: Track engagement
    guide.incrementViewCount();
    await this.legalGuideRepo.save(guide);

    return guide;
  }

  /**
   * Fetch guides for a specific category (e.g., "Forms", "Process", "Disputes").
   */
  async getGuidesByCategory(category: string): Promise<LegalGuide[]> {
    return this.legalGuideRepo.findByCategory(category);
  }

  /**
   * Get smart recommendations based on the user's succession context.
   * e.g., If user is Muslim, show Kadhi's Court guides.
   * e.g., If Intestate, show "Letter from Chief" guides.
   */
  async getRecommendedGuides(
    regime: SuccessionRegime,
    religion: SuccessionReligion,
  ): Promise<LegalGuide[]> {
    return this.legalGuideRepo.findByRegimeAndReligion(regime, religion);
  }
}
