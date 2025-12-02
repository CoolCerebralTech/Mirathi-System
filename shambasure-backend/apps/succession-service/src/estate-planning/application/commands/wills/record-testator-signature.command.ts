// record-testator-signature.command.ts
import { ICommand } from '@nestjs/cqrs';

import { RecordTestatorSignatureDto } from '../../dto/requests/record-testator-signature.dto';

export class RecordTestatorSignatureCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: RecordTestatorSignatureDto,
  ) {}
}
