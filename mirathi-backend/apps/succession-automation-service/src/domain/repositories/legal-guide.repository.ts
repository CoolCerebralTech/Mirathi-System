import { SuccessionRegime, SuccessionReligion } from '@prisma/client';

import { LegalGuide } from '../entities/legal-guide.entity';

export const LEGAL_GUIDE_REPO = 'LEGAL_GUIDE_REPO';

export interface ILegalGuideRepository {
  findBySlug(slug: string): Promise<LegalGuide | null>;
  findByCategory(category: string): Promise<LegalGuide[]>;

  // FIXED: Use Enums in signature
  findByRegimeAndReligion(
    regime: SuccessionRegime,
    religion: SuccessionReligion,
  ): Promise<LegalGuide[]>;

  save(guide: LegalGuide): Promise<void>;
}
