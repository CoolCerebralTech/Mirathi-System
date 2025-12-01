// supersede-will.command.ts
import { ICommand } from '@nestjs/cqrs';

import { SupersedeWillDto } from '../../dto/requests/supersede-will.dto';

export class SupersedeWillCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: SupersedeWillDto,
  ) {}
}
