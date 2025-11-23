import { AssetValue } from '../../../estate-planning/domain/value-objects/asset-value.vo';

export class ClaimFiledEvent {
  constructor(
    public readonly claimId: string,
    public readonly estateId: string,
    public readonly creditorName: string,
    public readonly amount: AssetValue,
    public readonly documentId?: string,
    public readonly claimType?: string,
  ) {}

  getEventType(): string {
    return 'ClaimFiledEvent';
  }

  getPayload() {
    return {
      claimId: this.claimId,
      estateId: this.estateId,
      creditorName: this.creditorName,
      amount: this.amount.getAmount(),
      currency: this.amount.getCurrency(),
      documentId: this.documentId,
      claimType: this.claimType,
    };
  }
}
