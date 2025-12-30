import { ICommand } from '@nestjs/cqrs';

import { DisputeRiskDto } from '../dtos/dispute-risk.dto';

export class DisputeRiskCommand implements ICommand {
  constructor(
    public readonly dto: DisputeRiskDto,
    public readonly userId: string,
  ) {}
}
