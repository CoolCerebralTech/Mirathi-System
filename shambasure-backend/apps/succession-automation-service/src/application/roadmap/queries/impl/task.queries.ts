// src/succession-automation/src/application/roadmap/queries/impl/task.queries.ts
import { IQuery } from '@nestjs/cqrs';

import { GetTaskDetailsDto, GetTaskHistoryDto } from '../dtos/task-detail.dtos';
import { GetTaskListDto } from '../dtos/task-list.dtos';

export class GetTaskListQuery implements IQuery {
  constructor(
    public readonly dto: GetTaskListDto,
    public readonly traceId: string,
  ) {}
}

export class GetTaskDetailsQuery implements IQuery {
  constructor(
    public readonly dto: GetTaskDetailsDto,
    public readonly traceId: string,
  ) {}
}

export class GetTaskHistoryQuery implements IQuery {
  constructor(
    public readonly dto: GetTaskHistoryDto,
    public readonly traceId: string,
  ) {}
}
