// succession-service/src/succession-process/domain/events/dispute-resolved.event.ts

import { DisputeStatus } from '@prisma/client';

export class DisputeResolvedEvent {
  constructor(
    public readonly disputeId: string,
    public readonly willId: string,
    public readonly resolution: string,
    public readonly finalStatus: DisputeStatus, // RESOLVED or DISMISSED
    public readonly resolvedAt: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
