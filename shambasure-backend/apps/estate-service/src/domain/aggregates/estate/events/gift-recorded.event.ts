import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface GiftRecordedEventPayload {
  giftId: string;
  estateId: string;
  recipientId: string;
  relationship: string;
  description: string;
  value: number;
  currency: string;
  dateOfGift: Date;
  isSubjectToHotchpot: boolean;
  createdAt: Date;
}

export class GiftRecordedEvent extends DomainEvent<GiftRecordedEventPayload> {
  constructor(props: DomainEventProps<GiftRecordedEventPayload>) {
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

  get value(): number {
    return this.payload.value;
  }

  get isSubjectToHotchpot(): boolean {
    return this.payload.isSubjectToHotchpot;
  }
}