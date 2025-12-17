// application/dependency/mappers/specialized.mappers.ts
import { Injectable } from '@nestjs/common';

import { AssessFinancialDependencyCommand } from '../commands/impl/assess-financial-dependency.command';
import { CreateDependencyAssessmentCommand } from '../commands/impl/create-dependency-assessment.command';
import { FileS26ClaimCommand } from '../commands/impl/file-s26-claim.command';
import { RecordCourtProvisionCommand } from '../commands/impl/record-court-provision.command';
import {
  AssessFinancialDependencyRequest,
  CreateDependencyAssessmentRequest,
  FileS26ClaimRequest,
  RecordCourtProvisionRequest,
} from '../dto/request';
import { CommandMetadata, QueryMetadata } from '../ports/inbound/dependency.use-case';
import { CheckS29ComplianceQuery } from '../queries/impl/check-s29-compliance.query';
import { GetDependencyByIdQuery } from '../queries/impl/get-dependency-by-id.query';
import { GetDependencyStatisticsQuery } from '../queries/impl/get-dependency-statistics.query';
import { ListDependenciesByDeceasedQuery } from '../queries/impl/list-dependencies-by-deceased.query';

@Injectable()
export class SpecializedDependencyMappers {
  toCreateDependencyAssessmentCommand(
    request: CreateDependencyAssessmentRequest,
    metadata: CommandMetadata,
    correlationId?: string,
    requestId?: string,
  ): CreateDependencyAssessmentCommand {
    return new CreateDependencyAssessmentCommand(
      {
        deceasedId: request.deceasedId,
        dependantId: request.dependantId,
        dependencyBasis: request.dependencyBasis,
        isMinor: request.isMinor,
        dependencyLevel: request.dependencyLevel,
        isStudent: request.isStudent,
        hasPhysicalDisability: request.hasPhysicalDisability,
        hasMentalDisability: request.hasMentalDisability,
        requiresOngoingCare: request.requiresOngoingCare,
        disabilityDetails: request.disabilityDetails,
        monthlySupport: request.monthlySupport,
        supportStartDate: request.supportStartDate ? new Date(request.supportStartDate) : undefined,
        supportEndDate: request.supportEndDate ? new Date(request.supportEndDate) : undefined,
        assessmentMethod: request.assessmentMethod,
        dependencyPercentage: request.dependencyPercentage,
        custodialParentId: request.custodialParentId,
        dependencyProofDocuments: request.dependencyProofDocuments?.map((doc) => ({
          documentId: doc.documentId,
          evidenceType: doc.evidenceType,
          addedAt: doc.addedAt ? new Date(doc.addedAt) : undefined,
        })),
        courtCaseReference: request.courtCaseReference,
      },
      metadata,
      correlationId,
      requestId,
    );
  }

  toAssessFinancialDependencyCommand(
    request: AssessFinancialDependencyRequest,
    metadata: CommandMetadata,
    correlationId?: string,
    requestId?: string,
  ): AssessFinancialDependencyCommand {
    return new AssessFinancialDependencyCommand(
      {
        dependencyAssessmentId: request.dependencyAssessmentId,
        monthlySupportEvidence: request.monthlySupportEvidence,
        dependencyRatio: request.dependencyRatio,
        dependencyPercentage: request.dependencyPercentage,
        assessmentMethod: request.assessmentMethod,
        monthlyNeeds: request.monthlyNeeds,
        totalDeceasedIncome: request.totalDeceasedIncome,
        reassessmentReason: request.reassessmentReason,
        effectiveDate: request.effectiveDate ? new Date(request.effectiveDate) : undefined,
        evidenceDocumentIds: request.evidenceDocumentIds,
        isCourtOrdered: request.isCourtOrdered,
      },
      metadata,
      correlationId,
      requestId,
    );
  }

  toFileS26ClaimCommand(
    request: FileS26ClaimRequest,
    metadata: CommandMetadata,
    correlationId?: string,
    requestId?: string,
  ): FileS26ClaimCommand {
    return new FileS26ClaimCommand(
      {
        dependencyAssessmentId: request.dependencyAssessmentId,
        amount: request.amount,
        currency: request.currency,
        claimType: request.claimType,
        claimReason: request.claimReason,
        claimStartDate: request.claimStartDate ? new Date(request.claimStartDate) : undefined,
        claimEndDate: request.claimEndDate ? new Date(request.claimEndDate) : undefined,
        courtCaseNumber: request.courtCaseNumber,
        legalRepresentativeId: request.legalRepresentativeId,
        supportingDocuments: request.supportingDocuments.map((doc) => ({
          documentId: doc.documentId,
          documentType: doc.documentType,
          description: doc.description,
          documentDate: doc.documentDate ? new Date(doc.documentDate) : undefined,
        })),
        monthlyBreakdownAmount: request.monthlyBreakdownAmount,
        numberOfMonths: request.numberOfMonths,
        declaredBy: request.declaredBy,
        declarationDate: request.declarationDate ? new Date(request.declarationDate) : new Date(),
        isVerified: request.isVerified,
        hasFiledAffidavit: request.hasFiledAffidavit,
        affidavitFilingDate: request.affidavitFilingDate
          ? new Date(request.affidavitFilingDate)
          : undefined,
      },
      metadata,
      correlationId,
      requestId,
    );
  }

  toRecordCourtProvisionCommand(
    request: RecordCourtProvisionRequest,
    metadata: CommandMetadata,
    correlationId?: string,
    requestId?: string,
  ): RecordCourtProvisionCommand {
    return new RecordCourtProvisionCommand(
      {
        dependencyAssessmentId: request.dependencyAssessmentId,
        orderNumber: request.orderNumber,
        approvedAmount: request.approvedAmount,
        provisionType: request.provisionType,
        orderDate: new Date(request.orderDate),
        courtName: request.courtName,
        judgeName: request.judgeName,
        caseNumber: request.caseNumber,
        paymentSchedule: request.paymentSchedule,
        firstPaymentDate: request.firstPaymentDate ? new Date(request.firstPaymentDate) : undefined,
        numberOfInstallments: request.numberOfInstallments,
        bankAccountDetails: request.bankAccountDetails,
        installmentSchedule: request.installmentSchedule?.map((installment) => ({
          installmentNumber: installment.installmentNumber,
          amount: installment.amount,
          dueDate: new Date(installment.dueDate),
          paymentMethod: installment.paymentMethod,
        })),
        propertyDetails: request.propertyDetails,
        legalSection: request.legalSection,
        conditions: request.conditions,
        nextReviewDate: request.nextReviewDate ? new Date(request.nextReviewDate) : undefined,
        monitoringOfficer: request.monitoringOfficer,
        recordedBy: request.recordedBy,
        isFinalOrder: request.isFinalOrder,
        isAppealable: request.isAppealable,
        appealDeadline: request.appealDeadline ? new Date(request.appealDeadline) : undefined,
      },
      metadata,
      correlationId,
      requestId,
    );
  }

  toGetDependencyByIdQuery(
    dependencyId: string,
    options: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): GetDependencyByIdQuery {
    return new GetDependencyByIdQuery(dependencyId, {
      includeDeceasedDetails: options.includeDeceasedDetails,
      includeDependantDetails: options.includeDependantDetails,
      includeEvidenceDocuments: options.includeEvidenceDocuments,
      includeCourtOrderDetails: options.includeCourtOrderDetails,
      includeAuditHistory: options.includeAuditHistory,
      requestId,
      userId: metadata?.userId,
      userRole: metadata?.userRole,
    });
  }

  toListDependenciesByDeceasedQuery(
    deceasedId: string,
    options: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): ListDependenciesByDeceasedQuery {
    return new ListDependenciesByDeceasedQuery(deceasedId, {
      status: options.status,
      basis: options.basis,
      dependencyLevel: options.dependencyLevel,
      isMinor: options.isMinor,
      isStudent: options.isStudent,
      hasDisability: options.hasDisability,
      hasCourtOrder: options.hasCourtOrder,
      isClaimant: options.isClaimant,
      minDependencyPercentage: options.minDependencyPercentage,
      maxDependencyPercentage: options.maxDependencyPercentage,
      minClaimAmount: options.minClaimAmount,
      maxClaimAmount: options.maxClaimAmount,
      createdAfter: options.createdAfter,
      createdBefore: options.createdBefore,
      updatedAfter: options.updatedAfter,
      updatedBefore: options.updatedBefore,
      courtOrderAfter: options.courtOrderAfter,
      courtOrderBefore: options.courtOrderBefore,
      hasEvidence: options.hasEvidence,
      minEvidenceDocuments: options.minEvidenceDocuments,
      searchTerm: options.searchTerm,
      includeDependantDetails: options.includeDependantDetails,
      includeCourtOrderDetails: options.includeCourtOrderDetails,
      page: options.page,
      limit: options.limit,
      sortBy: options.sortBy,
      sortDirection: options.sortDirection,
      requestId,
      userId: metadata?.userId,
      userRole: metadata?.userRole,
    });
  }

  toCheckS29ComplianceQuery(
    deceasedId: string,
    options: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): CheckS29ComplianceQuery {
    return new CheckS29ComplianceQuery(deceasedId, {
      checkLevel: options.checkLevel,
      reportFormat: options.reportFormat,
      includeRecommendations: options.includeRecommendations,
      includeLegalCitations: options.includeLegalCitations,
      includeCaseStudies: options.includeCaseStudies,
      calculateDistribution: options.calculateDistribution,
      validateAgainstEstateValue: options.validateAgainstEstateValue,
      estateValue: options.estateValue,
      jurisdiction: options.jurisdiction,
      asOfDate: options.asOfDate,
      requestId,
      userId: metadata?.userId,
      userRole: metadata?.userRole,
    });
  }

  toGetDependencyStatisticsQuery(
    deceasedId: string,
    options: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): GetDependencyStatisticsQuery {
    return new GetDependencyStatisticsQuery(deceasedId, {
      granularity: options.granularity,
      timePeriod: options.timePeriod,
      startDate: options.startDate,
      endDate: options.endDate,
      includeTrends: options.includeTrends,
      includeComparisons: options.includeComparisons,
      includeFinancialSummary: options.includeFinancialSummary,
      includeLegalCompliance: options.includeLegalCompliance,
      comparisonDeceasedId: options.comparisonDeceasedId,
      exportToCsv: options.exportToCsv,
      exportFormat: options.exportFormat,
      requestId,
      userId: metadata?.userId,
      userRole: metadata?.userRole,
    });
  }
}
