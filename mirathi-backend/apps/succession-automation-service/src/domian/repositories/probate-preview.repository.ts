import { ProbatePreview } from '../entities/probate-preview.entity';

export const PROBATE_PREVIEW_REPO = 'PROBATE_PREVIEW_REPO';

export interface IProbatePreviewRepository {
  findByEstateId(estateId: string): Promise<ProbatePreview | null>;
  save(preview: ProbatePreview): Promise<void>;
}
