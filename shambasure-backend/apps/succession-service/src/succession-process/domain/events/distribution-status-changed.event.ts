import { DistributionStatus } from '@prisma/client';

export class DistributionStatusChangedEvent {
  constructor(
    public readonly distributionId: string,
    public readonly estateId: string,
    public readonly oldStatus: DistributionStatus,
    public readonly newStatus: DistributionStatus,
    public readonly reason?: string,
    public readonly changedBy?: string,
  ) {}

  getEventType(): string {
    return 'DistributionStatusChangedEvent';
  }
}
