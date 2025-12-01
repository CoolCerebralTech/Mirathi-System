// set-will-storage.command.ts
import { ICommand } from '@nestjs/cqrs';

import { SetWillStorageDto } from '../../dto/requests/set-will-storage.dto';

export class SetWillStorageCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: SetWillStorageDto,
  ) {}
}
