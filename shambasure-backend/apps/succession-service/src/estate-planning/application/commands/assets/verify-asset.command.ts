// commands/assets/verify-asset.command.ts
import { ICommand } from '@nestjs/cqrs';

import { VerifyAssetDto } from '../../dtos/requests/verify-asset.dto';

export class VerifyAssetCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly data: VerifyAssetDto,
    public readonly correlationId?: string,
  ) {}
}
