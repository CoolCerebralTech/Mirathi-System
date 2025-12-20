import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface DebtSettledEventPayload {
  debtId: string;
  estateId: string;
  creditorName: string;
  settlementDate: Date;
  totalPaid: number;
  currency: string;
  paymentMethod: string;
}

export class DebtSettledEvent extends DomainEvent<DebtSettledEventPayload> {
  constructor(props: DomainEventProps<DebtSettledEventPayload>) {
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

  get totalPaid(): number {
    return this.payload.totalPaid;
  }
}