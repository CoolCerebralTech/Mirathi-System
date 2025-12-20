import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface EstateValueCalculatedEventPayload {
  estateId: string;
  grossValue: number;
  totalLiabilities: number;
  netEstateValue: number;
  currency: string;
  calculatedAt: Date;
}

export class EstateValueCalculatedEvent extends DomainEvent<EstateValueCalculatedEventPayload> {
  constructor(props: DomainEventProps<EstateValueCalculatedEventPayload>) {
    super(props);
  }

  get estateId(): string {
    return this.payload.estateId;
  }

  get grossValue(): number {
    return this.payload.grossValue;
  }

  get netEstateValue(): number {
    return this.payload.netEstateValue;
  }

  get currency(): string {
    return this.payload.currency;
  }
}