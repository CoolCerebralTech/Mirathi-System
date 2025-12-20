import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface EstateFrozenEventPayload {
  estateId: string;
  dateOfDeath: Date;
  frozenAt: Date;
  deathCertNumber?: string;
  reason: string;
}

export class EstateFrozenEvent extends DomainEvent<EstateFrozenEventPayload> {
  constructor(props: DomainEventProps<EstateFrozenEventPayload>) {
    super(props);
  }

  get estateId(): string {
    return this.payload.estateId;
  }

  get dateOfDeath(): Date {
    return this.payload.dateOfDeath;
  }

  get frozenAt(): Date {
    return this.payload.frozenAt;
  }

  get reason(): string {
    return this.payload.reason;
  }
}
