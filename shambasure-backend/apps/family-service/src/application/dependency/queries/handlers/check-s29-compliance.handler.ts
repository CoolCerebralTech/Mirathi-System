// application/dependency/queries/handlers/check-s29-compliance.handler.ts
import { Injectable } from '@nestjs/common';

import { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { DependencyMapper } from '../../mappers/dependency.mapper';
import { CheckS29ComplianceQuery } from '../impl/check-s29-compliance.query';
import { BaseQueryHandler, QueryHandlerResult } from './base.handler';

@Injectable()
export class CheckS29ComplianceHandler extends BaseQueryHandler<CheckS29ComplianceQuery, any> {
  constructor(repository: ILegalDependantRepository, mapper: DependencyMapper) {
    super(repository, mapper);
  }

  async execute(query: CheckS29ComplianceQuery): Promise<QueryHandlerResult> {
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

      // 2. Check permissions - compliance checks may require legal expertise
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
      const { result: complianceReport, duration } = await this.withPerformanceMonitoring(
        async () => {
          // Fetch all dependants for the deceased
          const dependants = await this.repository.findAllByDeceasedId(query.deceasedId);

          // Generate compliance report
          return this.generateComplianceReport(dependants, query);
        },
        query,
      );

      // 4. Log success
      this.logQueryExecution(query, duration, true);

      return this.createSuccessResult(
        complianceReport,
        'S.29 compliance check completed successfully',
        query,
        validation.warnings,
        duration,
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logQueryExecution(query, duration, false, error);

      return this.createErrorResult(
        `Failed to check S.29 compliance: ${error.message}`,
        query,
        ['EXECUTION_ERROR'],
        [],
        duration,
      );
    }
  }

  private async generateComplianceReport(
    dependants: any[],
    query: CheckS29ComplianceQuery,
  ): Promise<any> {
    const report: any = {
      deceasedId: query.deceasedId,
      checkDate: new Date().toISOString(),
      checkLevel: query.checkLevel,
      jurisdiction: query.jurisdiction,
      summary: {
        totalDependants: dependants.length,
        compliantDependants: 0,
        nonCompliantDependants: 0,
        requiresAttention: 0,
        overallCompliance: 'UNKNOWN',
      },
      dependants: [],
      issues: [],
      recommendations: [],
      legalAnalysis: [],
    };

    // Check each dependant
    for (const dependant of dependants) {
      const dependantCompliance = this.checkDependantCompliance(dependant, query);

      report.dependants.push({
        dependantId: dependant.dependantId,
        dependencyBasis: dependant.dependencyBasis,
        dependencyLevel: dependant.dependencyLevel,
        dependencyPercentage: dependant.dependencyPercentage,
        isMinor: dependant.isMinor,
        isStudent: dependant.isStudent,
        hasDisability: dependant.hasDisability,
        hasCourtOrder: dependant.hasCourtOrder,
        isClaimant: dependant.isClaimant,
        compliance: dependantCompliance,
      });

      if (dependantCompliance.isCompliant) {
        report.summary.compliantDependants++;
      } else {
        report.summary.nonCompliantDependants++;
        report.summary.requiresAttention += dependantCompliance.issues.length;

        report.issues.push({
          dependantId: dependant.dependantId,
          issues: dependantCompliance.issues,
          severity: dependantCompliance.severity,
        });
      }
    }

    // Generate overall compliance status
    report.summary.overallCompliance = this.calculateOverallCompliance(report);

    // Generate recommendations
    if (query.includeRecommendations) {
      report.recommendations = this.generateRecommendations(report);
    }

    // Add legal analysis if requested
    if (query.includeLegalCitations) {
      report.legalAnalysis = this.generateLegalAnalysis(report, query);
    }

    // Calculate distribution if requested
    if (query.calculateDistribution && query.estateValue) {
      report.distribution = this.calculateDistribution(report, query.estateValue);
    }

    // Validate against estate value if requested
    if (query.validateAgainstEstateValue && query.estateValue) {
      report.estateValidation = this.validateAgainstEstate(report, query.estateValue);
    }

    // Format report based on requested format
    return this.formatReport(report, query.reportFormat);
  }

  private checkDependantCompliance(dependant: any, query: CheckS29ComplianceQuery): any {
    const issues: string[] = [];
    let isCompliant = true;
    let severity = 'LOW';

    // Check 1: Priority dependants (spouse, children) should have FULL dependency
    if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(dependant.dependencyBasis)) {
      if (dependant.dependencyLevel !== 'FULL') {
        issues.push('Priority dependant (spouse/child) should have FULL dependency level');
        isCompliant = false;
        severity = 'HIGH';
      }
    }

    // Check 2: Non-priority dependants need evidence
    if (!['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(dependant.dependencyBasis)) {
      const hasEvidence =
        dependant.dependencyProofDocuments && dependant.dependencyProofDocuments.length > 0;

      if (!hasEvidence && dependant.dependencyPercentage > 0) {
        issues.push('Non-priority dependant lacks supporting evidence');
        isCompliant = false;
        severity = 'MEDIUM';
      }
    }

    // Check 3: S.26 claimants should have court orders
    if (dependant.isClaimant && !dependant.hasCourtOrder) {
      issues.push('S.26 claimant lacks court order');
      isCompliant = false;
      severity = 'HIGH';
    }

    // Check 4: Minors need custodial parent
    if (dependant.isMinor && !dependant.custodialParentId) {
      issues.push('Minor dependant lacks custodial parent designation');
      isCompliant = false;
      severity = 'MEDIUM';
    }

    // Check 5: Adult students need end dates
    if (dependant.isStudent && !dependant.isMinor && !dependant.studentUntil) {
      issues.push('Adult student lacks expected graduation/end date');
      isCompliant = false;
      severity = 'LOW';
    }

    // Check 6: Disability without care requirements
    if (dependant.hasDisability && !dependant.requiresOngoingCare) {
      issues.push('Dependant with disability lacks ongoing care requirement designation');
      isCompliant = false;
      severity = 'LOW';
    }

    // Check 7: Dependency percentage consistency
    if (dependant.dependencyPercentage < 0 || dependant.dependencyPercentage > 100) {
      issues.push('Invalid dependency percentage');
      isCompliant = false;
      severity = 'HIGH';
    }

    // Additional checks for detailed/legal level
    if (query.checkLevel === 'DETAILED' || query.checkLevel === 'LEGAL') {
      // Check financial evidence for partial dependants
      if (dependant.dependencyLevel === 'PARTIAL' && !dependant.monthlySupportEvidence) {
        issues.push('Partial dependant lacks financial dependency evidence');
        isCompliant = false;
        severity = 'MEDIUM';
      }
    }

    return {
      isCompliant,
      issues,
      severity,
      lastChecked: new Date().toISOString(),
    };
  }

  private calculateOverallCompliance(report: any): string {
    if (report.summary.nonCompliantDependants === 0) {
      return 'FULLY_COMPLIANT';
    } else if (report.summary.nonCompliantDependants < report.summary.totalDependants * 0.2) {
      return 'MOSTLY_COMPLIANT';
    } else if (report.summary.nonCompliantDependants < report.summary.totalDependants * 0.5) {
      return 'PARTIALLY_COMPLIANT';
    } else {
      return 'NON_COMPLIANT';
    }
  }

  private generateRecommendations(report: any): string[] {
    const recommendations: string[] = [];

    if (report.summary.nonCompliantDependants > 0) {
      recommendations.push(
        `Address ${report.summary.nonCompliantDependants} non-compliant dependants`,
      );

      // Specific recommendations based on issues
      const highSeverityIssues = report.issues.filter((issue: any) => issue.severity === 'HIGH');
      if (highSeverityIssues.length > 0) {
        recommendations.push(
          `Resolve ${highSeverityIssues.length} high-severity compliance issues`,
        );
      }
    }

    if (report.summary.totalDependants === 0) {
      recommendations.push('No dependants declared. Consider if any dependants exist under S.29.');
    }

    // Add jurisdiction-specific recommendations
    if (report.jurisdiction === 'Kenya') {
      recommendations.push('Review against recent Kenyan court precedents on dependency');
    }

    return recommendations;
  }

  private generateLegalAnalysis(report: any, query: CheckS29ComplianceQuery): any[] {
    const legalAnalysis = [];

    // Kenyan Law of Succession Act citations
    legalAnalysis.push({
      section: 'Section 29',
      citation: 'Law of Succession Act, Cap 160',
      relevance: 'Defines dependants eligible for provision from estate',
      interpretation:
        'Includes spouse, children, parents, siblings, and others substantially maintained',
    });

    // Add case law if available
    if (query.includeCaseStudies) {
      legalAnalysis.push({
        case: 'Re Estate of Githinji (2010)',
        citation: 'eKLR citation',
        relevance: 'Interpretation of "substantially maintained" under S.29(b)',
        holding: 'Financial dependency must be regular and substantial, not occasional',
      });
    }

    return legalAnalysis;
  }

  private calculateDistribution(report: any, estateValue: number): any {
    const distribution = {
      estateValue,
      totalDependencyValue: 0,
      dependantShares: [] as any[],
      availableForDistribution: estateValue,
    };

    // Calculate shares based on dependency percentages
    for (const dependant of report.dependants) {
      const share = (estateValue * dependant.dependencyPercentage) / 100;
      distribution.totalDependencyValue += share;

      distribution.dependantShares.push({
        dependantId: dependant.dependantId,
        dependencyPercentage: dependant.dependencyPercentage,
        shareAmount: share,
        isPriority: ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(dependant.dependencyBasis),
      });
    }

    distribution.availableForDistribution = estateValue - distribution.totalDependencyValue;

    return distribution;
  }

  private validateAgainstEstate(report: any, estateValue: number): any {
    const totalRequired = report.dependants.reduce((sum: number, dep: any) => {
      return sum + (estateValue * dep.dependencyPercentage) / 100;
    }, 0);

    const isSufficient = totalRequired <= estateValue;
    const shortfall = isSufficient ? 0 : totalRequired - estateValue;

    return {
      estateValue,
      totalRequired,
      isSufficient,
      shortfall,
      percentageUsed: (totalRequired / estateValue) * 100,
      recommendation: isSufficient
        ? 'Estate is sufficient for all dependants'
        : `Estate insufficient by ${shortfall.toLocaleString()} KES. Consider reducing shares or seeking additional funds.`,
    };
  }

  private formatReport(report: any, format: string): any {
    switch (format) {
      case 'SUMMARY':
        return {
          deceasedId: report.deceasedId,
          overallCompliance: report.summary.overallCompliance,
          compliantDependants: report.summary.compliantDependants,
          nonCompliantDependants: report.summary.nonCompliantDependants,
          requiresAttention: report.summary.requiresAttention,
          checkDate: report.checkDate,
        };

      case 'EXECUTIVE':
        return {
          executiveSummary: `S.29 Compliance Report for deceased ${report.deceasedId}`,
          status: report.summary.overallCompliance,
          keyFindings: report.summary,
          criticalIssues: report.issues.filter((i: any) => i.severity === 'HIGH'),
          recommendations: report.recommendations,
          preparedFor: 'Estate Executor/Family',
          preparedDate: report.checkDate,
        };

      case 'LEGAL':
        return {
          legalOpinion: `LEGAL OPINION ON S.29 COMPLIANCE`,
          matter: `Estate of deceased ${report.deceasedId}`,
          opinionDate: report.checkDate,
          jurisdiction: report.jurisdiction,
          analysis: report.legalAnalysis,
          findings: report.summary,
          detailedAnalysis: report.dependants,
          issues: report.issues,
          recommendations: report.recommendations,
          disclaimer:
            'This is a preliminary analysis. Consult with a qualified legal practitioner.',
        };

      default: // DETAILED
        return report;
    }
  }

  protected checkQueryPermissions(
    metadata: { userId: string; userRole: string },
    query: CheckS29ComplianceQuery,
  ): { hasPermission: boolean; reason?: string } {
    const baseCheck = super.checkQueryPermissions(metadata, query);
    if (!baseCheck.hasPermission) {
      return baseCheck;
    }

    // Legal compliance checks may require legal expertise
    const legalRoles = ['LAWYER', 'JUDGE', 'REGISTRAR', 'LEGAL_OFFICER'];
    const adminRoles = ['ADMIN', 'SUPERVISOR'];

    if (query.checkLevel === 'LEGAL' && !legalRoles.includes(metadata.userRole)) {
      return {
        hasPermission: false,
        reason: 'Legal compliance checks require legal expertise',
      };
    }

    if (!legalRoles.includes(metadata.userRole) && !adminRoles.includes(metadata.userRole)) {
      return {
        hasPermission: false,
        reason: 'User role not authorized for compliance checks',
      };
    }

    return { hasPermission: true };
  }
}
