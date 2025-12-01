// enable-will-encryption.command.ts
import { ICommand } from '@nestjs/cqrs';

import { EnableWillEncryptionDto } from '../../dto/requests/enable-will-encryption.dto';

export class EnableWillEncryptionCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: EnableWillEncryptionDto,
  ) {}
}
