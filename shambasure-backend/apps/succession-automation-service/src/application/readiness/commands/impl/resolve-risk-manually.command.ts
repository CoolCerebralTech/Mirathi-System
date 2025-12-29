import { ICommand } from '@nestjs/cqrs';

import { ResolveRiskManuallyDto } from '../dtos/resolve-risk-manually.dto';

export class ResolveRiskManuallyCommand implements ICommand {
  constructor(
    public readonly dto: ResolveRiskManuallyDto,
    public readonly userId: string,
  ) {}
}
