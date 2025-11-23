import { GrantType } from '@prisma/client';

export class GrantIssuedEvent {
  constructor(
    public readonly grantId: string,
    public readonly estateId: string,
    public readonly applicantId: string,
    public readonly issuedDate: Date,
    public readonly type: GrantType,
    public readonly grantNumber: string,
    public readonly courtStation: string,
    public readonly expiryDate?: Date,
    public readonly conditions?: string[],
  ) {}

  getEventType(): string {
    return 'GrantIssuedEvent';
  }

  getPayload() {
    return {
      grantId: this.grantId,
      estateId: this.estateId,
      applicantId: this.applicantId,
      issuedDate: this.issuedDate,
      type: this.type,
      grantNumber: this.grantNumber,
      courtStation: this.courtStation,
      expiryDate: this.expiryDate,
      conditions: this.conditions,
    };
  }
}
