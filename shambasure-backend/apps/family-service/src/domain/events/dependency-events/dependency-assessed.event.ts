// domain/events/dependency-events/dependency-assessed.event.ts
import { DependencyLevel } from '@prisma/client';

import { DomainEvent } from '../../base/domain-event';

export interface DependencyAssessedEventPayload {
  legalDependantId: string;
  dependencyPercentage: number;
  dependencyLevel: DependencyLevel;
  monthlySupportEvidence?: number;
  dependencyRatio?: number;
  timestamp: Date;
}

export class DependencyAssessedEvent extends DomainEvent<DependencyAssessedEventPayload> {
  constructor(payload: Omit<DependencyAssessedEventPayload, 'timestamp'>) {
    super('DependencyAssessed', payload.legalDependantId, 'LegalDependant', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
