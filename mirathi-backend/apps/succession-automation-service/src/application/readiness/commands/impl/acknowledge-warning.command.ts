import { ICommand } from '@nestjs/cqrs';

import { AcknowledgeWarningDto } from '../dtos/acknowledge-warning.dto';

export class AcknowledgeWarningCommand implements ICommand {
  constructor(
    public readonly dto: AcknowledgeWarningDto,
    public readonly userId: string,
  ) {}
}
