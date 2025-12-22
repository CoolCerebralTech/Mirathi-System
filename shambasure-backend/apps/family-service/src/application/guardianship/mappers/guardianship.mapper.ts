// application/guardianship/mappers/guardianship.mapper.ts
import { Injectable } from '@nestjs/common';

import { GuardianshipAggregate } from '../../../domain/aggregates/guardianship.aggregate';
import { PageMetaDto, PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { GuardianshipSummaryResponse } from '../dto/response/guardianship-summary.response';
import { GuardianshipResponse } from '../dto/response/guardianship.response';

@Injectable()
export class GuardianshipMapper {
  toResponse(
    aggregate: GuardianshipAggregate,
    denormalizedData?: {
      wardName?: string;
      guardianName?: string;
      wardAge?: number;
      wardDateOfBirth?: Date;
    },
  ): GuardianshipResponse {
    const response = new GuardianshipResponse({
      id: aggregate.id,
      wardId: aggregate.wardId,
      guardianId: aggregate.guardianId,
      type: aggregate.type,
      courtOrderNumber: aggregate.courtOrderNumber,
      courtStation: aggregate.courtStation, // Fixed: Added courtStation
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
    });

    // Add denormalized data if provided
    if (denormalizedData) {
      Object.assign(response, denormalizedData);
    }

    return response;
  }

  toSummaryResponse(
    aggregate: GuardianshipAggregate,
    denormalizedData?: {
      wardName?: string;
      guardianName?: string;
      wardAge?: number;
    },
  ): GuardianshipSummaryResponse {
    const response = new GuardianshipSummaryResponse({
      id: aggregate.id,
      wardId: aggregate.wardId,
      guardianId: aggregate.guardianId,
      type: aggregate.type,
      isActive: aggregate.isActive,
      isBondPosted: aggregate.isBondPosted,
      isReportOverdue: aggregate.isReportOverdue,
      isCompliant: aggregate.isCompliantWithKenyanLaw,
      createdAt: aggregate.createdAt,
      wardName: denormalizedData?.wardName || 'Unknown',
      guardianName: denormalizedData?.guardianName || 'Unknown',
      wardAge: denormalizedData?.wardAge,
      statusSummary: this.generateStatusSummary(aggregate),
    });

    return response;
  }

  private generateStatusSummary(aggregate: GuardianshipAggregate): string {
    if (!aggregate.isActive) {
      return 'Terminated';
    }

    const statusParts: string[] = []; // Explicitly typed as string[]

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

  toComplianceReportResponse(stats: {
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
    overdueReports: number;
    expiredBonds: number;
  }) {
    const complianceRate =
      stats.active > 0
        ? ((stats.bondCompliant + stats.s73Compliant) / (stats.active * 2)) * 100
        : 0;

    return {
      total: stats.total,
      active: stats.active,
      terminated: stats.terminated,
      bondRequired: stats.bondRequired,
      bondCompliant: stats.bondCompliant,
      s73Compliant: stats.s73Compliant,
      s73NonCompliant: stats.s73NonCompliant,
      propertyPowers: stats.propertyPowers,
      courtAppointed: stats.courtAppointed,
      testamentary: stats.testamentary,
      complianceRate: parseFloat(complianceRate.toFixed(2)),
      overdueReports: stats.overdueReports,
      expiredBonds: stats.expiredBonds,
    };
  }

  // Helper method to create paginated response
  toPaginatedResponse(
    data: GuardianshipSummaryResponse[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponse<GuardianshipSummaryResponse> {
    const meta = new PageMetaDto({
      pageOptionsDto: { page, limit },
      itemCount: total,
    });

    return new PaginatedResponse(data, meta);
  }
}
