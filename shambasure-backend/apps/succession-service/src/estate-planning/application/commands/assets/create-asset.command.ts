// commands/assets/create-asset.command.ts
import { ICommand } from '@nestjs/cqrs';

import { CreateAssetDto } from '../../dto/requests/create-asset.dto';

export class CreateAssetCommand implements ICommand {
  constructor(
    public readonly estatePlanningId: string,
    public readonly data: CreateAssetDto,
    public readonly correlationId?: string,
  ) {}
}
