import {
  ApplicationDashboardVm,
  ApplicationSummaryVm,
} from '../../../application/probate/queries/view-models/application-dashboard.vm';
import {
  ConsentItemVm,
  ConsentMatrixVm,
} from '../../../application/probate/queries/view-models/consent-matrix.vm';
import {
  FilingFeeBreakdownVm,
  FilingReadinessVm,
} from '../../../application/probate/queries/view-models/filing-preview.vm';
import {
  FormBundleVm,
  FormItemVm,
} from '../../../application/probate/queries/view-models/form-bundle.vm';
import {
  ApplicationListResponseDto,
  ApplicationSummaryResponseDto,
} from '../dtos/response/application-list.response.dto';
import {
  ConsentItemResponseDto,
  ConsentMatrixResponseDto,
} from '../dtos/response/consent-matrix.response.dto';
import {
  FilingFeeBreakdownResponseDto,
  FilingReadinessResponseDto,
} from '../dtos/response/filing-readiness.response.dto';
import {
  FormBundleResponseDto,
  FormItemResponseDto,
} from '../dtos/response/form-bundle.response.dto';
import { ProbateDashboardResponseDto } from '../dtos/response/probate-dashboard.response.dto';

export class ProbatePresenterMapper {
  // ===========================================================================
  // 1. Dashboard Mapping
  // ===========================================================================
  static toDashboardResponse(vm: ApplicationDashboardVm): ProbateDashboardResponseDto {
    return {
      id: vm.id,
      referenceNumber: vm.referenceNumber,
      status: vm.status,
      statusLabel: vm.statusLabel,
      priority: vm.priority,
      progressPercentage: vm.progressPercentage,
      currentStep: vm.currentStep,
      totalSteps: vm.totalSteps,
      targetCourt: vm.targetCourt,
      courtStation: vm.courtStation,
      estimatedGrantDate: vm.estimatedGrantDate,
      nextAction: vm.nextAction,
      alerts: vm.alerts.map((a) => ({
        type: a.type,
        title: a.title,
        message: a.message,
        actionLink: a.actionLink,
      })),
      formsReadyCount: vm.formsReadyCount,
      formsTotalCount: vm.formsTotalCount,
      consentsReceivedCount: vm.consentsReceivedCount,
      consentsTotalCount: vm.consentsTotalCount,
      filingFeePaid: vm.filingFeePaid,
      totalFilingCost: vm.totalFilingCost,
      createdAt: vm.createdAt,
      lastModifiedAt: vm.lastModifiedAt,
    };
  }

  // ===========================================================================
  // 2. Forms Bundle Mapping
  // ===========================================================================
  static toFormBundleResponse(vm: FormBundleVm): FormBundleResponseDto {
    const mapItem = (item: FormItemVm): FormItemResponseDto => ({
      id: item.id,
      code: item.code,
      name: item.name,
      status: item.status,
      category: item.category,
      version: item.version,
      generatedAt: item.generatedAt,
      downloadUrl: item.downloadUrl,
      previewUrl: item.previewUrl,
      canSign: item.canSign,
      canRegenerate: item.canRegenerate,
      signaturesRequired: item.signaturesRequired,
      signaturesObtained: item.signaturesObtained,
      signatories: item.signatories.map((s) => ({
        signatoryName: s.signatoryName,
        role: s.role,
        hasSigned: s.hasSigned,
        signedAt: s.signedAt,
        signatureType: s.signatureType,
      })),
      rejectionReason: item.rejectionReason,
    });

    return {
      applicationId: vm.applicationId,
      primaryPetitions: vm.primaryPetitions.map(mapItem),
      affidavits: vm.affidavits.map(mapItem),
      consentsAndGuarantees: vm.consentsAndGuarantees.map(mapItem),
      others: vm.others.map(mapItem),
      allApproved: vm.allApproved,
      allSigned: vm.allSigned,
    };
  }

  // ===========================================================================
  // 3. Consent Matrix Mapping
  // ===========================================================================
  static toConsentMatrixResponse(vm: ConsentMatrixVm): ConsentMatrixResponseDto {
    const mapItem = (item: ConsentItemVm): ConsentItemResponseDto => ({
      id: item.id,
      familyMemberId: item.familyMemberId,
      fullName: item.fullName,
      role: item.role,
      relationship: item.relationship,
      status: item.status,
      isRequired: item.isRequired,
      hasPhone: item.hasPhone,
      hasEmail: item.hasEmail,
      requestSentAt: item.requestSentAt,
      respondedAt: item.respondedAt,
      expiresAt: item.expiresAt,
      method: item.method,
      declineReason: item.declineReason,
      canSendRequest: item.canSendRequest,
      canMarkNotRequired: item.canMarkNotRequired,
    });

    return {
      applicationId: vm.applicationId,
      totalRequired: vm.totalRequired,
      received: vm.received,
      pending: vm.pending,
      declined: vm.declined,
      isComplete: vm.isComplete,
      items: vm.items.map(mapItem),
    };
  }

  // ===========================================================================
  // 4. Filing Readiness Mapping
  // ===========================================================================
  static toFilingReadinessResponse(vm: FilingReadinessVm): FilingReadinessResponseDto {
    const mapFees = (fees: FilingFeeBreakdownVm): FilingFeeBreakdownResponseDto => ({
      items: fees.items.map((i) => ({
        description: i.description,
        amount: i.amount,
        currency: i.currency,
        isOptional: i.isOptional,
      })),
      subtotal: fees.subtotal,
      serviceFee: fees.serviceFee,
      total: fees.total,
      isPaid: fees.isPaid,
      paidAt: fees.paidAt,
      receiptNumber: fees.receiptNumber,
    });

    return {
      applicationId: vm.applicationId,
      isReady: vm.isReady,
      fees: mapFees(vm.fees),
      complianceStatus: vm.complianceStatus,
      violations: vm.violations.map((v) => ({
        section: v.section,
        requirement: v.requirement,
        description: v.description,
        severity: v.severity,
      })),
      warnings: vm.warnings,
      courtName: vm.courtName,
      registryLocation: vm.registryLocation,
      estimatedFilingDate: vm.estimatedFilingDate,
      estimatedGrantDate: vm.estimatedGrantDate,
    };
  }

  // ===========================================================================
  // 5. Application List Mapping
  // ===========================================================================
  static toApplicationListResponse(
    items: ApplicationSummaryVm[],
    total: number,
    page: number,
    limit: number,
  ): ApplicationListResponseDto {
    const mapItem = (item: ApplicationSummaryVm): ApplicationSummaryResponseDto => ({
      id: item.id,
      estateId: item.estateId,
      deceasedName: item.deceasedName,
      applicationType: item.applicationType,
      status: item.status,
      courtName: item.courtName,
      progressPercentage: item.progressPercentage,
      lastUpdated: item.lastUpdated,
      nextAction: item.nextAction,
    });

    return {
      items: items.map(mapItem),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}
