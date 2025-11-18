// estate-planning/application/commands/remove-asset.command.ts
export class RemoveAssetCommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly assetId: string,
  ) {}
}
