// application/family/queries/handlers/get-family-counts.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { IMarriageRepository } from '../../../../domain/interfaces/repositories/imarriage.repository';
import { IPolygamousHouseRepository } from '../../../../domain/interfaces/repositories/ipolygamous-house.repository';
import { Result } from '../../common/result';
import { FamilyCountsResponse } from '../../dto/response/family-counts.response';
import { GetFamilyCountsQuery } from '../impl/get-family-counts.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(GetFamilyCountsQuery)
export class GetFamilyCountsHandler extends BaseQueryHandler<
  GetFamilyCountsQuery,
  Result<FamilyCountsResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly marriageRepository: IMarriageRepository,
    private readonly polygamousHouseRepository: IPolygamousHouseRepository,
    queryBus: any,
  ) {
    super(queryBus);
  }

  async execute(query: GetFamilyCountsQuery): Promise<Result<FamilyCountsResponse>> {
    try {
      // Validate query
      const validation = this.validateQuery(query);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // Load family
      const family = await this.familyRepository.findById(query.familyId);
      if (!family) {
        return Result.fail(`Family with ID ${query.familyId} not found`);
      }

      // Load detailed statistics
      const statistics = await this.familyMemberRepository.getFamilyMemberStatistics(
        query.familyId,
      );
      const houses = await this.polygamousHouseRepository.findAllByFamilyId(query.familyId);
      const marriages = await this.marriageRepository.findAllByFamilyId(query.familyId);
      const activeMarriages = marriages.filter((m) => m.isActive);

      // Calculate average age
      const averageAge = statistics.averageAge || 0;

      // Calculate S.40 compliance
      const certifiedHouses = houses.filter((h) => h.courtRecognized).length;
      const s40ComplianceStatus = this.determineS40ComplianceStatus(
        family,
        houses,
        certifiedHouses,
      );

      // Build response
      const response: FamilyCountsResponse = {
        familyId: family.id,
        familyName: family.name,
        totalMembers: family.memberCount,
        livingMembers: family.livingMemberCount,
        deceasedMembers: family.deceasedMemberCount,
        minorMembers: family.minorCount,
        dependantMembers: family.dependantCount,
        verifiedIdentityMembers: statistics.identityVerified,
        disabledMembers: statistics.withDisability,
        polygamousHouses: family.polygamousHouseCount,
        marriages: marriages.length,
        activeMarriages: activeMarriages.length,
        endedMarriages: marriages.length - activeMarriages.length,
        customaryMarriages: marriages.filter(
          (m) => m.type === 'CUSTOMARY' || m.type === 'TRADITIONAL',
        ).length,
        islamicMarriages: marriages.filter((m) => m.type === 'ISLAMIC').length,
        civilMarriages: marriages.filter((m) => m.type === 'CIVIL').length,
        christianMarriages: marriages.filter((m) => m.type === 'CHRISTIAN').length,
        averageAge,
        requiresIdentityVerification: statistics.requiresIdentityVerification,
        missingCriticalData: statistics.missingCriticalData,
        s40ComplianceStatus,
        potentialS29Claims: family.dependantCount,
        generations: await this.calculateGenerations(family.id),
        lastUpdated: new Date(),
      };

      this.logSuccess(query, response, 'Family counts retrieved');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, query, 'GetFamilyCountsHandler');
    }
  }

  private determineS40ComplianceStatus(
    family: any,
    houses: any[],
    certifiedHouses: number,
  ): string {
    if (!family.isPolygamous) {
      return 'COMPLIANT';
    }

    if (houses.length === 0) {
      return 'NON_COMPLIANT';
    }

    if (certifiedHouses === houses.length) {
      return 'COMPLIANT';
    }

    if (certifiedHouses > 0) {
      return 'PARTIAL';
    }

    return 'NON_COMPLIANT';
  }

  private async calculateGenerations(familyId: string): Promise<number> {
    // Simplified generation calculation
    // In production, this would analyze the family tree
    const members = await this.familyMemberRepository.findAllByFamilyId(familyId);

    // Find oldest and youngest members
    const ages = members.filter((m) => m.currentAge !== null).map((m) => m.currentAge as number);

    if (ages.length === 0) return 1;

    const maxAge = Math.max(...ages);
    const minAge = Math.min(...ages);
    const ageDifference = maxAge - minAge;

    // Rough estimate: one generation every 25 years
    return Math.max(1, Math.ceil(ageDifference / 25) + 1);
  }
}
