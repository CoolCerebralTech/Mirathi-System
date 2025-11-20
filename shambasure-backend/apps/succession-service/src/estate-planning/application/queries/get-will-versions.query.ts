import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';

export class GetWillVersionsQuery {
  constructor(
    public readonly willId: string,
    public readonly userId: string,
  ) {}
}

export class WillVersionSummary {
  version: number;
  createdAt: Date;
  summary: string; // e.g. "3 Assets, 2 Beneficiaries" derived from snapshot
}

@QueryHandler(GetWillVersionsQuery)
export class GetWillVersionsHandler implements IQueryHandler<GetWillVersionsQuery> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
  ) {}

  async execute(query: GetWillVersionsQuery): Promise<WillVersionSummary[]> {
    const { willId, userId } = query;

    // Check Access via main entity first
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException('Will not found');
    if (aggregate.getWill().getTestatorId() !== userId)
      throw new ForbiddenException('Access denied');

    const versions = await this.willRepository.findVersions(willId);

    return versions.map((v) => ({
      version: v.version,
      createdAt: v.createdAt,
      // We can parse v.data to give a quick summary
      summary: `Snapshot of ${v.data.title || 'Will'}`,
    }));
  }
}
