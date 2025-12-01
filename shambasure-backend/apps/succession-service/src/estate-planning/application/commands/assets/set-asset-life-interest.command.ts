// commands/assets/set-asset-life-interest.command.ts
import { ICommand } from '@nestjs/cqrs';

import { SetAssetLifeInterestDto } from '../../dto/requests/set-asset-life-interest.dto';

export class SetAssetLifeInterestCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly data: SetAssetLifeInterestDto,
    public readonly correlationId?: string,
  ) {}
}
