// application/guardianship/queries/handlers/get-guardianship-by-id.handler.ts
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { InvalidGuardianshipException } from '../../../../domain/exceptions/guardianship.exception';
import type { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import type { IGuardianRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/base/result';
import { GuardianshipResponse } from '../../dto/response/guardianship.response';
import { GetGuardianshipByIdQuery } from '../impl/get-guardianship-by-id.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(GetGuardianshipByIdQuery)
export class GetGuardianshipByIdHandler
  extends BaseQueryHandler<GetGuardianshipByIdQuery, Result<GuardianshipResponse>>
  implements IQueryHandler<GetGuardianshipByIdQuery, Result<GuardianshipResponse>>
{
  constructor(
    private readonly guardianRepository: IGuardianRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
  ) {
    super();
  }

  async execute(query: GetGuardianshipByIdQuery): Promise<Result<GuardianshipResponse>> {
    try {
      // 1. Log query execution
      this.logQueryExecution(query, 'GetGuardianshipById');

      // 2. Validate query
      const validation = this.validateQuery(query);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // 3. Load guardianship
      const guardian = await this.guardianRepository.findById(query.guardianshipId);
      if (!guardian) {
        return Result.fail(
          new InvalidGuardianshipException(
            `Guardianship with ID ${query.guardianshipId} not found`,
          ),
        );
      }

      // 4. Convert to aggregate for business logic
      const aggregate = GuardianshipAggregate.createFromProps(guardian.toJSON());

      // 5. Load denormalized data if requested
      let denormalizedData = {};
      if (query.includeDenormalizedData) {
        denormalizedData = await this.loadDenormalizedData(aggregate);
      }

      // 6. Build compliance data if requested
      let complianceData = {};
      if (query.includeComplianceCheck) {
        complianceData = this.buildComplianceData(aggregate);
        this.logComplianceCheck(aggregate.id, complianceData, 'GetGuardianshipById');
      }

      // 7. Map to response DTO
      const response = this.mapToResponse(aggregate, denormalizedData, complianceData);

      // 8. Log success
      this.logQuerySuccess(query, 1, 'GetGuardianshipById');

      return Result.ok(response);
    } catch (error) {
      this.handleError(error, query, 'GetGuardianshipByIdHandler');
      return Result.fail(new Error('Failed to fetch guardianship'));
    }
  }

  private async loadDenormalizedData(aggregate: GuardianshipAggregate): Promise<{
    wardName?: string;
    guardianName?: string;
    wardAge?: number;
    wardDateOfBirth?: Date;
    guardianDateOfBirth?: Date;
    relationship?: string;
  }> {
    const data: any = {};

    try {
      // Load ward data
      const ward = await this.familyMemberRepository.findById(aggregate.wardId);
      if (ward) {
        data.wardName = `${ward.firstName} ${ward.lastName}`;
        data.wardDateOfBirth = ward.dateOfBirth;
        data.wardAge = this.calculateAge(ward.dateOfBirth);
      }

      // Load guardian data
      const guardian = await this.familyMemberRepository.findById(aggregate.guardianId);
      if (guardian) {
        data.guardianName = `${guardian.firstName} ${guardian.lastName}`;
        data.guardianDateOfBirth = guardian.dateOfBirth;
      }

      // Determine relationship (this would require relationship repository)
      // For now, we'll set a placeholder
      data.relationship = 'Guardian-Ward';

      return data;
    } catch (error) {
      this.logger.warn(`Failed to load denormalized data: ${error.message}`);
      return data;
    }
  }

  private buildComplianceData(aggregate: GuardianshipAggregate): {
    s72Compliant: boolean;
    s73Compliant: boolean;
    overallCompliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // S.72 Bond Compliance
    if (aggregate.s72ComplianceStatus === 'NON_COMPLIANT') {
      issues.push('Section 72 Bond Compliance Issue');
      if (!aggregate.isBondPosted) {
        recommendations.push('Post bond with approved insurance provider');
      }
      if (aggregate.isBondExpired) {
        recommendations.push('Renew expired bond immediately');
      }
    }

    // S.73 Annual Report Compliance
    if (aggregate.s73ComplianceStatus === 'NON_COMPLIANT') {
      issues.push('Section 73 Annual Report Compliance Issue');
      if (aggregate.isReportOverdue) {
        recommendations.push('File overdue annual report immediately');
      }
    }

    // Additional checks
    if (aggregate.isTermExpired) {
      issues.push('Guardianship term has expired');
      recommendations.push('Apply for term extension or terminate guardianship');
    }

    if (aggregate.hasPropertyManagementPowers && !aggregate.isBondPosted) {
      issues.push('Property management powers require bond (S.72 LSA)');
      recommendations.push('Post bond before exercising property powers');
    }

    return {
      s72Compliant: aggregate.s72ComplianceStatus === 'COMPLIANT',
      s73Compliant: aggregate.s73ComplianceStatus === 'COMPLIANT',
      overallCompliant: aggregate.isCompliantWithKenyanLaw,
      issues,
      recommendations,
    };
  }

  private mapToResponse(
    aggregate: GuardianshipAggregate,
    denormalizedData: any,
    complianceData: any,
  ): GuardianshipResponse {
    const response: GuardianshipResponse = {
      id: aggregate.id,
      wardId: aggregate.wardId,
      guardianId: aggregate.guardianId,
      type: aggregate.type,
      courtOrderNumber: aggregate.courtOrderNumber,
      courtStation: aggregate.courtStation,
      appointmentDate: aggregate.appointmentDate,
      validUntil: aggregate.validUntil,
      hasPropertyManagementPowers: aggregate.hasPropertyManagementPowers,
      canConsentToMedical: aggregate.canConsentToMedical,
      canConsentToMarriage: aggregate.canConsentToMarriage,
      restrictions: aggregate.restrictions,
      specialInstructions: aggregate.specialInstructions,
      bondRequired: aggregate.bondRequired,
      bondAmountKES: aggregate.bondAmountKES,
      bondProvider: aggregate.bondProvider,
      bondPolicyNumber: aggregate.bondPolicyNumber,
      bondExpiry: aggregate.bondExpiry,
      annualAllowanceKES: aggregate.annualAllowanceKES,
      lastReportDate: aggregate.lastReportDate,
      nextReportDue: aggregate.nextReportDue,
      reportStatus: aggregate.reportStatus,
      isActive: aggregate.isActive,
      terminationDate: aggregate.terminationDate,
      terminationReason: aggregate.terminationReason,
      isBondPosted: aggregate.isBondPosted,
      isBondExpired: aggregate.isBondExpired,
      isReportOverdue: aggregate.isReportOverdue,
      isTermExpired: aggregate.isTermExpired,
      s73ComplianceStatus: aggregate.s73ComplianceStatus,
      s72ComplianceStatus: aggregate.s72ComplianceStatus,
      isCompliantWithKenyanLaw: aggregate.isCompliantWithKenyanLaw,
      version: aggregate.version,
      createdAt: aggregate.createdAt,
      updatedAt: aggregate.updatedAt,
      // Days calculations
      daysUntilNextReport: this.calculateDaysUntil(aggregate.nextReportDue),
      daysUntilBondExpiry: this.calculateDaysUntil(aggregate.bondExpiry),
      daysUntilTermExpiry: this.calculateDaysUntil(aggregate.validUntil),
    };

    // Merge denormalized data
    if (denormalizedData) {
      Object.assign(response, denormalizedData);
    }

    // Merge compliance data
    if (complianceData) {
      Object.assign(response, {
        complianceCheck: complianceData,
      });
    }

    return response;
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

  private calculateDaysUntil(date?: Date): number | undefined {
    if (!date) return undefined;
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
