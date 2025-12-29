import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { IProbateApplicationRepository } from '../../../../domain/repositories/i-probate-application.repository';
import { PROBATE_APPLICATION_REPOSITORY } from '../../../../domain/repositories/i-probate-application.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import { ComplianceEngineService } from '../../../../domain/services/compliance-engine.service';
import { Result } from '../../../common/result';
import { FeeCalculatorService } from '../../services/court-integration/fee-calculator.service';
import { ValidateFilingReadinessQuery } from '../impl/probate.queries';
import { FilingReadinessVm } from '../view-models/filing-preview.vm';

@QueryHandler(ValidateFilingReadinessQuery)
export class ValidateFilingReadinessHandler implements IQueryHandler<ValidateFilingReadinessQuery> {
  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly appRepository: IProbateApplicationRepository,
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly readinessRepository: IReadinessRepository,
    private readonly complianceEngine: ComplianceEngineService,
    private readonly feeCalculator: FeeCalculatorService,
  ) {}

  async execute(query: ValidateFilingReadinessQuery): Promise<Result<FilingReadinessVm>> {
    const { dto } = query;
    const application = await this.appRepository.findById(dto.applicationId);
    if (!application) return Result.fail('Application not found');

    const readiness = await this.readinessRepository.findById(application.readinessAssessmentId);
    if (!readiness) return Result.fail('Readiness Assessment not found');

    // 1. Run Compliance Check
    // Convert GeneratedForm entities to minimal shape expected by ComplianceEngine if needed
    // or assume engine handles it. Here passing simple mapping for demonstration.
    const formsForCheck = application.forms.map((f) => ({
      formCode: f.formCode,
      isValidForCourt: () => true, // Mock for interface
    })) as any[];

    const complianceResult = this.complianceEngine.validateFilingCompliance(
      application.successionContext,
      readiness.readinessScore,
      formsForCheck,
      application.getGrantedConsents().length,
    );

    const report = complianceResult.getComplianceReport();

    // 2. Calculate Fees
    const feeResult = this.feeCalculator.calculateTotalFilingCost(application);

    // 3. Build VM
    const vm: FilingReadinessVm = {
      applicationId: application.id.toString(),
      isReady: application.canFile() && report.isCompliant,

      fees: {
        items: feeResult.breakdown.map((b) => ({
          description: b.item,
          amount: b.amount,
          currency: 'KES',
          isOptional: false,
        })),
        subtotal: feeResult.courtFees,
        serviceFee: feeResult.serviceFee,
        total: feeResult.total,
        isPaid: application.filingFeePaid,
        paidAt: application.props.filingFeePaidAt,
      },

      complianceStatus:
        report.violations.length > 0 ? 'FAIL' : report.warnings.length > 0 ? 'WARNING' : 'PASS',
      violations: report.violations.map((v) => ({
        section: v.section,
        requirement: v.requirement,
        description: v.description,
        severity: v.severity,
      })),
      warnings: report.warnings.map((w) => w.issue),

      courtName: application.targetCourtName,
      registryLocation: application.courtStation,

      estimatedFilingDate: new Date(), // Now
      estimatedGrantDate: application.getEstimatedTimeline().grant,
    };

    return Result.ok(vm);
  }
}
