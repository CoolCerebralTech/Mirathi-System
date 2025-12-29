// src/succession-automation/src/application/roadmap/commands/impl/task-execution.commands.ts
import { ICommand } from '@nestjs/cqrs';

import { SkipTaskDto, StartTaskDto, SubmitTaskProofDto } from '../dtos/task-execution.dtos';

export class StartTaskCommand implements ICommand {
  constructor(
    public readonly dto: StartTaskDto,
    public readonly traceId: string,
  ) {}
}

export class SubmitTaskProofCommand implements ICommand {
  constructor(
    public readonly dto: SubmitTaskProofDto,
    public readonly traceId: string,
  ) {}
}

export class SkipTaskCommand implements ICommand {
  constructor(
    public readonly dto: SkipTaskDto,
    public readonly traceId: string,
  ) {}
}
