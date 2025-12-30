// src/succession-automation/src/application/roadmap/commands/impl/risk.commands.ts
import { ICommand } from '@nestjs/cqrs';

import { LinkRiskToTaskDto } from '../dtos/risk-management.dtos';

export class LinkRiskToTaskCommand implements ICommand {
  constructor(
    public readonly dto: LinkRiskToTaskDto,
    public readonly traceId: string,
  ) {}
}
