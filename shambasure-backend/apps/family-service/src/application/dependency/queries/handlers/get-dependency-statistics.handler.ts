// application/dependency/queries/handlers/get-dependency-statistics.handler.ts
import { Injectable } from '@nestjs/common';

import { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { GetDependencyStatisticsQuery } from '../impl/get-dependency-statistics.query';
import { BaseQueryHandler, QueryHandlerResult } from './base.handler';

@Injectable()
export class GetDependencyStatisticsHandler extends BaseQueryHandler<
  GetDependencyStatisticsQuery,
  any
> {
  constructor(repository: ILegalDependantRepository, mapper: DependencyMapper) {
    super(repository, mapper);
  }

  async execute(query: GetDependencyStatisticsQuery): Promise<QueryHandlerResult> {
    const startTime = Date.now();

    try {
      // 1. Validate query
      const validation = this.validateQuery(query);
      if (!validation.isValid) {
        return this.createErrorResult(
          'Query validation failed',
          query,
          validation.errors,
          validation.warnings,
          Date.now() - startTime,
        );
      }

      // 2. Check permissions
      const permissionCheck = this.checkQueryPermissions(
        { userId: query.userId!, userRole: query.userRole! },
        query,
      );
      if (!permissionCheck.hasPermission) {
        return this.createErrorResult(
          permissionCheck.reason!,
          query,
          ['PERMISSION_DENIED'],
          validation.warnings,
          Date.now() - startTime,
        );
      }

      // 3. Execute query with performance monitoring
      const { result: statistics, duration } = await this.withPerformanceMonitoring(async () => {
        // Get date range
        const { startDate, endDate } = query.getDateRange();

        // Fetch statistics from repository
        const stats = await this.repository.getDependencyStatistics(query.deceasedId);

        // Apply time filter if needed
        const filteredStats = await this.applyTimeFilter(stats, startDate, endDate, query);

        // Generate detailed statistics based on granularity
        const detailedStats = this.generateDetailedStatistics(filteredStats, query);

        // Add trends if requested
        if (query.includeTrends) {
          detailedStats.trends = await this.generateTrends(query, startDate, endDate);
        }

        // Add comparisons if requested
        if (query.includeComparisons && query.comparisonDeceasedId) {
          detailedStats.comparisons = await this.generateComparisons(query);
        }

        // Add financial summary if requested
        if (query.includeFinancialSummary) {
          detailedStats.financialSummary = this.generateFinancialSummary(filteredStats);
        }

        // Add legal compliance if requested
        if (query.includeLegalCompliance) {
          detailedStats.legalCompliance = this.generateLegalCompliance(filteredStats);
        }

        return detailedStats;
      }, query);

      // 4. Format for export if requested
      let formattedResult = statistics;
      if (query.exportToCsv) {
        formattedResult = this.formatForExport(statistics, query.exportFormat);
      }

      // 5. Log success
      this.logQueryExecution(query, duration, true);

      return this.createSuccessResult(
        formattedResult,
        'Dependency statistics retrieved successfully',
        query,
        validation.warnings,
        duration,
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logQueryExecution(query, duration, false, error);

      return this.createErrorResult(
        `Failed to retrieve dependency statistics: ${error.message}`,
        query,
        ['EXECUTION_ERROR'],
        [],
        duration,
      );
    }
  }

  private async applyTimeFilter(
    stats: any,
    startDate: Date,
    endDate: Date,
    query: GetDependencyStatisticsQuery,
  ): Promise<any> {
    // In a real implementation, you would filter dependants by date
    // For now, we'll return the stats as-is and note the time period

    return {
      ...stats,
      timePeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period: query.timePeriod,
      },
    };
  }

  private generateDetailedStatistics(stats: any, query: GetDependencyStatisticsQuery): any {
    const detailedStats: any = {
      deceasedId: query.deceasedId,
      generatedAt: new Date().toISOString(),
      timePeriod: stats.timePeriod,
      overview: {
        totalDependants: stats.totalDependants || 0,
        totalPriorityDependants: stats.totalPriorityDependants || 0,
        totalNonPriorityDependants: stats.totalNonPriorityDependants || 0,
        averageDependencyPercentage: stats.averageDependencyPercentage || 0,
      },
    };

    // Generate statistics by granularity
    switch (query.granularity) {
      case 'BY_DEPENDENCY_BASIS':
        detailedStats.byDependencyBasis = this.generateByDependencyBasis(stats);
        break;
      case 'BY_DEPENDENCY_LEVEL':
        detailedStats.byDependencyLevel = this.generateByDependencyLevel(stats);
        break;
      case 'BY_CLAIM_STATUS':
        detailedStats.byClaimStatus = this.generateByClaimStatus(stats);
        break;
      case 'BY_DISABILITY_STATUS':
        detailedStats.byDisabilityStatus = this.generateByDisabilityStatus(stats);
        break;
      case 'BY_AGE_GROUP':
        detailedStats.byAgeGroup = this.generateByAgeGroup(stats);
        break;
      default: // OVERALL
        detailedStats.overall = stats;
    }

    return detailedStats;
  }

  private generateByDependencyBasis(stats: any): any {
    // This would come from aggregated repository data
    // For now, return sample structure
    return {
      SPOUSE: { count: 1, percentage: 20, averageDependency: 100 },
      CHILD: { count: 3, percentage: 60, averageDependency: 100 },
      PARENT: { count: 1, percentage: 20, averageDependency: 50 },
      totalCategories: 3,
    };
  }

  private generateByDependencyLevel(stats: any): any {
    return {
      FULL: { count: stats.totalFullDependants || 0, percentage: 0 },
      PARTIAL: { count: stats.totalPartialDependants || 0, percentage: 0 },
      NONE: {
        count:
          (stats.totalDependants || 0) -
          (stats.totalFullDependants || 0) -
          (stats.totalPartialDependants || 0),
        percentage: 0,
      },
    };
  }

  private generateByClaimStatus(stats: any): any {
    return {
      NO_CLAIM: { count: 0, percentage: 0 },
      PENDING: { count: stats.totalS26Claimants || 0, percentage: 0 },
      APPROVED: { count: stats.totalWithCourtOrders || 0, percentage: 0 },
      DENIED: { count: 0, percentage: 0 },
    };
  }

  private generateByDisabilityStatus(stats: any): any {
    return {
      WITH_DISABILITY: { count: stats.totalDisabled || 0, percentage: 0 },
      WITHOUT_DISABILITY: {
        count: (stats.totalDependants || 0) - (stats.totalDisabled || 0),
        percentage: 0,
      },
    };
  }

  private generateByAgeGroup(stats: any): any {
    return {
      MINORS: { count: stats.totalMinors || 0, percentage: 0 },
      ADULTS: {
        count: (stats.totalDependants || 0) - (stats.totalMinors || 0),
        percentage: 0,
      },
      STUDENTS: { count: stats.totalStudents || 0, percentage: 0 },
    };
  }

  private async generateTrends(
    query: GetDependencyStatisticsQuery,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // In a real implementation, you would fetch historical data
    // For now, return sample trend data
    return {
      dependencyPercentageTrend: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        values: [75, 78, 80, 82, 85],
        direction: 'INCREASING',
        rateOfChange: '+2.5% per month',
      },
      claimAmountTrend: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        values: [100000, 120000, 150000, 130000, 140000],
        direction: 'INCREASING',
        averageMonthlyChange: '+10000',
      },
    };
  }

  private async generateComparisons(query: GetDependencyStatisticsQuery): Promise<any> {
    if (!query.comparisonDeceasedId) {
      return null;
    }

    try {
      // Fetch comparison statistics
      const comparisonStats = await this.repository.getDependencyStatistics(
        query.comparisonDeceasedId,
      );

      return {
        comparisonDeceasedId: query.comparisonDeceasedId,
        mainTotalDependants: 0, // Would be actual value
        comparisonTotalDependants: comparisonStats.totalDependants || 0,
        difference: 0, // Would calculate
        percentageDifference: 0,
        insights: [
          'Comparison deceased has more dependants',
          'Higher average dependency percentage',
        ],
      };
    } catch (error) {
      this.logger.warn('Failed to generate comparison', error);
      return null;
    }
  }

  private generateFinancialSummary(stats: any): any {
    return {
      totalClaimAmount: stats.totalS26ClaimAmount || 0,
      totalCourtApprovedAmount: stats.totalCourtApprovedAmount || 0,
      totalMonthlySupport: stats.sumMonthlySupport || 0,
      averageClaimAmount: stats.totalS26ClaimAmount
        ? stats.totalS26ClaimAmount / (stats.totalS26Claimants || 1)
        : 0,
      averageCourtApprovalRate:
        stats.totalS26ClaimAmount && stats.totalCourtApprovedAmount
          ? (stats.totalCourtApprovedAmount / stats.totalS26ClaimAmount) * 100
          : 0,
      financialRiskLevel: this.calculateFinancialRisk(stats),
    };
  }

  private calculateFinancialRisk(stats: any): string {
    const totalClaims = stats.totalS26ClaimAmount || 0;
    const totalApproved = stats.totalCourtApprovedAmount || 0;

    if (totalClaims === 0) return 'LOW';

    const approvalRate = totalApproved / totalClaims;

    if (approvalRate > 0.8) return 'HIGH';
    if (approvalRate > 0.5) return 'MEDIUM';
    return 'LOW';
  }

  private generateLegalCompliance(stats: any): any {
    return {
      s29ComplianceRate: this.calculateS29ComplianceRate(stats),
      courtOrderCompliance: this.calculateCourtOrderCompliance(stats),
      evidenceCompleteness: this.calculateEvidenceCompleteness(stats),
      overallLegalRisk: this.calculateOverallLegalRisk(stats),
      recommendations: [
        'Ensure all S.26 claims have court orders',
        'Verify evidence for non-priority dependants',
        'Review minor dependant designations',
      ],
    };
  }

  private calculateS29ComplianceRate(stats: any): number {
    // Simplified calculation
    const total = stats.totalDependants || 1;
    const priority = stats.totalPriorityDependants || 0;
    const withEvidence = stats.totalFinancialEvidence || 0;

    return ((priority + withEvidence) / total) * 100;
  }

  private calculateCourtOrderCompliance(stats: any): number {
    const claimants = stats.totalS26Claimants || 0;
    const withOrders = stats.totalWithCourtOrders || 0;

    if (claimants === 0) return 100;
    return (withOrders / claimants) * 100;
  }

  private calculateEvidenceCompleteness(stats: any): number {
    const nonPriority = stats.totalNonPriorityDependants || 0;
    const withEvidence = stats.totalFinancialEvidence || 0;

    if (nonPriority === 0) return 100;
    return (withEvidence / nonPriority) * 100;
  }

  private calculateOverallLegalRisk(stats: any): string {
    const complianceRate = this.calculateS29ComplianceRate(stats);

    if (complianceRate >= 90) return 'LOW';
    if (complianceRate >= 70) return 'MEDIUM';
    return 'HIGH';
  }

  private formatForExport(statistics: any, format: string): any {
    switch (format) {
      case 'csv':
        // Convert to CSV format
        return this.convertToCsv(statistics);
      case 'excel':
        // Convert to Excel format (would use a library like exceljs)
        return this.convertToExcel(statistics);
      default:
        return statistics;
    }
  }

  private convertToCsv(statistics: any): string {
    // Simplified CSV conversion
    const rows: string[] = [];

    // Add headers
    rows.push('Statistic,Value');

    // Add data
    if (statistics.overview) {
      Object.entries(statistics.overview).forEach(([key, value]) => {
        rows.push(`${key},${value}`);
      });
    }

    return rows.join('\n');
  }

  private convertToExcel(statistics: any): any {
    // In a real implementation, you would use exceljs or similar
    return {
      message: 'Excel export not implemented in this example',
      statistics,
    };
  }

  protected checkQueryPermissions(
    metadata: { userId: string; userRole: string },
    query: GetDependencyStatisticsQuery,
  ): { hasPermission: boolean; reason?: string } {
    const baseCheck = super.checkQueryPermissions(metadata, query);
    if (!baseCheck.hasPermission) {
      return baseCheck;
    }

    // Statistical data may be sensitive
    const allowedRoles = ['ADMIN', 'ANALYST', 'RESEARCHER', 'SUPERVISOR', 'LAWYER', 'JUDGE'];

    if (!allowedRoles.includes(metadata.userRole)) {
      return {
        hasPermission: false,
        reason: 'Statistical data requires analyst or administrative role',
      };
    }

    // Check for comparison permissions
    if (query.includeComparisons && query.comparisonDeceasedId) {
      const comparisonRoles = ['ADMIN', 'RESEARCHER'];
      if (!comparisonRoles.includes(metadata.userRole)) {
        return {
          hasPermission: false,
          reason: 'Comparative statistics require researcher or admin role',
        };
      }
    }

    return { hasPermission: true };
  }
}
