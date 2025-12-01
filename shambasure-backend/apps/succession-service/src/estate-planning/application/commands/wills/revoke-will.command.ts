// revoke-will.command.ts
import { ICommand } from '@nestjs/cqrs';

import { RevokeWillDto } from '../../dto/requests/revoke-will.dto';

export class RevokeWillCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: RevokeWillDto,
  ) {}
}
