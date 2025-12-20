import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface AssetAddedToEstateEventPayload {
  assetId: string;
  estateId: string;
  assetType: string;
  assetName: string;
  createdAt: Date;
}

export class AssetAddedToEstateEvent extends DomainEvent<AssetAddedToEstateEventPayload> {
  constructor(props: DomainEventProps<AssetAddedToEstateEventPayload>) {
    super(props);
  }

  get assetId(): string {
    return this.payload.assetId;
  }

  get estateId(): string {
    return this.payload.estateId;
  }

  get assetType(): string {
    return this.payload.assetType;
  }

  get assetName(): string {
    return this.payload.assetName;
  }
}