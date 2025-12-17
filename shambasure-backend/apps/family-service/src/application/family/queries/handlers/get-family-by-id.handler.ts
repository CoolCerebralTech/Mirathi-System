// application/family/queries/handlers/get-family-by-id.handler.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { IMarriageRepository } from '../../../../domain/interfaces/repositories/imarriage.repository';
import { IPolygamousHouseRepository } from '../../../../domain/interfaces/repositories/ipolygamous-house.repository';
import { Result } from '../../common/result';
import { FamilyResponse } from '../../dto/response/family.response';
import { FamilyMemberMapper } from '../../mappers/family-member.mapper';
import { FamilyMapper } from '../../mappers/family.mapper';
import { MarriageMapper } from '../../mappers/marriage.mapper';
import { PolygamousHouseMapper } from '../../mappers/polygamous-house.mapper';
import { GetFamilyByIdQuery } from '../impl/get-family-by-id.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(GetFamilyByIdQuery)
export class GetFamilyByIdHandler extends BaseQueryHandler<
  GetFamilyByIdQuery,
  Result<FamilyResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly marriageRepository: IMarriageRepository,
    private readonly polygamousHouseRepository: IPolygamousHouseRepository,
    private readonly familyMapper: FamilyMapper,
    private readonly familyMemberMapper: FamilyMemberMapper,
    private readonly marriageMapper: MarriageMapper,
    private readonly polygamousHouseMapper: PolygamousHouseMapper,
    queryBus: any,
  ) {
    super(queryBus);
  }

  async execute(query: GetFamilyByIdQuery): Promise<Result<FamilyResponse>> {
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

      // Check user permissions (in production, you'd have proper authorization)
      await this.checkUserPermissions(query.userId, family);

      // Map family to response
      const response = this.familyMapper.toDTO(family);

      // Load additional data if requested
      if (query.includeMembers) {
        const members = await this.familyMemberRepository.findAllByFamilyId(query.familyId);
        response.members = this.familyMemberMapper.toDTOList(members);
      }

      if (query.includeMarriages) {
        const marriages = await this.marriageRepository.findAllByFamilyId(query.familyId);
        response.marriages = await Promise.all(
          marriages.map(async (marriage) => {
            const marriageResponse = this.marriageMapper.toDTO(marriage);
            // Load spouse details
            const [spouse1, spouse2] = await Promise.all([
              this.familyMemberRepository.findById(marriage.spouse1Id),
              this.familyMemberRepository.findById(marriage.spouse2Id),
            ]);
            if (spouse1) {
              marriageResponse.spouse1 = {
                id: spouse1.id,
                name: `${spouse1.name.firstName} ${spouse1.name.lastName}`,
                gender: spouse1.gender || '',
                isDeceased: spouse1.isDeceased,
              };
            }
            if (spouse2) {
              marriageResponse.spouse2 = {
                id: spouse2.id,
                name: `${spouse2.name.firstName} ${spouse2.name.lastName}`,
                gender: spouse2.gender || '',
                isDeceased: spouse2.isDeceased,
              };
            }
            return marriageResponse;
          }),
        );
      }

      if (query.includePolygamousHouses) {
        const houses = await this.polygamousHouseRepository.findAllByFamilyId(query.familyId);
        response.polygamousHouses = await Promise.all(
          houses.map(async (house) => {
            const houseResponse = this.polygamousHouseMapper.toDTO(house);
            // Load house head details if available
            if (house.houseHeadId) {
              const houseHead = await this.familyMemberRepository.findById(house.houseHeadId);
              if (houseHead) {
                houseResponse.houseHead = {
                  id: houseHead.id,
                  name: `${houseHead.name.firstName} ${houseHead.name.lastName}`,
                  gender: houseHead.gender || '',
                  isDeceased: houseHead.isDeceased,
                  age: houseHead.currentAge || 0,
                  isIdentityVerified: houseHead.isIdentityVerified,
                };
              }
            }
            return houseResponse;
          }),
        );
      }

      if (query.includeCompliance) {
        // Load compliance data
        response.compliance = await this.calculateComplianceData(family);
      }

      this.logSuccess(query, response, 'Family retrieved');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, query, 'GetFamilyByIdHandler');
    }
  }

  private async checkUserPermissions(userId: string, family: any): Promise<void> {
    // In production, implement proper authorization logic
    // For now, we'll just log a warning if the user is not the creator
    if (family.creatorId !== userId) {
      this.logger.warn(
        `User ${userId} accessing family ${family.id} created by ${family.creatorId}`,
      );
    }
  }

  private async calculateComplianceData(family: any): Promise<any> {
    // Implement comprehensive compliance calculation
    const houses = await this.polygamousHouseRepository.findAllByFamilyId(family.id);
    const members = await this.familyMemberRepository.findAllByFamilyId(family.id);
    const marriages = await this.marriageRepository.findAllByFamilyId(family.id);

    const s40CompliantHouses = houses.filter((h) => h.s40ComplianceStatus === 'COMPLIANT').length;
    const s40ComplianceRate = houses.length > 0 ? (s40CompliantHouses / houses.length) * 100 : 100;

    const potentialS29Dependants = members.filter((m) => m.isPotentialDependant).length;

    return {
      s40Compliance: {
        totalHouses: houses.length,
        compliantHouses: s40CompliantHouses,
        complianceRate: s40ComplianceRate,
        status:
          s40ComplianceRate >= 80
            ? 'COMPLIANT'
            : s40ComplianceRate >= 50
              ? 'PARTIAL'
              : 'NON_COMPLIANT',
      },
      s29Compliance: {
        potentialDependants: potentialS29Dependants,
        status: potentialS29Dependants === 0 ? 'COMPLIANT' : 'REQUIRES_REVIEW',
      },
      overallCompliance: {
        score: this.calculateOverallComplianceScore(s40ComplianceRate, potentialS29Dependants),
        status: this.determineOverallComplianceStatus(s40ComplianceRate, potentialS29Dependants),
      },
      lastChecked: new Date(),
    };
  }

  private calculateOverallComplianceScore(
    s40ComplianceRate: number,
    s29Dependants: number,
  ): number {
    // Weight S.40 compliance more heavily
    const s40Weight = 0.6;
    const s29Weight = 0.4;

    const s40Score = s40ComplianceRate;
    const s29Score = s29Dependants === 0 ? 100 : Math.max(0, 100 - s29Dependants * 10);

    return Math.round(s40Score * s40Weight + s29Score * s29Weight);
  }

  private determineOverallComplianceStatus(
    s40ComplianceRate: number,
    s29Dependants: number,
  ): string {
    const score = this.calculateOverallComplianceScore(s40ComplianceRate, s29Dependants);

    if (score >= 80) return 'COMPLIANT';
    if (score >= 60) return 'PARTIAL';
    return 'NON_COMPLIANT';
  }
}
