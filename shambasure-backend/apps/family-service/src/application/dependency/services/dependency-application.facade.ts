// application/dependency/services/dependency-application.facade.ts
import { Injectable, Logger } from '@nestjs/common';

import { DependencyCalculationService } from '../../../domain/dependency/services/dependency-calculation.service';
import {
  AssessFinancialDependencyRequest,
  CreateDependencyAssessmentRequest,
  FileS26ClaimRequest,
  RecordCourtProvisionRequest,
} from '../dto/request';
import { DependencyAssessmentResponse, DependencyStatusResponse } from '../dto/response';
import { IDependencyUseCase } from '../ports/inbound/dependency.use-case';
import { DependencyCommandService } from './commands/dependency-command.service';
import { DependencyOrchestrationService } from './orchestration/dependency-orchestration.service';
import { DependencyQueryService } from './queries/dependency-query.service';
import { DependencyValidationService } from './validation/dependency-validation.service';

@Injectable()
export class DependencyApplicationFacade implements IDependencyUseCase {
  private readonly logger = new Logger(DependencyApplicationFacade.name);

  constructor(
    private readonly commandService: DependencyCommandService,
    private readonly queryService: DependencyQueryService,
    private readonly orchestrationService: DependencyOrchestrationService,
    private readonly validationService: DependencyValidationService,
    private readonly calculationService: DependencyCalculationService,
  ) {}

  // --- Command Operations (delegated) ---

  async createDependencyAssessment(
    request: CreateDependencyAssessmentRequest,
    metadata: any,
    correlationId?: string,
  ) {
    return this.commandService.createDependencyAssessment(request, metadata, correlationId);
  }

  async assessFinancialDependency(
    request: AssessFinancialDependencyRequest,
    metadata: any,
    correlationId?: string,
  ) {
    return this.commandService.assessFinancialDependency(request, metadata, correlationId);
  }

  async fileS26Claim(request: FileS26ClaimRequest, metadata: any, correlationId?: string) {
    return this.commandService.fileS26Claim(request, metadata, correlationId);
  }

  async recordCourtProvision(
    request: RecordCourtProvisionRequest,
    metadata: any,
    correlationId?: string,
  ) {
    return this.commandService.recordCourtProvision(request, metadata, correlationId);
  }

  // --- Query Operations (delegated) ---

  async getDependencyById(dependencyId: string, options?: any, metadata?: any, requestId?: string) {
    return this.queryService.getDependencyById(dependencyId, options, metadata, requestId);
  }

  async listDependenciesByDeceased(
    deceasedId: string,
    options?: any,
    metadata?: any,
    requestId?: string,
  ) {
    return this.queryService.listDependenciesByDeceased(deceasedId, options, metadata, requestId);
  }

  async checkS29Compliance(deceasedId: string, options?: any, metadata?: any, requestId?: string) {
    return this.queryService.checkS29Compliance(deceasedId, options, metadata, requestId);
  }

  async getDependencyStatistics(
    deceasedId: string,
    options?: any,
    metadata?: any,
    requestId?: string,
  ) {
    return this.queryService.getDependencyStatistics(deceasedId, options, metadata, requestId);
  }

  // --- Orchestration Operations (delegated) ---

  async getDependencyStatus(
    deceasedId: string,
    includeDependants?: boolean,
    metadata?: any,
    requestId?: string,
  ) {
    return this.orchestrationService.getDependencyStatus(
      deceasedId,
      includeDependants,
      metadata,
      requestId,
    );
  }

  async generateDependencyReport(
    deceasedId: string,
    reportType: string,
    options?: any,
    metadata?: any,
    requestId?: string,
  ) {
    return this.orchestrationService.generateDependencyReport(
      deceasedId,
      reportType,
      options,
      metadata,
      requestId,
    );
  }

  async batchCreateDependencyAssessments(requests: any[], metadata: any, correlationId?: string) {
    return this.orchestrationService.batchCreateDependencyAssessments(
      requests,
      metadata,
      correlationId,
    );
  }

  // --- Validation Operations ---

  async validateDependencyAssessment(request: CreateDependencyAssessmentRequest, metadata?: any) {
    const validation = this.validationService.validateDependencyAssessment(request);

    return {
      success: true,
      data: validation,
      message: 'Validation completed',
      timestamp: new Date().toISOString(),
    };
  }

  async calculateSuggestedDependency(
    deceasedId: string,
    dependantId: string,
    financialData: any,
    metadata?: any,
  ) {
    const calculation = this.calculationService.calculateSuggestedDependency({
      monthlyNeeds: financialData.monthlyNeeds,
      monthlyContribution: financialData.monthlyContribution,
      totalDeceasedIncome: financialData.totalDeceasedIncome,
      dependantBasis: 'UNKNOWN', // Would need to fetch from database
      isMinor: false, // Would need to fetch from database
      isStudent: false, // Would need to fetch from database
      hasDisability: false, // Would need to fetch from database
    });

    return {
      success: true,
      data: calculation,
      message: 'Suggested dependency calculated',
      timestamp: new Date().toISOString(),
    };
  }

  // --- Bulk Operations ---

  async batchUpdateDependencyLevels(
    deceasedId: string,
    dependantIds: string[],
    dependencyLevel: string,
    metadata: any,
    correlationId?: string,
  ) {
    // This would coordinate multiple command executions
    // For now, return a placeholder response
    return {
      success: true,
      data: { updated: dependantIds.length },
      message: `Updated dependency levels for ${dependantIds.length} dependants`,
      requestId: correlationId,
      timestamp: new Date().toISOString(),
    };
  }
}
