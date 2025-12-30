import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import { GetEstateDependantsQuery } from '../../impl/dependants.query';
import { DependantItemVM, DependantListVM } from '../../view-models/dependant-list.vm';

@QueryHandler(GetEstateDependantsQuery)
export class GetEstateDependantsHandler implements IQueryHandler<GetEstateDependantsQuery> {
  private readonly logger = new Logger(GetEstateDependantsHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(query: GetEstateDependantsQuery): Promise<Result<DependantListVM>> {
    const { dto } = query;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found: ${dto.estateId}`));

      // 1. Filter Dependants
      let dependants = estate.dependants;
      if (dto.status) {
        dependants = dependants.filter((d) => d.status === dto.status);
      }
      if (dto.hasHighRisk !== undefined) {
        dependants = dependants.filter((d) => (d.riskLevel === 'HIGH') === dto.hasHighRisk);
      }
      if (dto.requiresCourtDetermination !== undefined) {
        dependants = dependants.filter(
          (d) => d.requiresCourtDetermination === dto.requiresCourtDetermination,
        );
      }

      // 2. Map to VM
      const items: DependantItemVM[] = dependants.map((d) => ({
        id: d.id.toString(),
        name: d.dependantName,
        relationship: d.relationship,
        status: d.status,
        isMinor: d.isMinor,
        age: d.age,
        isIncapacitated: d.isIncapacitated,
        riskLevel: d.riskLevel,
        monthlyMaintenanceNeeds: {
          amount: d.monthlyMaintenanceNeeds.amount,
          currency: d.monthlyMaintenanceNeeds.currency,
          formatted: d.monthlyMaintenanceNeeds.toString(),
        },
        proposedAllocation: d.proposedAllocation
          ? {
              amount: d.proposedAllocation.amount,
              currency: d.proposedAllocation.currency,
              formatted: d.proposedAllocation.toString(),
            }
          : undefined,
        evidenceCount: d.evidence.length,
        hasSufficientEvidence: d.hasStrongEvidence(),
      }));

      // 3. Aggregate Calculations
      const totalNeeds = items.reduce((sum, i) => sum + i.monthlyMaintenanceNeeds.amount, 0);
      const highRiskCount = items.filter((i) => i.riskLevel === 'HIGH').length;

      return Result.ok({
        items,
        totalMonthlyNeeds: { amount: totalNeeds, currency: 'KES', formatted: `KES ${totalNeeds}` },
        highRiskCount,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch dependants: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error as Error);
    }
  }
}
