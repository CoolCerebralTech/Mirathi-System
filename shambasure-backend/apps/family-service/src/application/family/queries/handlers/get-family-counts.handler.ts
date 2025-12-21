import { Injectable } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';
import { MarriageType } from '@prisma/client';

import { Family } from '../../../../domain/aggregates/family.aggregate';
import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import { Marriage } from '../../../../domain/entities/marriage.entity';
import { PolygamousHouse } from '../../../../domain/entities/polygamous-house.entity';
import type { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import type { IMarriageRepository } from '../../../../domain/interfaces/repositories/imarriage.repository';
import type { IPolygamousHouseRepository } from '../../../../domain/interfaces/repositories/ipolygamous-house.repository';
import { Result } from '../../../common/base/result';
import { FamilyCountsResponse } from '../../dto/response/family-counts.response';
import { GetFamilyCountsQuery } from '../impl/get-family-counts.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(GetFamilyCountsQuery)
export class GetFamilyCountsHandler extends BaseQueryHandler<
  GetFamilyCountsQuery,
  FamilyCountsResponse
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly marriageRepository: IMarriageRepository,
    private readonly polygamousHouseRepository: IPolygamousHouseRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: GetFamilyCountsQuery): Promise<Result<FamilyCountsResponse>> {
    try {
      const validation = this.validateQuery(query);
      if (validation.isFailure) return Result.fail(validation.error!);

      // 1. Load Family
      const family = await this.familyRepository.findById(query.familyId);
      if (!family) {
        return Result.fail(new Error(`Family with ID ${query.familyId} not found`));
      }

      // 2. Load Related Data
      // In a read-optimized system, this might be a single raw SQL query.
      // Here we use repositories to maintain Domain integrity.
      const members = await this.familyMemberRepository.findAllByFamilyId(query.familyId);
      const marriages = await this.marriageRepository.findAllByFamilyId(query.familyId);
      const houses = await this.polygamousHouseRepository.findAllByFamilyId(query.familyId);

      // 3. Aggregate Data
      const response = this.calculateCounts(family, members, marriages, houses);

      this.logSuccess(query, response, 'Family counts calculated');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, query, 'GetFamilyCountsHandler');
    }
  }

  private calculateCounts(
    family: Family,
    members: FamilyMember[],
    marriages: Marriage[],
    houses: PolygamousHouse[],
  ): FamilyCountsResponse {
    // Member Demographics
    const livingMembers = members.filter((m) => !m.isDeceased);
    const deceasedMembers = members.filter((m) => m.isDeceased);
    const minorMembers = livingMembers.filter((m) => m.isMinor);
    const verifiedMembers = members.filter((m) => m.isIdentityVerified);
    const disabledMembers = members.filter((m) => m.hasDisability);

    // S.29 Dependants (Potential)
    // - Minors
    // - Disabled
    // - Young Adults (18-25, student logic usually handled in Entity)
    const potentialDependants = members.filter((m) => m.isPotentialDependant);

    // Missing Data Check (e.g., Missing Dates of Birth, IDs)
    const missingCriticalData = members.filter(
      (m) =>
        (!m.isDeceased && !m.currentAge && !m.ageCalculation?.dateOfBirth) || // Missing Age
        (!m.isDeceased && !m.identity.nationalId && m.ageCalculation?.isOfMajorityAge), // Missing ID for Adults
    ).length;

    // Average Age Calculation
    const membersWithAge = livingMembers.filter((m) => m.currentAge !== null);
    const totalAge = membersWithAge.reduce((sum, m) => sum + (m.currentAge || 0), 0);
    const averageAge = membersWithAge.length > 0 ? totalAge / membersWithAge.length : null;

    // Marriage Analysis
    const activeMarriages = marriages.filter((m) => m.isActive);
    const endedMarriages = marriages.filter((m) => !m.isActive);

    const customary = marriages.filter(
      (m) => m.type === MarriageType.CUSTOMARY || m.type === MarriageType.TRADITIONAL,
    );
    const islamic = marriages.filter((m) => m.type === MarriageType.ISLAMIC);
    const civil = marriages.filter((m) => m.type === MarriageType.CIVIL);
    const christian = marriages.filter((m) => m.type === MarriageType.CHRISTIAN);

    // S.40 Compliance Status (Simplified for Summary)
    let s40Status = 'NOT_APPLICABLE';
    if (family.isPolygamous) {
      if (houses.length === 0) {
        s40Status = 'NON_COMPLIANT';
      } else {
        // Are all houses court recognized?
        const allCertified = houses.every((h) => h.courtRecognized);
        s40Status = allCertified ? 'COMPLIANT' : 'PENDING';
      }
    }

    return {
      familyId: family.id,
      familyName: family.name,

      // Member Counts
      totalMembers: members.length,
      livingMembers: livingMembers.length,
      deceasedMembers: deceasedMembers.length,
      minorMembers: minorMembers.length,
      dependantMembers: potentialDependants.length,
      verifiedIdentityMembers: verifiedMembers.length,
      disabledMembers: disabledMembers.length,

      // Marriage Counts
      marriages: marriages.length,
      activeMarriages: activeMarriages.length,
      endedMarriages: endedMarriages.length,
      customaryMarriages: customary.length,
      islamicMarriages: islamic.length,
      civilMarriages: civil.length,
      christianMarriages: christian.length,

      // Polygamy
      polygamousHouses: houses.length,
      s40ComplianceStatus: s40Status,

      // Metadata / Analytics
      averageAge: averageAge ? parseFloat(averageAge.toFixed(1)) : null,
      requiresIdentityVerification: livingMembers.length - verifiedMembers.length,
      missingCriticalData,
      potentialS29Claims: potentialDependants.length,

      // Generation approximation (Simple heuristic based on relationship depth if available, else 1)
      generations: 1, // To do real calc requires TreeBuilder, usually too expensive for a Summary Query

      lastUpdated: new Date(),
    };
  }
}
