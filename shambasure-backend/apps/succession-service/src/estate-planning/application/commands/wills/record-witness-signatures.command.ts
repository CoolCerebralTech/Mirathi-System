// record-witness-signatures.command.ts
import { ICommand } from '@nestjs/cqrs';

import { RecordWitnessSignaturesDto } from '../../dto/requests/record-witness-signatures.dto';

export class RecordWitnessSignaturesCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: RecordWitnessSignaturesDto,
  ) {}
}
