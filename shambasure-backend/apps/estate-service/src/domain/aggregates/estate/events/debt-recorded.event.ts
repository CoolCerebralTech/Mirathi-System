import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface DebtRecordedEventPayload {
  debtId: string;
  estateId: string;
  debtType: string;
  creditorName: string;
  amount: number;
  currency: string;
  liabilityTier: string;
  priority: string;
  incurredDate: Date;
}

export class DebtRecordedEvent extends DomainEvent<DebtRecordedEventPayload> {
  constructor(props: DomainEventProps<DebtRecordedEventPayload>) {
    super(props);
  }

  get debtId(): string {
    return this.payload.debtId;
  }

  get estateId(): string {
    return this.payload.estateId;
  }

  get creditorName(): string {
    return this.payload.creditorName;
  }

  get amount(): number {
    return this.payload.amount;
  }
}