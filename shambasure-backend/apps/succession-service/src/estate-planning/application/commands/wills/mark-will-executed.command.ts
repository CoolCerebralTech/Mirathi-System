// mark-will-executed.command.ts
import { ICommand } from '@nestjs/cqrs';

import { MarkWillExecutedDto } from '../../dto/requests/mark-will-executed.dto';

export class MarkWillExecutedCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: MarkWillExecutedDto,
  ) {}
}
