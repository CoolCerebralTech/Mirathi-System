import { DisputeStatus } from '@prisma/client';

export class DisputeResolvedEvent {
  constructor(
    public readonly disputeId: string,
    public readonly willId: string,
    public readonly outcome: string,
    public readonly status: DisputeStatus,
    public readonly resolvedAt: Date,
    public readonly resolutionType?: string,
    public readonly courtOrderNumber?: string,
  ) {}

  getEventType(): string {
    return 'DisputeResolvedEvent';
  }
}
