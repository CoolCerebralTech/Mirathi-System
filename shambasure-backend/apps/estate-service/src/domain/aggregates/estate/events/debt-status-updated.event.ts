import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface DebtStatusUpdatedEventPayload {
  debtId: string;
  newStatus: string;
  outstandingBalance?: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: Date;
  previousStatus?: string;
  reason?: string;
  writtenOffBy?: string;
  updatedAt: Date;
}

export class DebtStatusUpdatedEvent extends DomainEvent<DebtStatusUpdatedEventPayload> {
  constructor(props: DomainEventProps<DebtStatusUpdatedEventPayload>) {
    super(props);
  }

  get debtId(): string {
    return this.payload.debtId;
  }

  get newStatus(): string {
    return this.payload.newStatus;
  }

  get previousStatus(): string | undefined {
    return this.payload.previousStatus;
  }
}