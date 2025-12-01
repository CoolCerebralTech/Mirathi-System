// commands/assets/update-asset.command.ts
import { ICommand } from '@nestjs/cqrs';

import { UpdateAssetDto } from '../../dtos/requests/update-asset.dto';

export class UpdateAssetCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly data: UpdateAssetDto,
    public readonly correlationId?: string,
  ) {}
}
