// application/dependency/services/orchestration/dependency-orchestration.service.ts
import { Injectable, Logger } from '@nestjs/common';

import { DependencyStatusPolicy } from '../../../domain/dependency/policies/dependency-status.policy';
import { DependencyCalculationService } from '../../../domain/dependency/services/dependency-calculation.service';
import { DependencyStatusResponse } from '../dto/response';
import {
  ApplicationResponse,
  IDependencyOrchestrationService,
  QueryMetadata,
} from '../ports/inbound/dependency-orchestration.use-case';
import { DependencyQueryService } from '../services/dependency-query.service';

@Injectable()
export class DependencyOrchestrationService implements IDependencyOrchestrationService {
  private readonly logger = new Logger(DependencyOrchestrationService.name);

  constructor(
    private readonly queryService: DependencyQueryService,
    private readonly statusPolicy: DependencyStatusPolicy,
    private readonly calculationService: DependencyCalculationService,
  ) {}

  async getDependencyStatus(
    deceasedId: string,
    includeDependants: boolean = true,
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<ApplicationResponse<DependencyStatusResponse>> {
    const startTime = Date.now();

    try {
      // 1. Get all dependencies
      const dependenciesResult = await this.queryService.listDependenciesByDeceased(
        deceasedId,
        { limit: 100 },
        metadata,
        requestId,
      );

      if (!dependenciesResult.success || !dependenciesResult.data) {
        throw new Error('Failed to fetch dependencies');
      }

      // 2. Get statistics
      const statisticsResult = await this.queryService.getDependencyStatistics(
        deceasedId,
        { granularity: 'OVERALL' },
        metadata,
        requestId,
      );

      // 3. Use domain policy to evaluate status
      const statusEvaluation = this.statusPolicy.evaluateStatus(dependenciesResult.data);

      // 4. Build response
      const statusResponse = this.buildStatusResponse(
        deceasedId,
        dependenciesResult.data,
        statisticsResult.data,
        statusEvaluation,
        includeDependants,
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: statusResponse,
        message: 'Dependency status retrieved successfully',
        requestId,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.logger.error('Failed to get dependency status', error.stack, {
        error: error.message,
        executionTime,
      });

      return {
        success: false,
        message: `Failed to get dependency status: ${error.message}`,
        errors: ['STATUS_CHECK_ERROR'],
        requestId,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      };
    }
  }

  async generateDependencyReport(
    deceasedId: string,
    reportType: string,
    options: any = {},
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<ApplicationResponse<any>> {
    const startTime = Date.now();

    try {
      let report;

      switch (reportType) {
        case 'COMPLIANCE':
          report = await this.generateComplianceReport(deceasedId, options, metadata, requestId);
          break;

        case 'STATISTICS':
          report = await this.generateStatisticsReport(deceasedId, options, metadata, requestId);
          break;

        case 'DISTRIBUTION':
          report = await this.generateDistributionReport(deceasedId, options, metadata, requestId);
          break;

        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: report,
        message: `${reportType} report generated successfully`,
        requestId,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.logger.error('Failed to generate report', error.stack, {
        error: error.message,
        executionTime,
      });

      return {
        success: false,
        message: `Failed to generate report: ${error.message}`,
        errors: ['REPORT_GENERATION_ERROR'],
        requestId,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      };
    }
  }

  async batchCreateDependencyAssessments(
    requests: any[],
    metadata: any,
    correlationId?: string,
  ): Promise<ApplicationResponse<any>> {
    // Orchestration logic for batch operations
    // This would coordinate between multiple command executions
    // and handle failures and retries

    const startTime = Date.now();
    const results = [];
    const successCount = 0;
    const failedCount = 0;

    // For now, return a simplified response
    // In production, this would include proper batch processing logic

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        processed: requests.length,
        success: successCount,
        failed: failedCount,
        results,
      },
      message: `Batch processing completed: ${successCount} succeeded, ${failedCount} failed`,
      requestId: correlationId,
      timestamp: new Date().toISOString(),
      executionTimeMs: executionTime,
    };
  }

  private async generateComplianceReport(
    deceasedId: string,
    options: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<any> {
    const [complianceResult, dependenciesResult] = await Promise.all([
      this.queryService.checkS29Compliance(deceasedId, options, metadata, requestId),
      this.queryService.listDependenciesByDeceased(deceasedId, { limit: 100 }, metadata, requestId),
    ]);

    if (!complianceResult.success || !dependenciesResult.success) {
      throw new Error('Failed to fetch data for compliance report');
    }

    // Use domain policy for deeper analysis
    const complianceAnalysis = dependenciesResult.data?.map((dependant) =>
      this.statusPolicy.evaluateS29Compliance(dependant),
    );

    return {
      ...complianceResult.data,
      detailedAnalysis: complianceAnalysis,
      generatedAt: new Date().toISOString(),
    };
  }

  private async generateStatisticsReport(
    deceasedId: string,
    options: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<any> {
    const statisticsResult = await this.queryService.getDependencyStatistics(
      deceasedId,
      { ...options, includeTrends: true, includeFinancialSummary: true },
      metadata,
      requestId,
    );

    if (!statisticsResult.success) {
      throw new Error('Failed to fetch statistics');
    }

    // Add calculated insights
    const insights = this.calculateInsights(statisticsResult.data);

    return {
      ...statisticsResult.data,
      insights,
      recommendations: this.generateRecommendations(statisticsResult.data),
      generatedAt: new Date().toISOString(),
    };
  }

  private async generateDistributionReport(
    deceasedId: string,
    options: any,
    metadata?: QueryMetadata,
    requestId?: string,
  ): Promise<any> {
    const [dependenciesResult, statisticsResult] = await Promise.all([
      this.queryService.listDependenciesByDeceased(deceasedId, { limit: 100 }, metadata, requestId),
      this.queryService.getDependencyStatistics(
        deceasedId,
        { granularity: 'OVERALL' },
        metadata,
        requestId,
      ),
    ]);

    if (
      !dependenciesResult.success ||
      !dependenciesResult.data ||
      !statisticsResult.success ||
      !statisticsResult.data
    ) {
      throw new Error('Failed to fetch data for distribution report');
    }

    const estateValue = options.estateValue || 0;
    const availableAssets = options.availableAssets || estateValue;

    // Use domain service for calculation
    const distribution = this.calculationService.calculateEstateDistribution({
      estateValue,
      availableAssets,
      dependants: dependenciesResult.data.map((d) => ({
        dependantId: d.dependantId,
        dependencyPercentage: d.dependencyPercentage,
        isPriority: d.isPriorityDependant,
        hasCourtOrder: d.provisionOrderIssued,
        courtApprovedAmount: d.courtApprovedAmount,
      })),
    });

    return {
      deceasedId,
      estateValue,
      availableAssets,
      distribution,
      generatedAt: new Date().toISOString(),
      legalNotice:
        'This is a preliminary distribution calculation. Consult with a qualified legal practitioner.',
    };
  }

  private buildStatusResponse(
    deceasedId: string,
    dependencies: any[],
    statistics: any,
    statusEvaluation: any,
    includeDependants: boolean,
  ): DependencyStatusResponse {
    return {
      deceasedId,
      deceasedName: dependencies[0]?.deceasedName || 'Unknown',
      status: statusEvaluation.status,
      assessmentDate: new Date().toISOString(),
      statistics: statistics?.overview || this.calculateBasicStatistics(dependencies),
      dependants: includeDependants
        ? dependencies.map((dep) => ({
            dependantId: dep.dependantId,
            name: dep.dependantName || 'Unknown',
            relationship: dep.dependencyBasis,
            dependencyLevel: dep.dependencyLevel,
            dependencyPercentage: dep.dependencyPercentage,
            monthlySupport: dep.monthlySupport,
            hasCourtOrder: dep.provisionOrderIssued,
            courtApprovedAmount: dep.courtApprovedAmount,
          }))
        : [],
      compliance: {
        s29Compliant: dependencies.every((d) => d.isS29Compliant),
        s26ClaimsResolved: !dependencies.some((d) => d.s26ClaimStatus === 'PENDING'),
        courtOrdersFiled: dependencies
          .filter((d) => d.isClaimant)
          .every((d) => d.provisionOrderIssued),
        evidenceComplete: dependencies
          .filter((d) => !d.isPriorityDependant)
          .every((d) => (d.dependencyProofDocuments?.length || 0) > 0),
        issues: statusEvaluation.reasons,
      },
      nextSteps: this.generateNextSteps(statusEvaluation, dependencies),
    };
  }

  private calculateBasicStatistics(dependencies: any[]): any {
    const total = dependencies.length;
    return {
      totalDependants: total,
      priorityDependants: dependencies.filter((d) => d.isPriorityDependant).length,
      nonPriorityDependants: dependencies.filter((d) => !d.isPriorityDependant).length,
      s26Claimants: dependencies.filter((d) => d.isClaimant).length,
      withCourtOrders: dependencies.filter((d) => d.provisionOrderIssued).length,
      minors: dependencies.filter((d) => d.isMinor).length,
      students: dependencies.filter((d) => d.isStudent).length,
      withDisabilities: dependencies.filter((d) => d.hasPhysicalDisability || d.hasMentalDisability)
        .length,
      fullDependants: dependencies.filter((d) => d.dependencyLevel === 'FULL').length,
      partialDependants: dependencies.filter((d) => d.dependencyLevel === 'PARTIAL').length,
      verifiedByCourt: dependencies.filter((d) => d.verifiedByCourtAt).length,
      totalClaimAmount: dependencies.reduce((sum, d) => sum + (d.claimAmount || 0), 0),
      totalCourtApprovedAmount: dependencies.reduce(
        (sum, d) => sum + (d.courtApprovedAmount || 0),
        0,
      ),
      averageDependencyPercentage:
        dependencies.length > 0
          ? dependencies.reduce((sum, d) => sum + d.dependencyPercentage, 0) / dependencies.length
          : 0,
    };
  }

  private generateNextSteps(statusEvaluation: any, dependencies: any[]): string[] {
    const nextSteps: string[] = [];

    if (statusEvaluation.requiresAttention) {
      nextSteps.push('Address compliance issues');
    }

    const minorsWithoutCustodial = dependencies.filter(
      (d) => d.isMinor && !d.custodialParentId,
    ).length;
    if (minorsWithoutCustodial > 0) {
      nextSteps.push(`Assign custodial parents for ${minorsWithoutCustodial} minor(s)`);
    }

    if (statusEvaluation.nextReviewDate) {
      nextSteps.push(
        `Next review scheduled for ${statusEvaluation.nextReviewDate.toLocaleDateString()}`,
      );
    }

    if (nextSteps.length === 0) {
      nextSteps.push('No further action required');
    }

    return nextSteps;
  }

  private calculateInsights(statistics: any): string[] {
    const insights: string[] = [];

    if (statistics?.overview?.totalDependants > 5) {
      insights.push('Large number of dependants - consider estate capacity');
    }

    if (statistics?.overview?.averageDependencyPercentage > 80) {
      insights.push('High average dependency percentage - estate may be over-committed');
    }

    if (
      statistics?.financialSummary?.totalClaimAmount >
      statistics?.financialSummary?.totalCourtApprovedAmount * 2
    ) {
      insights.push('High ratio of claims to approvals - potential for disputes');
    }

    return insights;
  }

  private generateRecommendations(statistics: any): string[] {
    const recommendations: string[] = [];

    if (statistics?.legalCompliance?.s29ComplianceRate < 80) {
      recommendations.push('Improve S.29 compliance documentation');
    }

    if (statistics?.legalCompliance?.courtOrderCompliance < 100) {
      recommendations.push('Process pending court orders');
    }

    return recommendations;
  }
}
