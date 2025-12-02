// get-will-statistics.handler.ts
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { WillRepository } from '../../infrastructure/repositories/will.repository';
import { GetWillStatisticsQuery } from './get-will-statistics.query';

interface WillStatisticsResponse {
  testatorId: string;
  totalWills: number;
  activeWills: number;
  draftWills: number;
  witnessedWills: number;
  revokedWills: number;
  completedWills: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  recentActivity: {
    lastCreated: Date | null;
    lastUpdated: Date | null;
    lastActivated: Date | null;
  };
  complianceStats: {
    withLegalCapacity: number;
    withTestatorSignature: number;
    withMinimumWitnesses: number;
    fullyCompliant: number;
  };
}

@QueryHandler(GetWillStatisticsQuery)
export class GetWillStatisticsHandler implements IQueryHandler<GetWillStatisticsQuery> {
  constructor(
    private readonly willRepository: WillRepository,
    private readonly logger: Logger,
  ) {}

  async execute(query: GetWillStatisticsQuery): Promise<WillStatisticsResponse> {
    const { testatorId } = query;

    this.logger.debug(`Fetching will statistics for testator ${testatorId}`);

    // Get all wills for the testator
    const wills = await this.willRepository.findByTestatorId(testatorId);

    // Calculate statistics
    const totalWills = wills.length;
    const activeWills = wills.filter((w) => w.status === 'ACTIVE' && !w.isRevoked).length;
    const draftWills = wills.filter((w) => w.status === 'DRAFT').length;
    const witnessedWills = wills.filter((w) => w.status === 'WITNESSED').length;
    const revokedWills = wills.filter((w) => w.isRevoked).length;
    const completedWills = wills.filter((w) => w.status === 'EXECUTED').length;

    // Group by status
    const byStatus: Record<string, number> = {};
    wills.forEach((will) => {
      const status = will.status;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    // Group by type
    const byType: Record<string, number> = {};
    wills.forEach((will) => {
      const type = will.type;
      byType[type] = (byType[type] || 0) + 1;
    });

    // Recent activity
    const sortedByCreated = [...wills].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const sortedByUpdated = [...wills].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
    const activatedWills = wills.filter((w) => w.activatedAt);
    const sortedByActivated = activatedWills.sort(
      (a, b) => (b.activatedAt?.getTime() || 0) - (a.activatedAt?.getTime() || 0),
    );

    // Compliance stats
    const withLegalCapacity = wills.filter(
      (w) => w.legalCapacityStatus === 'ASSESSED_COMPETENT',
    ).length;
    const withTestatorSignature = wills.filter((w) => w.hasTestatorSignature).length;
    const withMinimumWitnesses = wills.filter(
      (w) => w.witnessCount >= w.minimumWitnessesRequired,
    ).length;
    const fullyCompliant = wills.filter(
      (w) =>
        w.legalCapacityStatus === 'ASSESSED_COMPETENT' &&
        w.hasTestatorSignature &&
        w.witnessCount >= w.minimumWitnessesRequired &&
        w.signatureWitnessed &&
        w.meetsKenyanFormalities &&
        !w.isRevoked,
    ).length;

    const response: WillStatisticsResponse = {
      testatorId,
      totalWills,
      activeWills,
      draftWills,
      witnessedWills,
      revokedWills,
      completedWills,
      byStatus,
      byType,
      recentActivity: {
        lastCreated: sortedByCreated[0]?.createdAt || null,
        lastUpdated: sortedByUpdated[0]?.updatedAt || null,
        lastActivated: sortedByActivated[0]?.activatedAt || null,
      },
      complianceStats: {
        withLegalCapacity,
        withTestatorSignature,
        withMinimumWitnesses,
        fullyCompliant,
      },
    };

    this.logger.debug(`Statistics fetched for testator ${testatorId}: ${totalWills} wills total`);
    return response;
  }
}
