// repositories/legal-guide.repository.interface.ts
import { LegalGuide } from '../entities/legal-guide.entity';

export const LEGAL_GUIDE_REPO = 'LEGAL_GUIDE_REPO';

export interface ILegalGuideRepository {
  findBySlug(slug: string): Promise<LegalGuide | null>;
  findByCategory(category: string): Promise<LegalGuide[]>;
  findByRegimeAndReligion(regime: string, religion: string): Promise<LegalGuide[]>;
  save(guide: LegalGuide): Promise<void>;
}
