// application/guardianship/mappers/guardianship-response.mapper.ts
import { Injectable } from '@nestjs/common';
import { GuardianType } from '@prisma/client';

import { Guardian } from '../../../domain/entities/guardian.entity';
import { GuardianshipComplianceSummaryResponse } from '../dto/response/compliance-summary.response';
import { GuardianshipResponse } from '../dto/response/guardianship.response';

@Injectable()
export class GuardianshipResponseMapper {
  /**
   * Maps a Guardian domain entity to a GuardianshipResponse DTO
   */
  toResponse(guardian: Guardian): GuardianshipResponse {
    if (!guardian) {
      return null;
    }

    const response = new GuardianshipResponse();

    // Basic information
    response.id = guardian.id;
    response.wardId = guardian.wardId;
    response.guardianId = guardian.guardianId;
    response.type = guardian.type;

    // Legal details
    response.courtOrderNumber = guardian.courtOrderNumber;
    response.courtStation = guardian.courtStation;
    response.appointmentDate = guardian.appointmentDate;
    response.validUntil = guardian.validUntil;
    response.guardianIdNumber = guardian.guardianIdNumber;
    response.courtCaseNumber = guardian.courtCaseNumber;
    response.interimOrderId = guardian.interimOrderId;

    // Powers
    response.hasPropertyManagementPowers = guardian.hasPropertyManagementPowers;
    response.canConsentToMedical = guardian.canConsentToMedical;
    response.canConsentToMarriage = guardian.canConsentToMarriage;
    response.restrictions = guardian.restrictions as Record<string, any>;
    response.specialInstructions = guardian.specialInstructions;

    // Bond (S.72 LSA)
    response.bondRequired = guardian.bondRequired;
    response.bondAmountKES = guardian.bondAmountKES;
    response.bondProvider = guardian.bondProvider;
    response.bondPolicyNumber = guardian.bondPolicyNumber;
    response.bondExpiry = guardian.bondExpiry;

    // Annual Reporting (S.73 LSA)
    response.lastReportDate = guardian.lastReportDate;
    response.nextReportDue = guardian.nextReportDue;
    response.reportStatus = guardian.reportStatus;

    // Allowances
    response.annualAllowanceKES = guardian.annualAllowanceKES;
    response.allowanceApprovedBy = guardian.allowanceApprovedBy;

    // Status
    response.isActive = guardian.isActive;
    response.terminationDate = guardian.terminationDate;
    response.terminationReason = guardian.terminationReason;

    // Computed properties
    response.isBondPosted = guardian.isBondPosted;
    response.isBondExpired = guardian.isBondExpired;
    response.isReportOverdue = guardian.isReportOverdue;
    response.isTermExpired = guardian.isTermExpired;
    response.requiresAnnualReport = guardian.requiresAnnualReport;

    // Kenyan Law Compliance
    response.s73ComplianceStatus = guardian.s73ComplianceStatus;

    // Compute S.72 compliance
    const s72Compliant =
      !guardian.bondRequired || (guardian.isBondPosted && !guardian.isBondExpired);

    response.isCompliantWithKenyanLaw =
      s72Compliant && guardian.s73ComplianceStatus !== 'NON_COMPLIANT';

    // Audit
    response.version = guardian.version;
    response.createdAt = guardian.createdAt;
    response.updatedAt = guardian.updatedAt;

    return response;
  }

  /**
   * Maps multiple Guardian entities to response DTOs
   */
  toResponseList(guardians: Guardian[]): GuardianshipResponse[] {
    if (!guardians) return [];
    return guardians.map((guardian) => this.toResponse(guardian));
  }

  /**
   * Maps a compliance summary object to response DTO
   */
  toComplianceSummaryResponse(summary: {
    total: number;
    active: number;
    terminated: number;
    bondRequired: number;
    bondCompliant: number;
    s73Compliant: number;
    s73NonCompliant: number;
    propertyPowers: number;
    courtAppointed: number;
    testamentary: number;
  }): GuardianshipComplianceSummaryResponse {
    const response = new GuardianshipComplianceSummaryResponse();

    response.total = summary.total || 0;
    response.active = summary.active || 0;
    response.terminated = summary.terminated || 0;
    response.bondRequired = summary.bondRequired || 0;
    response.bondCompliant = summary.bondCompliant || 0;
    response.s73Compliant = summary.s73Compliant || 0;
    response.s73NonCompliant = summary.s73NonCompliant || 0;
    response.propertyPowers = summary.propertyPowers || 0;
    response.courtAppointed = summary.courtAppointed || 0;
    response.testamentary = summary.testamentary || 0;

    return response;
  }

  /**
   * Maps pagination metadata
   */
  toPaginationMetadata(
    total: number,
    page: number,
    limit: number,
  ): {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Maps guardian statistics for reporting
   */
  toGuardianshipStatistics(guardians: Guardian[]): {
    total: number;
    active: number;
    terminated: number;
    courtAppointed: number;
    testamentary: number;
    withPropertyPowers: number;
    bondRequired: number;
    bondCompliant: number;
    s73Compliant: number;
    s73Overdue: number;
  } {
    return {
      total: guardians.length,
      active: guardians.filter((g) => g.isActive).length,
      terminated: guardians.filter((g) => !g.isActive).length,
      courtAppointed: guardians.filter((g) => g.type === GuardianType.COURT_APPOINTED).length,
      testamentary: guardians.filter((g) => g.type === GuardianType.TESTAMENTARY).length,
      withPropertyPowers: guardians.filter((g) => g.hasPropertyManagementPowers).length,
      bondRequired: guardians.filter((g) => g.bondRequired).length,
      bondCompliant: guardians.filter(
        (g) => !g.bondRequired || (g.isBondPosted && !g.isBondExpired),
      ).length,
      s73Compliant: guardians.filter((g) => g.s73ComplianceStatus === 'COMPLIANT').length,
      s73Overdue: guardians.filter((g) => g.isReportOverdue).length,
    };
  }

  /**
   * Maps compliance status details
   */
  toComplianceStatus(guardian: Guardian): {
    s72Compliant: boolean;
    s73Compliant: boolean;
    overallCompliant: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check S.72 compliance
    const s72Compliant =
      !guardian.bondRequired || (guardian.isBondPosted && !guardian.isBondExpired);

    if (!s72Compliant) {
      if (guardian.bondRequired && !guardian.isBondPosted) {
        issues.push('Bond not posted (S.72 violation)');
      } else if (guardian.bondRequired && guardian.isBondExpired) {
        issues.push('Bond expired (S.72 violation)');
      }
    }

    // Check S.73 compliance
    const s73Compliant = guardian.s73ComplianceStatus !== 'NON_COMPLIANT';

    if (!s73Compliant && guardian.requiresAnnualReport) {
      issues.push('Annual report overdue (S.73 violation)');
    }

    return {
      s72Compliant,
      s73Compliant,
      overallCompliant: s72Compliant && s73Compliant,
      issues,
    };
  }
}
