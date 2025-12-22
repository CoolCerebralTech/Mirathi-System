// application/guardianship/queries/handlers/find-guardianships.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { IGuardianRepository } from '../../../../domain/interfaces/repositories/iguardian.repository';
import { Result } from '../../../common/base/result';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';
import { GuardianshipSummaryResponse } from '../../dto/response/guardianship-summary.response';
import { FindGuardianshipsQuery } from '../impl/find-guardianships.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(FindGuardianshipsQuery)
export class FindGuardianshipsHandler
  extends BaseQueryHandler<
    FindGuardianshipsQuery,
    Result<PaginatedResponse<GuardianshipSummaryResponse>>
  >
  implements
    IQueryHandler<FindGuardianshipsQuery, Result<PaginatedResponse<GuardianshipSummaryResponse>>>
{
  constructor(
    private readonly guardianRepository: IGuardianRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
  ) {
    super();
  }

  async execute(
    query: FindGuardianshipsQuery,
  ): Promise<Result<PaginatedResponse<GuardianshipSummaryResponse>>> {
    try {
      // 1. Log query execution
      this.logQueryExecution(query, 'FindGuardianships');

      // 2. Validate query
      const validation = this.validateQuery(query);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // 3. Extract pagination
      const { page = 1, limit = 20 } = query.pagination || {};
      const skip = (page - 1) * limit;

      // 4. Build repository query filters
      const filters = this.buildFilters(query);

      // 5. Get total count
      const total = await this.guardianRepository.count(filters);

      // 6. Get paginated results
      const guardians = await this.guardianRepository.find(
        filters,
        skip,
        limit,
        query.sortBy,
        query.sortDirection,
      );

      // 7. Convert to aggregates and map to responses
      const responses = await Promise.all(
        guardians.map(async (guardian) => {
          const aggregate = GuardianshipAggregate.createFromProps(guardian.toJSON());
          const denormalizedData = query.includeDenormalizedData
            ? await this.loadDenormalizedData(aggregate)
            : {};
          return this.mapToSummaryResponse(aggregate, denormalizedData);
        }),
      );

      // 8. Build paginated response
      const paginatedResponse = new PaginatedResponse(responses, page, limit, total);

      // 9. Log success
      this.logQuerySuccess(query, responses.length, 'FindGuardianships');

      return Result.ok(paginatedResponse);
    } catch (error) {
      this.handleError(error, query, 'FindGuardianshipsHandler');
      return Result.fail(new Error('Failed to find guardianships'));
    }
  }

  private buildFilters(query: FindGuardianshipsQuery): any {
    const filters: any = {};

    // Basic filters
    if (query.wardId) filters.wardId = query.wardId;
    if (query.guardianId) filters.guardianId = query.guardianId;
    if (query.type) filters.type = query.type;
    if (typeof query.isActive === 'boolean') filters.isActive = query.isActive;
    if (typeof query.bondRequired === 'boolean') filters.bondRequired = query.bondRequired;
    if (typeof query.isBondPosted === 'boolean') filters.isBondPosted = query.isBondPosted;
    if (typeof query.hasPropertyManagementPowers === 'boolean') {
      filters.hasPropertyManagementPowers = query.hasPropertyManagementPowers;
    }
    if (query.courtCaseNumber) filters.courtCaseNumber = query.courtCaseNumber;
    if (query.courtStation) filters.courtStation = query.courtStation;
    if (query.reportStatus) filters.reportStatus = query.reportStatus;

    // Compliance filters
    if (typeof query.isCompliant === 'boolean') {
      filters.isCompliantWithKenyanLaw = query.isCompliant;
    }
    if (query.s72ComplianceStatus) {
      filters.s72ComplianceStatus = query.s72ComplianceStatus;
    }
    if (query.s73ComplianceStatus) {
      filters.s73ComplianceStatus = query.s73ComplianceStatus;
    }

    // Term status filter
    if (query.termStatus) {
      const now = new Date();
      switch (query.termStatus) {
        case 'ACTIVE':
          filters.isActive = true;
          filters.$or = [{ validUntil: { $gt: now } }, { validUntil: null }];
          break;
        case 'EXPIRED':
          filters.isActive = true;
          filters.validUntil = { $lt: now };
          break;
        case 'TERMINATED':
          filters.isActive = false;
          break;
      }
    }

    return filters;
  }

  private async loadDenormalizedData(aggregate: GuardianshipAggregate): Promise<{
    wardName?: string;
    guardianName?: string;
    wardAge?: number;
  }> {
    const data: any = {};

    try {
      // Load ward data
      const ward = await this.familyMemberRepository.findById(aggregate.wardId);
      if (ward) {
        data.wardName = `${ward.firstName} ${ward.lastName}`;
        data.wardAge = this.calculateAge(ward.dateOfBirth);
      }

      // Load guardian data
      const guardian = await this.familyMemberRepository.findById(aggregate.guardianId);
      if (guardian) {
        data.guardianName = `${guardian.firstName} ${guardian.lastName}`;
      }

      return data;
    } catch (error) {
      this.logger.warn(`Failed to load denormalized data: ${error.message}`);
      return data;
    }
  }

  private mapToSummaryResponse(
    aggregate: GuardianshipAggregate,
    denormalizedData: any,
  ): GuardianshipSummaryResponse {
    return {
      id: aggregate.id,
      wardId: aggregate.wardId,
      guardianId: aggregate.guardianId,
      type: aggregate.type,
      isActive: aggregate.isActive,
      isBondPosted: aggregate.isBondPosted,
      isReportOverdue: aggregate.isReportOverdue,
      isCompliant: aggregate.isCompliantWithKenyanLaw,
      createdAt: aggregate.createdAt,
      wardName: denormalizedData.wardName || 'Unknown',
      guardianName: denormalizedData.guardianName || 'Unknown',
      wardAge: denormalizedData.wardAge,
      statusSummary: this.generateStatusSummary(aggregate),
      // Add compliance indicators for quick scanning
      complianceIndicators: {
        s72Compliant: aggregate.s72ComplianceStatus === 'COMPLIANT',
        s73Compliant: aggregate.s73ComplianceStatus === 'COMPLIANT',
        bondExpiringSoon: this.isExpiringSoon(aggregate.bondExpiry, 30),
        reportDueSoon: this.isExpiringSoon(aggregate.nextReportDue, 30),
      },
    };
  }

  private generateStatusSummary(aggregate: GuardianshipAggregate): string {
    if (!aggregate.isActive) {
      return 'Terminated';
    }

    const statusParts: string[] = [];

    if (aggregate.isCompliantWithKenyanLaw) {
      statusParts.push('Compliant');
    } else {
      statusParts.push('Non-Compliant');
    }

    if (aggregate.isReportOverdue) {
      statusParts.push('Report Overdue');
    }

    if (aggregate.isBondExpired) {
      statusParts.push('Bond Expired');
    }

    if (aggregate.isTermExpired) {
      statusParts.push('Term Expired');
    }

    return statusParts.length > 0 ? statusParts.join(' - ') : 'Active';
  }

  private calculateAge(dateOfBirth?: Date): number | undefined {
    if (!dateOfBirth) return undefined;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private isExpiringSoon(date?: Date, daysThreshold: number = 30): boolean {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    const daysDiff = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return daysDiff <= daysThreshold && daysDiff > 0;
  }
}
