// mark-will-witnessed.command.ts
import { ICommand } from '@nestjs/cqrs';

import { MarkWillWitnessedDto } from '../../dto/requests/mark-will-witnessed.dto';

export class MarkWillWitnessedCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: MarkWillWitnessedDto,
  ) {}
}
