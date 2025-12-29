// src/succession-automation/src/application/roadmap/queries/impl/dashboard.queries.ts
import { IQuery } from '@nestjs/cqrs';

import {
  GetCriticalPathDto,
  GetRoadmapAnalyticsDto,
  GetRoadmapDashboardDto,
} from '../dtos/dashboard.dtos';

export class GetRoadmapDashboardQuery implements IQuery {
  constructor(
    public readonly dto: GetRoadmapDashboardDto,
    public readonly traceId: string,
  ) {}
}

export class GetRoadmapAnalyticsQuery implements IQuery {
  constructor(
    public readonly dto: GetRoadmapAnalyticsDto,
    public readonly traceId: string,
  ) {}
}

export class GetCriticalPathQuery implements IQuery {
  constructor(
    public readonly dto: GetCriticalPathDto,
    public readonly traceId: string,
  ) {}
}
