// domain/events/dependency-events/dependant-declared.event.ts
import { DependencyLevel } from '@prisma/client';

import { DomainEvent } from '../../base/domain-event';

export interface DependantDeclaredEventPayload {
  legalDependantId: string;
  deceasedId: string;
  dependantId: string;
  dependencyBasis: string;
  dependencyLevel: DependencyLevel;
  isMinor: boolean;
  timestamp: Date;
}

export class DependantDeclaredEvent extends DomainEvent<DependantDeclaredEventPayload> {
  constructor(payload: Omit<DependantDeclaredEventPayload, 'timestamp'>) {
    super('DependantDeclared', payload.legalDependantId, 'LegalDependant', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
