// commands/assets/update-asset-valuation.command.ts
import { ICommand } from '@nestjs/cqrs';

import { UpdateAssetValuationDto } from '../../dto/requests/update-asset-valuation.dto';

export class UpdateAssetValuationCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly data: UpdateAssetValuationDto,
    public readonly correlationId?: string,
  ) {}
}
