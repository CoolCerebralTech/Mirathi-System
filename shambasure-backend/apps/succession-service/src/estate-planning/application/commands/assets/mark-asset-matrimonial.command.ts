// commands/assets/mark-asset-matrimonial.command.ts
import { ICommand } from '@nestjs/cqrs';

export class MarkAssetMatrimonialCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly acquiredDuringMarriage: boolean = true,
    public readonly correlationId?: string,
  ) {}
}
