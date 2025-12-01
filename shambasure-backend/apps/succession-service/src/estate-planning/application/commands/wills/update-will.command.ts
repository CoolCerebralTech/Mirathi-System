// update-will.command.ts
import { ICommand } from '@nestjs/cqrs';

import { UpdateWillDto } from '../../dto/requests/update-will.dto';

export class UpdateWillCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: UpdateWillDto,
  ) {}
}
