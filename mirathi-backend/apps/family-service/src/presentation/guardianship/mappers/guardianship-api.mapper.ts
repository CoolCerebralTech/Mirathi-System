// Application Read Models
import { ComplianceTimelineReadModel } from '../../../application/guardianship/queries/read-models/compliance-timeline.read-model';
import { GuardianshipDetailsReadModel } from '../../../application/guardianship/queries/read-models/guardianship-details.read-model';
import { GuardianshipListItemReadModel } from '../../../application/guardianship/queries/read-models/guardianship-list-item.read-model';
import { RiskAssessmentReadModel } from '../../../application/guardianship/queries/read-models/risk-assessment.read-model';
import { PaginatedResult } from '../../../domain/interfaces/iguardianship.repository';
// Presentation Response DTOs
import {
  ComplianceTimelineResponseDto,
  TimelineEventItemDto,
} from '../dto/response/compliance-timeline.response.dto';
import { GuardianshipDetailsResponseDto } from '../dto/response/guardianship-details.response.dto';
import {
  GuardianshipListItemDto,
  PaginatedGuardianshipResponseDto,
} from '../dto/response/guardianship-list.response.dto';
import {
  RecommendationDto,
  RiskAssessmentResponseDto,
  RiskFactorDto,
} from '../dto/response/risk-assessment.response.dto';

export class GuardianshipApiMapper {
  /**
   * Maps full case details
   */
  public static toDetailsResponse(
    readModel: GuardianshipDetailsReadModel,
  ): GuardianshipDetailsResponseDto {
    return {
      id: readModel.id,
      caseNumber: readModel.caseNumber,
      status: readModel.status,

      ward: {
        id: readModel.ward.id,
        name: readModel.ward.name,
        age: readModel.ward.age,
        dateOfBirth: readModel.ward.dateOfBirth,
        gender: readModel.ward.gender,
        photoUrl: readModel.ward.photoUrl,
      },

      legal: {
        type: readModel.legal.type,
        jurisdiction: readModel.legal.jurisdiction,
        courtStation: readModel.legal.courtStation,
        judgeName: readModel.legal.judgeName,
        orderDate: readModel.legal.orderDate,
      },

      guardians: readModel.guardians.map((g) => ({
        guardianId: g.guardianId,
        name: g.name,
        role: g.role,
        isPrimary: g.isPrimary,
        status: g.status,
        contactPhone: g.contactPhone,
        relationshipToWard: g.relationshipToWard,
      })),

      compliance: {
        score: readModel.compliance.score,
        nextReportDue: readModel.compliance.nextReportDue,
        lastReportDate: readModel.compliance.lastReportDate,
        isBonded: readModel.compliance.isBonded,
      },
    };
  }

  /**
   * Maps paginated search results
   */
  public static toPaginatedListResponse(
    result: PaginatedResult<GuardianshipListItemReadModel>,
  ): PaginatedGuardianshipResponseDto {
    const items: GuardianshipListItemDto[] = result.items.map((item) => ({
      id: item.id,
      caseNumber: item.caseNumber,
      wardName: item.wardName,
      wardAge: item.wardAge,
      primaryGuardianName: item.primaryGuardianName,
      status: item.status,
      riskLevel: item.riskLevel,
      nextComplianceDue: item.nextComplianceDue,
      establishedDate: item.establishedDate,
    }));

    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  /**
   * Maps compliance audit timeline
   */
  public static toTimelineResponse(
    readModel: ComplianceTimelineReadModel,
  ): ComplianceTimelineResponseDto {
    const events: TimelineEventItemDto[] = readModel.events.map((e) => ({
      id: e.id,
      date: e.date,
      type: e.type,
      title: e.title,
      description: e.description,
      statusColor: e.statusColor,
      icon: e.icon,
      actor: e.actor,
      referenceId: e.referenceId,
      documentUrl: e.documentUrl,
    }));

    return {
      guardianshipId: readModel.guardianshipId,
      wardName: readModel.wardName,
      summary: {
        totalReports: readModel.summary.totalReports,
        onTimeRate: readModel.summary.onTimeRate,
        nextDueDate: readModel.summary.nextDueDate,
        status: readModel.summary.status,
      },
      events,
    };
  }

  /**
   * Maps risk assessment report
   */
  public static toRiskResponse(readModel: RiskAssessmentReadModel): RiskAssessmentResponseDto {
    const activeAlerts: RiskFactorDto[] = readModel.activeAlerts.map((a) => ({
      code: a.code,
      description: a.description,
      severity: a.severity,
      detectedAt: a.detectedAt,
    }));

    const automatedRecommendations: RecommendationDto[] = readModel.automatedRecommendations.map(
      (r) => ({
        priority: r.priority,
        title: r.title,
        action: r.action,
        legalReference: r.legalReference || '',
      }),
    );

    return {
      guardianshipId: readModel.guardianshipId,
      generatedAt: readModel.generatedAt,
      overallRiskLevel: readModel.overallRiskLevel,
      riskScore: readModel.riskScore,
      activeAlerts,
      automatedRecommendations,
    };
  }
}
