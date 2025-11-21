// succession-service/src/succession-process/domain/events/dispute-filed.event.ts

import { DisputeType } from '@prisma/client';

export class DisputeFiledEvent {
  constructor(
    public readonly disputeId: string,
    public readonly willId: string, // Or EstateID if intestate
    public readonly disputantId: string,
    public readonly type: DisputeType,
    public readonly description: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
