import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface EstateDebtPrioritizedEventPayload {
  estateId: string;
  prioritizedAt: Date;
  totalDebts: number;
}

export class EstateDebtPrioritizedEvent extends DomainEvent<EstateDebtPrioritizedEventPayload> {
  constructor(props: DomainEventProps<EstateDebtPrioritizedEventPayload>) {
    super(props);
  }

  get estateId(): string {
    return this.payload.estateId;
  }

  get prioritizedAt(): Date {
    return this.payload.prioritizedAt;
  }

  get totalDebts(): number {
    return this.payload.totalDebts;
  }
}