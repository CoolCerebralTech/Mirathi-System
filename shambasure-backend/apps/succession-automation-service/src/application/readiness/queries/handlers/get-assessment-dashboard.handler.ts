import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { GetAssessmentDashboardQuery } from '../impl/get-assessment-dashboard.query';
import { ReadinessDashboardVM } from '../view-models/readiness-dashboard.vm';
import { RiskDetailVM } from '../view-models/risk-detail.vm';

@QueryHandler(GetAssessmentDashboardQuery)
export class GetAssessmentDashboardHandler implements IQueryHandler<GetAssessmentDashboardQuery> {
  constructor(
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly repository: IReadinessRepository,
  ) {}

  async execute(query: GetAssessmentDashboardQuery): Promise<ReadinessDashboardVM> {
    const { assessmentId, estateId } = query.dto;

    // 1. Fetch
    let assessment;
    if (assessmentId) {
      assessment = await this.repository.findById(assessmentId);
    } else if (estateId) {
      assessment = await this.repository.findByEstateId(estateId);
    }

    if (!assessment) {
      throw new NotFoundException(`Readiness Assessment not found for provided ID/Estate.`);
    }

    // 2. Map to View Model
    const score = assessment.readinessScore;
    const context = assessment.successionContext;

    // Get top priority active risks
    const topRisks = assessment.getTopPriorityRisks(5).map((risk) => RiskDetailVM.fromDomain(risk));

    // Determine application type (P&A 80 vs P&A 1)
    let applicationType = 'Letters of Administration (P&A 80)';
    if (context.regime === 'TESTATE') applicationType = 'Grant of Probate (P&A 1)';
    if (context.requiresKadhisCourt()) applicationType = 'Grant of Representation (Islamic)';

    const vm = new ReadinessDashboardVM();
    vm.assessmentId = assessment.id.toString();
    vm.estateId = assessment.estateId;
    vm.lastUpdated = assessment.lastAssessedAt;

    vm.score = score.score;
    vm.statusLabel = score.status.replace(/_/g, ' ');
    vm.statusColor = score.getColorIndicator();
    vm.confidenceLevel = score.filingConfidence;

    vm.summaryMessage = score.getMessage();
    vm.nextBestAction = score.nextMilestone || 'Review active risks';

    vm.totalRisks = score.totalRisks;
    vm.criticalRisks = score.criticalRisksCount;

    vm.topRisks = topRisks;

    vm.caseContext = {
      courtJurisdiction: context.determineCourtJurisdiction().replace(/_/g, ' '),
      applicationType,
      estimatedTimeline: context.isSimpleCase() ? '3-6 months' : '6-12+ months',
      isComplex: !context.isSimpleCase(),
    };

    return vm;
  }
}
