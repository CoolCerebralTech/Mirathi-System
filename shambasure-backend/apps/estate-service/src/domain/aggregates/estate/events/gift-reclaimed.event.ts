import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface GiftReclaimedEventPayload {
  giftId: string;
  estateId: string;
  recipientId: string;
  originalValue: number;
  currency: string;
  reason: string;
  reclaimedAt: Date;
}

export class GiftReclaimedEvent extends DomainEvent<GiftReclaimedEventPayload> {
  constructor(props: DomainEventProps<GiftReclaimedEventPayload>) {
    super(props);
  }

  get giftId(): string {
    return this.payload.giftId;
  }

  get estateId(): string {
    return this.payload.estateId;
  }

  get recipientId(): string {
    return this.payload.recipientId;
  }

  get reason(): string {
    return this.payload.reason;
  }
}