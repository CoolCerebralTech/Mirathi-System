import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface AssetLifeInterestCreatedEventPayload {
  assetId: string;
  holderId: string;
  endsAt: Date;
  reason: string;
  createdAt: Date;
}

export class AssetLifeInterestCreatedEvent extends DomainEvent<AssetLifeInterestCreatedEventPayload> {
  constructor(props: DomainEventProps<AssetLifeInterestCreatedEventPayload>) {
    super(props);
  }

  get assetId(): string {
    return this.payload.assetId;
  }

  get holderId(): string {
    return this.payload.holderId;
  }

  get endsAt(): Date {
    return this.payload.endsAt;
  }

  get reason(): string {
    return this.payload.reason;
  }
}
