import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Result } from '../../common/base/result';
import {
  AssessFinancialDependencyCommand,
  AssessmentMethod,
} from '../commands/impl/assess-dependant-dependency.command';
import {
  CreateDependencyAssessmentCommand,
  EvidenceDocumentCommand,
} from '../commands/impl/create-dependency-assessment.command';
import {
  FileS26ClaimCommand,
  S26ClaimType,
  SupportingDocumentCommand,
} from '../commands/impl/update-dependant-dependency.command';
import {
  ProvisionType,
  RecordCourtProvisionCommand,
} from '../commands/impl/record-court-dependency-order.command';
import {
  AssessFinancialDependencyRequest,
  CreateDependencyAssessmentRequest,
  FileS26ClaimRequest,
  RecordCourtProvisionRequest,
} from '../dto/request';
import {
  DependencyAssessmentResponse,
  DependencyStatistics,
  DependencyStatusResponse,
} from '../dto/response';
import { IDependencyUseCase } from '../ports/inbound/dependency.use-case';
import {
  CheckS29ComplianceQuery,
  GetDependencyByIdQuery,
  GetDependencyStatisticsQuery,
  ListDependenciesByDeceasedQuery,
  SearchDependenciesQuery,
} from '../queries/impl';

@Injectable()
export class DependencyApplicationService implements IDependencyUseCase {
  private readonly logger = new Logger(DependencyApplicationService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // --- Commands ---

  async createAssessment(
    request: CreateDependencyAssessmentRequest,
  ): Promise<Result<DependencyAssessmentResponse>> {
    try {
      this.logger.log(`Creating dependency assessment for deceased ${request.deceasedId}`);

      const evidenceDocs = request.dependencyProofDocuments?.map((doc) => {
        const cmd = new EvidenceDocumentCommand();
        cmd.documentId = doc.documentId;
        cmd.evidenceType = doc.evidenceType;
        cmd.addedAt = doc.addedAt ? new Date(doc.addedAt) : new Date();
        return cmd;
      });

      const command = new CreateDependencyAssessmentCommand(
        {
          deceasedId: request.deceasedId,
          dependantId: request.dependantId,
          dependencyBasis: request.dependencyBasis,
          isMinor: request.isMinor,
          dependencyLevel: request.dependencyLevel,
          isStudent: request.isStudent,
          studentUntil: request.studentUntil ? new Date(request.studentUntil) : undefined,
          hasPhysicalDisability: request.hasPhysicalDisability,
          hasMentalDisability: request.hasMentalDisability,
          requiresOngoingCare: request.requiresOngoingCare,
          disabilityDetails: request.disabilityDetails,
          monthlySupport: request.monthlySupport,
          supportStartDate: request.supportStartDate
            ? new Date(request.supportStartDate)
            : undefined,
          supportEndDate: request.supportEndDate ? new Date(request.supportEndDate) : undefined,
          assessmentMethod: request.assessmentMethod,
          dependencyPercentage: request.dependencyPercentage,
          custodialParentId: request.custodialParentId,
          dependencyProofDocuments: evidenceDocs,
          courtCaseReference: request.courtCaseReference,
        },
        {
          userId: request.createdBy || 'SYSTEM',
          userRole: 'USER',
        },
        crypto.randomUUID(),
      );

      return await this.commandBus.execute(command);
    } catch (error) {
      this.logger.error(`Failed to create assessment: ${error.message}`, error.stack);
      return Result.fail(error);
    }
  }

  async assessFinancialDependency(
    request: AssessFinancialDependencyRequest,
  ): Promise<Result<DependencyAssessmentResponse>> {
    try {
      this.logger.log(`Assessing financial dependency for ${request.dependencyAssessmentId}`);

      const command = new AssessFinancialDependencyCommand(
        {
          dependencyAssessmentId: request.dependencyAssessmentId,
          monthlySupportEvidence: request.monthlySupportEvidence,
          dependencyRatio: request.dependencyRatio,
          dependencyPercentage: request.dependencyPercentage,
          assessmentMethod: request.assessmentMethod as AssessmentMethod,
          monthlyNeeds: request.monthlyNeeds,
          totalDeceasedIncome: request.totalDeceasedIncome,
          reassessmentReason: request.recalculationReason,
          effectiveDate: request.effectiveDate ? new Date(request.effectiveDate) : new Date(),
        },
        {
          userId: request.assessedBy || 'SYSTEM',
          userRole: 'EXPERT_ASSESSOR',
        },
        crypto.randomUUID(),
      );

      return await this.commandBus.execute(command);
    } catch (error) {
      this.logger.error(`Failed to assess dependency: ${error.message}`, error.stack);
      return Result.fail(error);
    }
  }

  async fileSection26Claim(
    request: FileS26ClaimRequest,
  ): Promise<Result<DependencyAssessmentResponse>> {
    try {
      this.logger.log(`Filing S.26 claim for ${request.dependencyAssessmentId}`);

      const supportingDocs = request.supportingDocuments.map((doc) => {
        const cmd = new SupportingDocumentCommand();
        cmd.documentId = doc.documentId;
        cmd.documentType = doc.documentType;
        cmd.description = doc.description;
        cmd.documentDate = doc.documentDate ? new Date(doc.documentDate) : undefined;
        return cmd;
      });

      const command = new FileS26ClaimCommand(
        {
          dependencyAssessmentId: request.dependencyAssessmentId,
          amount: request.amount,
          currency: request.currency,
          claimType: request.claimType as S26ClaimType,
          claimReason: request.claimReason,
          claimStartDate: request.claimStartDate ? new Date(request.claimStartDate) : undefined,
          claimEndDate: request.claimEndDate ? new Date(request.claimEndDate) : undefined,
          courtCaseNumber: request.courtCaseNumber,
          legalRepresentativeId: request.legalRepresentativeId,
          supportingDocuments: supportingDocs,
          monthlyBreakdownAmount: request.monthlyBreakdownAmount,
          numberOfMonths: request.numberOfMonths,
          declaredBy: request.declaredBy,
          declarationDate: request.declarationDate ? new Date(request.declarationDate) : new Date(),
          isVerified: request.isVerified,
        },
        {
          userId: request.declaredBy,
          userRole: 'CLAIMANT',
        },
        crypto.randomUUID(),
      );

      return await this.commandBus.execute(command);
    } catch (error) {
      this.logger.error(`Failed to file S.26 claim: ${error.message}`, error.stack);
      return Result.fail(error);
    }
  }

  async recordCourtProvision(
    request: RecordCourtProvisionRequest,
  ): Promise<Result<DependencyAssessmentResponse>> {
    try {
      this.logger.log(`Recording court provision ${request.orderNumber}`);

      let bankDetails: any = undefined;
      if (request.bankAccountDetails) {
        bankDetails =
          typeof request.bankAccountDetails === 'string'
            ? JSON.parse(request.bankAccountDetails)
            : request.bankAccountDetails;
      }

      const command = new RecordCourtProvisionCommand(
        {
          dependencyAssessmentId: request.dependencyAssessmentId,
          orderNumber: request.orderNumber,
          approvedAmount: request.approvedAmount,
          provisionType: request.provisionType as ProvisionType,
          orderDate: new Date(request.orderDate),
          courtName: request.courtName,
          judgeName: request.judgeName,
          caseNumber: request.caseNumber,
          paymentSchedule: request.paymentSchedule,
          firstPaymentDate: request.firstPaymentDate
            ? new Date(request.firstPaymentDate)
            : undefined,
          numberOfInstallments: request.numberOfInstallments,
          bankAccountDetails: bankDetails,
          propertyDetails: request.propertyDetails,
          legalSection: request.legalSection,
          conditions: request.conditions,
          nextReviewDate: request.nextReviewDate ? new Date(request.nextReviewDate) : undefined,
          recordedBy: request.recordedBy,
          isFinalOrder: request.isFinalOrder,
        },
        {
          userId: request.recordedBy,
          userRole: 'COURT_OFFICER',
        },
        crypto.randomUUID(),
      );

      return await this.commandBus.execute(command);
    } catch (error) {
      this.logger.error(`Failed to record court provision: ${error.message}`, error.stack);
      return Result.fail(error);
    }
  }

  // --- Queries ---

  async getAssessmentById(
    query: GetDependencyByIdQuery,
  ): Promise<Result<DependencyAssessmentResponse>> {
    try {
      return await this.queryBus.execute(query);
    } catch (error) {
      this.logger.error(`Failed to get assessment: ${error.message}`, error.stack);
      return Result.fail(error);
    }
  }

  async listByDeceased(
    query: ListDependenciesByDeceasedQuery,
  ): Promise<Result<DependencyAssessmentResponse[]>> {
    try {
      return await this.queryBus.execute(query);
    } catch (error) {
      this.logger.error(`Failed to list dependencies: ${error.message}`, error.stack);
      return Result.fail(error);
    }
  }

  async checkS29Compliance(
    query: CheckS29ComplianceQuery,
  ): Promise<Result<DependencyStatusResponse>> {
    try {
      return await this.queryBus.execute(query);
    } catch (error) {
      this.logger.error(`Failed to check compliance: ${error.message}`, error.stack);
      return Result.fail(error);
    }
  }

  async getStatistics(query: GetDependencyStatisticsQuery): Promise<Result<DependencyStatistics>> {
    try {
      return await this.queryBus.execute(query);
    } catch (error) {
      this.logger.error(`Failed to get statistics: ${error.message}`, error.stack);
      return Result.fail(error);
    }
  }

  async search(query: SearchDependenciesQuery): Promise<Result<DependencyAssessmentResponse[]>> {
    try {
      return await this.queryBus.execute(query);
    } catch (error) {
      this.logger.error(`Failed to search dependencies: ${error.message}`, error.stack);
      return Result.fail(error);
    }
  }
}
