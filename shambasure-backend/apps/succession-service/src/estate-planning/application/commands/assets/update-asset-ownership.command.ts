// commands/assets/update-asset-ownership.command.ts
import { ICommand } from '@nestjs/cqrs';
import { AssetOwnershipType } from '@prisma/client';

export class UpdateAssetOwnershipCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly ownershipType: AssetOwnershipType,
    public readonly ownershipShare: number,
    public readonly correlationId?: string,
  ) {}
}
