// application/guardianship/queries/handlers/find-overdue-guardianships.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { IGuardianRepository } from '../../../../domain/interfaces/repositories/iguardian.repository';
import { Result } from '../../../common/base/result';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';
import { GuardianshipSummaryResponse } from '../../dto/response/guardianship-summary.response';
import { FindOverdueGuardianshipsQuery } from '../impl/find-overdue-guardianships.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(FindOverdueGuardianshipsQuery)
export class FindOverdueGuardianshipsHandler
  extends BaseQueryHandler<
    FindOverdueGuardianshipsQuery,
    Result<PaginatedResponse<GuardianshipSummaryResponse>>
  >
  implements
    IQueryHandler<
      FindOverdueGuardianshipsQuery,
      Result<PaginatedResponse<GuardianshipSummaryResponse>>
    >
{
  constructor(
    private readonly guardianRepository: IGuardianRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
  ) {
    super();
  }

  async execute(
    query: FindOverdueGuardianshipsQuery,
  ): Promise<Result<PaginatedResponse<GuardianshipSummaryResponse>>> {
    try {
      // 1. Log query execution
      this.logQueryExecution(query, 'FindOverdueGuardianships');

      // 2. Validate query
      const validation = this.validateQuery(query);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // 3. Extract pagination
      const { page = 1, limit = 50 } = query.pagination || {};
      const skip = (page - 1) * limit;

      // 4. Find overdue guardianships based on type
      const overdueItems = await this.findOverdueItems(query);

      // 5. Apply pagination
      const paginatedItems = overdueItems.slice(skip, skip + limit);

      // 6. Load denormalized data and map to responses
      const responses = await Promise.all(
        paginatedItems.map(async (item) => {
          const denormalizedData = query.includeDenormalizedData
            ? await this.loadDenormalizedData(item.aggregate)
            : {};
          return this.mapToOverdueResponse(item, denormalizedData);
        }),
      );

      // 7. Build paginated response
      const paginatedResponse = new PaginatedResponse(responses, page, limit, overdueItems.length);

      // 8. Log success with compliance warning if any
      this.logOverdueFindings(overdueItems.length, query.overdueType);

      this.logQuerySuccess(query, responses.length, 'FindOverdueGuardianships');

      return Result.ok(paginatedResponse);
    } catch (error) {
      this.handleError(error, query, 'FindOverdueGuardianshipsHandler');
      return Result.fail(new Error('Failed to find overdue guardianships'));
    }
  }

  private async findOverdueItems(
    query: FindOverdueGuardianshipsQuery,
  ): Promise<
    Array<{ aggregate: GuardianshipAggregate; overdueType: string; daysOverdue: number }>
  > {
    const now = new Date();
    const overdueItems: Array<{
      aggregate: GuardianshipAggregate;
      overdueType: string;
      daysOverdue: number;
    }> = [];

    // Load all active guardianships
    const guardians = await this.guardianRepository.findActiveGuardianships();

    for (const guardian of guardians) {
      const aggregate = GuardianshipAggregate.createFromProps(guardian.toJSON());

      // Check based on overdue type
      if (query.overdueType === 'REPORTS' || query.overdueType === 'ALL') {
        const reportOverdue = this.checkReportOverdue(aggregate, query.daysThreshold);
        if (reportOverdue.isOverdue) {
          overdueItems.push({
            aggregate,
            overdueType: 'REPORT',
            daysOverdue: reportOverdue.daysOverdue,
          });
        }
      }

      if (query.overdueType === 'BONDS' || query.overdueType === 'ALL') {
        const bondOverdue = this.checkBondOverdue(aggregate, query.daysThreshold);
        if (bondOverdue.isOverdue) {
          overdueItems.push({
            aggregate,
            overdueType: 'BOND',
            daysOverdue: bondOverdue.daysOverdue,
          });
        }
      }

      if (query.overdueType === 'TERMS' || query.overdueType === 'ALL') {
        const termOverdue = this.checkTermOverdue(aggregate, query.daysThreshold);
        if (termOverdue.isOverdue) {
          overdueItems.push({
            aggregate,
            overdueType: 'TERM',
            daysOverdue: termOverdue.daysOverdue,
          });
        }
      }
    }

    // Sort by urgency if requested
    if (query.sortByUrgency) {
      overdueItems.sort((a, b) => {
        // Critical: Both bond and report overdue
        const aCritical =
          a.overdueType === 'BOND' && this.checkReportOverdue(a.aggregate, 0).isOverdue;
        const bCritical =
          b.overdueType === 'BOND' && this.checkReportOverdue(b.aggregate, 0).isOverdue;

        if (aCritical && !bCritical) return -1;
        if (!aCritical && bCritical) return 1;

        // Then by days overdue (more overdue first)
        return b.daysOverdue - a.daysOverdue;
      });
    }

    // Apply court station filter
    if (query.courtStation) {
      return overdueItems.filter((item) => item.aggregate.courtStation === query.courtStation);
    }

    return overdueItems;
  }

  private checkReportOverdue(
    aggregate: GuardianshipAggregate,
    daysThreshold: number,
  ): { isOverdue: boolean; daysOverdue: number } {
    if (!aggregate.nextReportDue || !aggregate.hasPropertyManagementPowers) {
      return { isOverdue: false, daysOverdue: 0 };
    }

    const now = new Date();
    const dueDate = new Date(aggregate.nextReportDue);
    const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isOverdue: daysOverdue > daysThreshold,
      daysOverdue: Math.max(0, daysOverdue),
    };
  }

  private checkBondOverdue(
    aggregate: GuardianshipAggregate,
    daysThreshold: number,
  ): { isOverdue: boolean; daysOverdue: number } {
    if (!aggregate.bondExpiry || !aggregate.bondRequired) {
      return { isOverdue: false, daysOverdue: 0 };
    }

    const now = new Date();
    const expiryDate = new Date(aggregate.bondExpiry);
    const daysOverdue = Math.ceil((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isOverdue: daysOverdue > daysThreshold,
      daysOverdue: Math.max(0, daysOverdue),
    };
  }

  private checkTermOverdue(
    aggregate: GuardianshipAggregate,
    daysThreshold: number,
  ): { isOverdue: boolean; daysOverdue: number } {
    if (!aggregate.validUntil) {
      return { isOverdue: false, daysOverdue: 0 };
    }

    const now = new Date();
    const expiryDate = new Date(aggregate.validUntil);
    const daysOverdue = Math.ceil((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isOverdue: daysOverdue > daysThreshold,
      daysOverdue: Math.max(0, daysOverdue),
    };
  }

  private async loadDenormalizedData(aggregate: GuardianshipAggregate): Promise<{
    wardName?: string;
    guardianName?: string;
    wardAge?: number;
    courtStation?: string;
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

      // Court station
      data.courtStation = aggregate.courtStation;

      return data;
    } catch (error) {
      this.logger.warn(`Failed to load denormalized data: ${error.message}`);
      return data;
    }
  }

  private mapToOverdueResponse(
    item: { aggregate: GuardianshipAggregate; overdueType: string; daysOverdue: number },
    denormalizedData: any,
  ): GuardianshipSummaryResponse {
    const urgencyLevel = this.calculateUrgencyLevel(item.daysOverdue, item.overdueType);

    return {
      id: item.aggregate.id,
      wardId: item.aggregate.wardId,
      guardianId: item.aggregate.guardianId,
      type: item.aggregate.type,
      isActive: item.aggregate.isActive,
      isBondPosted: item.aggregate.isBondPosted,
      isReportOverdue: item.aggregate.isReportOverdue,
      isCompliant: item.aggregate.isCompliantWithKenyanLaw,
      createdAt: item.aggregate.createdAt,
      wardName: denormalizedData.wardName || 'Unknown',
      guardianName: denormalizedData.guardianName || 'Unknown',
      wardAge: denormalizedData.wardAge,
      statusSummary: this.generateOverdueStatus(item),
      // Overdue specific data
      overdueDetails: {
        type: item.overdueType,
        daysOverdue: item.daysOverdue,
        urgencyLevel,
        nextAction: this.getNextAction(item),
        legalConsequences: this.getLegalConsequences(item),
      },
    };
  }

  private generateOverdueStatus(item: {
    aggregate: GuardianshipAggregate;
    overdueType: string;
    daysOverdue: number;
  }): string {
    const statusParts: string[] = [];

    switch (item.overdueType) {
      case 'REPORT':
        statusParts.push(`Report Overdue (${item.daysOverdue} days)`);
        break;
      case 'BOND':
        statusParts.push(`Bond Overdue (${item.daysOverdue} days)`);
        break;
      case 'TERM':
        statusParts.push(`Term Overdue (${item.daysOverdue} days)`);
        break;
    }

    if (!item.aggregate.isCompliantWithKenyanLaw) {
      statusParts.push('Non-Compliant');
    }

    return statusParts.join(' - ');
  }

  private calculateUrgencyLevel(
    daysOverdue: number,
    overdueType: string,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Bond overdue is most critical due to S.72 LSA
    if (overdueType === 'BOND') {
      if (daysOverdue > 60) return 'CRITICAL';
      if (daysOverdue > 30) return 'HIGH';
      if (daysOverdue > 14) return 'MEDIUM';
      return 'LOW';
    }

    // Report overdue (S.73 LSA)
    if (overdueType === 'REPORT') {
      if (daysOverdue > 90) return 'CRITICAL';
      if (daysOverdue > 60) return 'HIGH';
      if (daysOverdue > 30) return 'MEDIUM';
      return 'LOW';
    }

    // Term overdue
    if (daysOverdue > 180) return 'CRITICAL';
    if (daysOverdue > 90) return 'HIGH';
    if (daysOverdue > 30) return 'MEDIUM';
    return 'LOW';
  }

  private getNextAction(item: {
    aggregate: GuardianshipAggregate;
    overdueType: string;
    daysOverdue: number;
  }): string {
    switch (item.overdueType) {
      case 'REPORT':
        return 'File annual report immediately and notify court';
      case 'BOND':
        return 'Renew bond with insurance provider and file proof with court';
      case 'TERM':
        return 'Apply for term extension or initiate termination proceedings';
      default:
        return 'Review guardianship compliance status';
    }
  }

  private getLegalConsequences(item: {
    aggregate: GuardianshipAggregate;
    overdueType: string;
    daysOverdue: number;
  }): string[] {
    const consequences: string[] = [];

    if (item.overdueType === 'BOND') {
      consequences.push('S.72 LSA: Court may remove guardian for bond non-compliance');
      consequences.push('Guardian liability for property losses may increase');
    }

    if (item.overdueType === 'REPORT') {
      consequences.push('S.73 LSA: Court may impose fines or remove guardian');
      consequences.push('Suspension of property management powers');
    }

    if (item.overdueType === 'TERM') {
      consequences.push('Guardianship becomes technically invalid');
      consequences.push('Urgent court application required');
    }

    return consequences;
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

  private logOverdueFindings(count: number, overdueType: string): void {
    if (count > 0) {
      this.logger.warn({
        message: `Found ${count} overdue ${overdueType.toLowerCase()} items`,
        count,
        overdueType,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
