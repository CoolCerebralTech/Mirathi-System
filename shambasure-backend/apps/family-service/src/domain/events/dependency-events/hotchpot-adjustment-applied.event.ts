import { DomainEvent } from '../../base/domain-event';

// domain/events/dependency-events/hotchpot-adjustment-applied.event.ts
export class HotchpotAdjustmentAppliedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    public readonly payload: {
      assessmentId: string;
      giftId: string;
      recipientId: string;
      giftValue: number;
      dateOfGift: Date;
    },
  ) {
    super(aggregateId, aggregateType, version);
  }

  protected getPayload(): Record<string, any> {
    return {
      assessmentId: this.payload.assessmentId,
      giftId: this.payload.giftId,
      recipientId: this.payload.recipientId,
      giftValue: this.payload.giftValue,
      dateOfGift: this.payload.dateOfGift.toISOString(),
    };
  }
}
