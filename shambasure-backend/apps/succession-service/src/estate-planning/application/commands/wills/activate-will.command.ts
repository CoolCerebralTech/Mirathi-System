// activate-will.command.ts
import { ICommand } from '@nestjs/cqrs';

import { ActivateWillDto } from '../../dto/requests/activate-will.dto';

export class ActivateWillCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: ActivateWillDto,
  ) {}
}
