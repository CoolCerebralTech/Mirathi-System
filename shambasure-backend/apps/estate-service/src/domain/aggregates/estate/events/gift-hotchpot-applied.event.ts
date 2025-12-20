import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface GiftHotchpotAppliedEventPayload {
  giftId: string;
  estateId: string;
  originalValue: number;
  hotchpotValue: number;
  currency: string;
  reconciliationDate: Date;
  inflationRate: number;
  calculatedAt: Date;
}

export class GiftHotchpotAppliedEvent extends DomainEvent<GiftHotchpotAppliedEventPayload> {
  constructor(props: DomainEventProps<GiftHotchpotAppliedEventPayload>) {
    super(props);
  }

  get giftId(): string {
    return this.payload.giftId;
  }

  get originalValue(): number {
    return this.payload.originalValue;
  }

  get hotchpotValue(): number {
    return this.payload.hotchpotValue;
  }

  get inflationRate(): number {
    return this.payload.inflationRate;
  }
}