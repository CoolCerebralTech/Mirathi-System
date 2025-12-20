import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface AssetValueUpdatedEventPayload {
  assetId: string;
  newValue: number;
  currency: string;
  valuedBy: string;
  valuationDate: Date;
  valuationPurpose: string;
}

export class AssetValueUpdatedEvent extends DomainEvent<AssetValueUpdatedEventPayload> {
  constructor(props: DomainEventProps<AssetValueUpdatedEventPayload>) {
    super(props);
  }

  get assetId(): string {
    return this.payload.assetId;
  }

  get newValue(): number {
    return this.payload.newValue;
  }

  get currency(): string {
    return this.payload.currency;
  }
}