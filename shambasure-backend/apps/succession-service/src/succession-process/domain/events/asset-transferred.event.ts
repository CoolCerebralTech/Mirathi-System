export class AssetTransferredEvent {
  constructor(
    public readonly distributionId: string,
    public readonly estateId: string,
    public readonly assetId: string,
    public readonly transferDate: Date,
    public readonly transferMethod: string,
    public readonly transferReference?: string,
    public readonly transferValue?: number,
  ) {}

  getEventType(): string {
    return 'AssetTransferredEvent';
  }
}
