// src/succession-automation/src/application/roadmap/commands/impl/generate-roadmap.command.ts
import { ICommand } from '@nestjs/cqrs';

import { GenerateRoadmapDto } from '../dtos/lifecycle.dtos';

export class GenerateRoadmapCommand implements ICommand {
  constructor(
    public readonly dto: GenerateRoadmapDto,
    public readonly traceId: string, // Good practice for distributed tracing
  ) {}
}
