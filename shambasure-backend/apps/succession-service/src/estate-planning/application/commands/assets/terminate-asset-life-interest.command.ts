// commands/assets/terminate-asset-life-interest.command.ts
import { ICommand } from '@nestjs/cqrs';

export class TerminateAssetLifeInterestCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly terminationReason: string,
    public readonly correlationId?: string,
  ) {}
}
