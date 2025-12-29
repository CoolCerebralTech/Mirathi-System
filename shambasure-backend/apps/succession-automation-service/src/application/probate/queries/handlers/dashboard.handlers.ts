import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

// Import type to fix TS1272
import type { IProbateApplicationRepository } from '../../../../domain/repositories/i-probate-application.repository';
import { PROBATE_APPLICATION_REPOSITORY } from '../../../../domain/repositories/i-probate-application.repository';
import { Result } from '../../../common/result';
import { GetApplicationDashboardQuery } from '../impl/probate.queries';
import { ApplicationDashboardVm } from '../view-models/application-dashboard.vm';

@QueryHandler(GetApplicationDashboardQuery)
export class GetApplicationDashboardHandler implements IQueryHandler<GetApplicationDashboardQuery> {
  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(query: GetApplicationDashboardQuery): Promise<Result<ApplicationDashboardVm>> {
    const { dto } = query;
    const application = await this.repository.findById(dto.applicationId);

    if (!application) {
      return Result.fail('Probate application not found');
    }

    // Map Aggregate to View Model
    // We use the Aggregate's helper methods for calculations
    const vm: ApplicationDashboardVm = {
      id: application.id.toString(),
      referenceNumber: `PA-${application.createdAt.getFullYear()}-${application.id.toString().substring(0, 6).toUpperCase()}`,

      status: application.status,
      statusLabel: application.status.replace(/_/g, ' '),
      priority: application.priority,

      progressPercentage: application.getProgressPercentage(),
      currentStep: this.mapStatusToStep(application.status),
      totalSteps: 5,

      targetCourt: application.targetCourtName,
      courtStation: application.courtStation,
      estimatedGrantDate: application.getEstimatedTimeline().grant,

      nextAction: application.getNextAction(),
      alerts: [], // In real app, check for stale dates or court queries

      formsReadyCount: application.getApprovedForms().length,
      formsTotalCount: application.forms.length,
      consentsReceivedCount: application.getGrantedConsents().length,
      consentsTotalCount: application.getRequiredConsents().length,

      filingFeePaid: application.filingFeePaid,
      totalFilingCost: application.calculateTotalFilingFees(),

      createdAt: application.createdAt,
      lastModifiedAt: new Date(), // Should track updated_at
    };

    return Result.ok(vm);
  }

  private mapStatusToStep(status: string): number {
    // 1: Forms, 2: Review, 3: Consents, 4: Filing, 5: Court
    if (status.includes('DRAFT') || status.includes('PENDING_FORMS')) return 1;
    if (status.includes('REVIEW') || status.includes('SIGNATURES')) return 2;
    if (status.includes('CONSENTS')) return 3;
    if (status.includes('FEE') || status.includes('READY')) return 4;
    return 5;
  }
}
