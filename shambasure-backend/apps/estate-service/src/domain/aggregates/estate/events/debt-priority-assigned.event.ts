import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface DebtPriorityAssignedEventPayload {
  debtId: string;
  oldPriority: string;
  newPriority: string;
  liabilityTier: string;
  updatedAt: Date;
}

export class DebtPriorityAssignedEvent extends DomainEvent<DebtPriorityAssignedEventPayload> {
  constructor(props: DomainEventProps<DebtPriorityAssignedEventPayload>) {
    super(props);
  }

  get debtId(): string {
    return this.payload.debtId;
  }

  get oldPriority(): string {
    return this.payload.oldPriority;
  }

  get newPriority(): string {
    return this.payload.newPriority;
  }
}