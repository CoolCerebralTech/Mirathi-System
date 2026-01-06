import { RoadmapPhase, SuccessionRegime, TaskCategory } from '@prisma/client';

import { RoadmapTask } from '../entities/roadmap-task.entity';
import { SuccessionContext } from '../value-objects/succession-context.vo';

export class RoadmapFactoryService {
  public generateTasks(roadmapId: string, context: SuccessionContext): RoadmapTask[] {
    const tasks: RoadmapTask[] = [];
    let index = 0;

    // --- PHASE 1: PRE-FILING ---

    // 1. Death Cert (Always)
    tasks.push(
      RoadmapTask.create(
        roadmapId,
        RoadmapPhase.PRE_FILING,
        TaskCategory.IDENTITY_VERIFICATION,
        index++,
        'Obtain Death Certificate',
        'Get original death certificate from Civil Registration.',
        [], // No dependencies
      ),
    );

    // 2. Search for Will (Intestate only)
    if (context.regime === SuccessionRegime.INTESTATE) {
      tasks.push(
        RoadmapTask.create(
          roadmapId,
          RoadmapPhase.PRE_FILING,
          TaskCategory.LEGAL_REQUIREMENT,
          index++,
          'Search for Will',
          'Conduct a search at the High Court registry to confirm no will exists.',
          [],
        ),
      );
    }

    // 3. Chief's Letter (Intestate)
    if (context.regime === SuccessionRegime.INTESTATE) {
      tasks.push(
        RoadmapTask.create(
          roadmapId,
          RoadmapPhase.PRE_FILING,
          TaskCategory.DOCUMENT_COLLECTION,
          index++,
          'Letter from Area Chief',
          'Obtain letter from Chief listing all survivors.',
          [],
        ),
      );
    }

    // 4. Family Consents (Complex Cases)
    if (context.isComplexCase()) {
      tasks.push(
        RoadmapTask.create(
          roadmapId,
          RoadmapPhase.PRE_FILING,
          TaskCategory.FAMILY_CONSENT,
          index++,
          'Sign Family Consents (P&A 38)',
          'All adult beneficiaries must consent to the petitioner.',
          [],
        ),
      );
    }

    // --- PHASE 2: FILING ---

    tasks.push(
      RoadmapTask.create(
        roadmapId,
        RoadmapPhase.FILING,
        TaskCategory.COURT_FILING,
        index++,
        'File Petition',
        `Submit forms to the ${context.targetCourt} registry.`,
        [], // Depends on Pre-Filing completion (handled by phase logic)
      ),
    );

    return tasks;
  }
}
