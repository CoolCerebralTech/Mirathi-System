// assess-will-legal-capacity.command.ts
import { ICommand } from '@nestjs/cqrs';

import { AssessLegalCapacityDto } from '../../dto/requests/assess-legal-capacity.dto';

export class AssessWillLegalCapacityCommand implements ICommand {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly data: AssessLegalCapacityDto,
  ) {}
}
