// create-will.command.ts
import { ICommand } from '@nestjs/cqrs';
import { WillType } from '@prisma/client';

import { CreateWillDto } from '../../dto/requests/create-will.dto';

export class CreateWillCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: CreateWillDto,
  ) {}
}
