// commands/assets/set-asset-encumbrance.command.ts
import { ICommand } from '@nestjs/cqrs';

import { SetAssetEncumbranceDto } from '../../dtos/requests/set-asset-encumbrance.dto';

export class SetAssetEncumbranceCommand implements ICommand {
  constructor(
    public readonly assetId: string,
    public readonly estatePlanningId: string,
    public readonly data: SetAssetEncumbranceDto,
    public readonly correlationId?: string,
  ) {}
}
