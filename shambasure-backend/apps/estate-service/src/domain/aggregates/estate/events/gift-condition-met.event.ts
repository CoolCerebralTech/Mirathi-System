import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface GiftConditionMetEventPayload {
  giftId: string;
  conditionDescription: string;
  metDate: Date;
  notes: string;
  recordedAt: Date;
}

export class GiftConditionMetEvent extends DomainEvent<GiftConditionMetEventPayload> {
  constructor(props: DomainEventProps<GiftConditionMetEventPayload>) {
    super(props);
  }

  get giftId(): string {
    return this.payload.giftId;
  }

  get conditionDescription(): string {
    return this.payload.conditionDescription;
  }

  get metDate(): Date {
    return this.payload.metDate;
  }
}