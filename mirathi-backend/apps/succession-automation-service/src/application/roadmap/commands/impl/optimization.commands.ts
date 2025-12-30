// src/succession-automation/src/application/roadmap/commands/impl/optimization.commands.ts
import { ICommand } from '@nestjs/cqrs';

import { OptimizeRoadmapDto } from '../dtos/lifecycle.dtos';

export class OptimizeRoadmapCommand implements ICommand {
  constructor(
    public readonly dto: OptimizeRoadmapDto,
    public readonly traceId: string,
  ) {}
}
