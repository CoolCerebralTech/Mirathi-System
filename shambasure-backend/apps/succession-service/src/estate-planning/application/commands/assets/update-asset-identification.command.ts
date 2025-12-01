// commands/assets/update-asset-identification.command.ts
import { ICommand } from '@nestjs/cqrs';

export class UpdateAssetIdentificationCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly titleDeedNumber?: string,
    public readonly registrationNumber?: string,
    public readonly kraPin?: string,
    public readonly identificationDetails?: Record<string, any>,
    public readonly correlationId?: string,
  ) {}
}
