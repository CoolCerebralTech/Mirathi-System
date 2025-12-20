import { DomainEvent, DomainEventProps } from '../../../base/domain-event';

interface AssetEncumberedEventPayload {
  assetId: string;
  encumbranceType: string;
  amount: number;
  currency: string;
  details: string;
  encumberedAt: Date;
}

export class AssetEncumberedEvent extends DomainEvent<AssetEncumberedEventPayload> {
  constructor(props: DomainEventProps<AssetEncumberedEventPayload>) {
    super(props);
  }

  get assetId(): string {
    return this.payload.assetId;
  }

  get encumbranceType(): string {
    return this.payload.encumbranceType;
  }

  get amount(): number {
    return this.payload.amount;
  }
}