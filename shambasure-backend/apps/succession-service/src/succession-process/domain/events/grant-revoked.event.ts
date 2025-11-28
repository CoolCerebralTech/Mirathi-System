export class GrantRevokedEvent {
  constructor(
    public readonly grantId: string,
    public readonly estateId: string,
    public readonly revocationDate: Date,
    public readonly revocationReason: string,
    public readonly revokedBy: string,
    public readonly courtOrderNumber?: string,
  ) {}

  getEventType(): string {
    return 'GrantRevokedEvent';
  }
}
