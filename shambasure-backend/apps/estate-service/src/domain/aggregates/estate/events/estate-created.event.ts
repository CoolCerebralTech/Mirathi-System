import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface EstateCreatedEventPayload {
  estateId: string;
  deceasedId: string;
  deceasedFullName: string;
  estateType: string;
  isPolygamous: boolean;
  createdAt: Date;
}

export class EstateCreatedEvent extends DomainEvent<EstateCreatedEventPayload> {
  constructor(props: DomainEventProps<EstateCreatedEventPayload>) {
    super(props);
  }

  get estateId(): string {
    return this.payload.estateId;
  }

  get deceasedId(): string {
    return this.payload.deceasedId;
  }

  get deceasedFullName(): string {
    return this.payload.deceasedFullName;
  }

  get estateType(): string {
    return this.payload.estateType;
  }
}