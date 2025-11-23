import { ShareType } from '../../../common/types/kenyan-law.types';

export class EntitlementCreatedEvent {
  constructor(
    public readonly distributionId: string,
    public readonly estateId: string,
    public readonly beneficiaryId: string,
    public readonly isSystemUser: boolean,
    public readonly assetId: string | null,
    public readonly sharePercentage: number,
    public readonly shareType: ShareType,
    public readonly beneficiaryType: string,
    public readonly condition?: string,
  ) {}

  getEventType(): string {
    return 'EntitlementCreatedEvent';
  }

  getPayload() {
    return {
      distributionId: this.distributionId,
      estateId: this.estateId,
      beneficiaryId: this.beneficiaryId,
      isSystemUser: this.isSystemUser,
      assetId: this.assetId,
      sharePercentage: this.sharePercentage,
      shareType: this.shareType,
      beneficiaryType: this.beneficiaryType,
      condition: this.condition,
    };
  }
}
