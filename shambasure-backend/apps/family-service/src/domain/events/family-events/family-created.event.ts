import { KenyanCounty } from '@prisma/client';

import { DomainEvent } from '../../base/domain-event';

export interface FamilyCreatedEventPayload {
  familyId: string;
  creatorId: string;
  name: string;
  clanName?: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
  homeCounty?: KenyanCounty;
  timestamp: Date;
}

export class FamilyCreatedEvent extends DomainEvent<FamilyCreatedEventPayload> {
  constructor(payload: Omit<FamilyCreatedEventPayload, 'timestamp'>) {
    super('FamilyCreated', payload.familyId, 'Family', {
      ...payload,
      timestamp: new Date(),
    });
  }
}
