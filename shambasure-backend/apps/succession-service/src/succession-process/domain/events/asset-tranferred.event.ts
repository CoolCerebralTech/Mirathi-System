// succession-service/src/succession-process/domain/events/asset-transferred.event.ts

export class AssetTransferredEvent {
  constructor(
    public readonly distributionId: string,
    public readonly estateId: string,
    public readonly assetId: string,
    public readonly transferDate: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}
