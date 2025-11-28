import { DisputeStatus } from '@prisma/client';

export class DisputeStatusChangedEvent {
  constructor(
    public readonly disputeId: string,
    public readonly willId: string,
    public readonly oldStatus: DisputeStatus,
    public readonly newStatus: DisputeStatus,
    public readonly reason?: string,
    public readonly changedBy?: string,
  ) {}

  getEventType(): string {
    return 'DisputeStatusChangedEvent';
  }
}
