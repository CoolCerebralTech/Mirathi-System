import { Injectable } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import { Family } from '../../../../domain/aggregates/family.aggregate';
import type { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import type { IMarriageRepository } from '../../../../domain/interfaces/repositories/imarriage.repository';
import type { IPolygamousHouseRepository } from '../../../../domain/interfaces/repositories/ipolygamous-house.repository';
import { Result } from '../../../common/base/result';
import { FamilyResponse } from '../../dto/response/family.response';
import { FamilyMemberMapper } from '../../mappers/family-member.mapper';
import { FamilyMapper } from '../../mappers/family.mapper';
import { MarriageMapper } from '../../mappers/marriage.mapper';
import { PolygamousHouseMapper } from '../../mappers/polygamous-house.mapper';
import { GetFamilyByIdQuery } from '../impl/get-family-by-id.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(GetFamilyByIdQuery)
export class GetFamilyByIdHandler extends BaseQueryHandler<GetFamilyByIdQuery, FamilyResponse> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly marriageRepository: IMarriageRepository,
    private readonly polygamousHouseRepository: IPolygamousHouseRepository,
    private readonly familyMapper: FamilyMapper,
    private readonly familyMemberMapper: FamilyMemberMapper,
    private readonly marriageMapper: MarriageMapper,
    private readonly polygamousHouseMapper: PolygamousHouseMapper,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: GetFamilyByIdQuery): Promise<Result<FamilyResponse>> {
    try {
      const validation = this.validateQuery(query);
      if (validation.isFailure) return Result.fail(validation.error!);

      // 1. Load Family
      const family = await this.familyRepository.findById(query.familyId);
      if (!family) {
        return Result.fail(new Error(`Family with ID ${query.familyId} not found`));
      }

      await this.checkUserPermissions(query.userId, family);

      // 2. Base Response
      const response = this.familyMapper.toDTO(family);

      // 3. Conditional Data Loading
      if (query.includeMembers) {
        const members = await this.familyMemberRepository.findAllByFamilyId(query.familyId);
        // Cast to any to attach extra field if DTO is strict, or assume DTO has optional 'members'
        (response as any).members = this.familyMemberMapper.toDTOList(members);
      }

      if (query.includeMarriages) {
        const marriages = await this.marriageRepository.findAllByFamilyId(query.familyId);
        const marriageResponses = await Promise.all(
          marriages.map(async (marriage) => {
            const dto = this.marriageMapper.toDTO(marriage);

            // Hydrate Spouse Names
            const [spouse1, spouse2] = await Promise.all([
              this.familyMemberRepository.findById(marriage.spouse1Id),
              this.familyMemberRepository.findById(marriage.spouse2Id),
            ]);

            if (spouse1) {
              dto.spouse1 = {
                id: spouse1.id,
                name: spouse1.name.fullName,
                gender: spouse1.gender || 'UNKNOWN',
                isDeceased: spouse1.isDeceased,
              };
            }
            if (spouse2) {
              dto.spouse2 = {
                id: spouse2.id,
                name: spouse2.name.fullName,
                gender: spouse2.gender || 'UNKNOWN',
                isDeceased: spouse2.isDeceased,
              };
            }
            return dto;
          }),
        );
        (response as any).marriages = marriageResponses;
      }

      if (query.includePolygamousHouses) {
        const houses = await this.polygamousHouseRepository.findAllByFamilyId(query.familyId);
        const houseResponses = await Promise.all(
          houses.map(async (house) => {
            const dto = this.polygamousHouseMapper.toDTO(house);

            // Hydrate House Head
            if (house.houseHeadId) {
              const head = await this.familyMemberRepository.findById(house.houseHeadId);
              if (head) {
                dto.houseHead = {
                  id: head.id,
                  name: head.name.fullName,
                  gender: head.gender || 'FEMALE',
                  isDeceased: head.isDeceased,
                  age: head.currentAge || 0,
                  isIdentityVerified: head.isIdentityVerified,
                };
              }
            }
            return dto;
          }),
        );
        (response as any).polygamousHouses = houseResponses;
      }

      if (query.includeCompliance) {
        (response as any).compliance = await this.calculateComplianceData(family);
      }

      this.logSuccess(query, response, 'Family retrieved');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, query, 'GetFamilyByIdHandler');
    }
  }

  private async checkUserPermissions(userId: string, family: Family): Promise<void> {
    if (family.creatorId !== userId) {
      this.logger.warn(
        `User ${userId} accessing family ${family.id} created by ${family.creatorId}`,
      );
    }
  }

  private async calculateComplianceData(family: Family): Promise<any> {
    const houses = await this.polygamousHouseRepository.findAllByFamilyId(family.id);
    const members = await this.familyMemberRepository.findAllByFamilyId(family.id);

    const s40CompliantHouses = houses.filter((h) => h.s40ComplianceStatus === 'COMPLIANT').length;
    const s40Rate = houses.length > 0 ? (s40CompliantHouses / houses.length) * 100 : 100;
    const potentialS29 = members.filter((m) => m.isPotentialDependant).length;

    return {
      s40Compliance: {
        totalHouses: houses.length,
        compliantHouses: s40CompliantHouses,
        complianceRate: s40Rate,
        status: s40Rate >= 80 ? 'COMPLIANT' : s40Rate >= 50 ? 'PARTIAL' : 'NON_COMPLIANT',
      },
      s29Compliance: {
        potentialDependants: potentialS29,
        status: potentialS29 === 0 ? 'COMPLIANT' : 'REQUIRES_REVIEW',
      },
      overallCompliance: {
        score: this.calculateOverallScore(s40Rate, potentialS29),
        status: this.determineOverallStatus(s40Rate, potentialS29),
      },
      lastChecked: new Date(),
    };
  }

  private calculateOverallScore(s40Rate: number, s29Count: number): number {
    const s40Weight = 0.6;
    const s29Weight = 0.4;
    const s29Score = s29Count === 0 ? 100 : Math.max(0, 100 - s29Count * 10);
    return Math.round(s40Rate * s40Weight + s29Score * s29Weight);
  }

  private determineOverallStatus(s40Rate: number, s29Count: number): string {
    const score = this.calculateOverallScore(s40Rate, s29Count);
    if (score >= 80) return 'COMPLIANT';
    if (score >= 60) return 'PARTIAL';
    return 'NON_COMPLIANT';
  }
}
