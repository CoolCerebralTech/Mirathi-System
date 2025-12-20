import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface EstateHotchpotCalculatedEventPayload {
  estateId: string;
  grossValue: number;
  totalHotchpotValue: number;
  hotchpotAdjustedValue: number;
  currency: string;
  reconciliationDate: Date;
  calculatedAt: Date;
}

export class EstateHotchpotCalculatedEvent extends DomainEvent<EstateHotchpotCalculatedEventPayload> {
  constructor(props: DomainEventProps<EstateHotchpotCalculatedEventPayload>) {
    super(props);
  }

  get estateId(): string {
    return this.payload.estateId;
  }

  get grossValue(): number {
    return this.payload.grossValue;
  }

  get totalHotchpotValue(): number {
    return this.payload.totalHotchpotValue;
  }

  get hotchpotAdjustedValue(): number {
    return this.payload.hotchpotAdjustedValue;
  }

  get reconciliationDate(): Date {
    return this.payload.reconciliationDate;
  }
}