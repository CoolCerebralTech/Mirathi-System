// src/succession-automation/src/application/roadmap/commands/impl/phase.commands.ts
import { ICommand } from '@nestjs/cqrs';

import { TransitionPhaseDto } from '../dtos/phase-management.dtos';

export class TransitionPhaseCommand implements ICommand {
  constructor(
    public readonly dto: TransitionPhaseDto,
    public readonly traceId: string,
  ) {}
}
