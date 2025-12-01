// contest-will.command.ts
import { ICommand } from '@nestjs/cqrs';

import { ContestWillDto } from '../../dto/requests/contest-will.dto';

export class ContestWillCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: ContestWillDto,
  ) {}
}
