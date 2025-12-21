import { Injectable } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { ILegalDependantRepository } from '../../../../domain/interfaces/repositories/ilegal-dependant.repository';
import { Result } from '../../../common/base/result';
import { CheckS29ComplianceQuery } from '../impl/check-s29-compliance.query';
import { BaseQueryHandler } from './base.query-handler';

@Injectable()
@QueryHandler(CheckS29ComplianceQuery)
export class CheckS29ComplianceHandler extends BaseQueryHandler<CheckS29ComplianceQuery, any> {
  constructor(
    private readonly repository: ILegalDependantRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: CheckS29ComplianceQuery): Promise<Result<any>> {
    try {
      // 1. Validate
      const validation = this.validateQuery(query);
      if (validation.isFailure) return Result.fail(validation.error!);

      // 2. Permissions
      const perm = this.checkQueryPermissions(
        { userId: query.userId, userRole: (query as any).userRole },
        query,
      );
      if (!perm.hasPermission) return Result.fail(new Error(perm.reason));

      // 3. Execution with monitoring
      const { result: report } = await this.withPerformanceMonitoring(async () => {
        const dependants = await this.repository.findAllByDeceasedId(query.deceasedId);
        // Ensure synchronous execution or await if needed
        return this.generateComplianceReport(dependants, query);
      }, query);

      this.logSuccess(query, report, 'S.29 Compliance Check');
      return Result.ok(report);
    } catch (error) {
      return this.handleError(error, query, 'CheckS29ComplianceHandler');
    }
  }

  // --- Compliance Logic ---

  private generateComplianceReport(dependants: any[], query: CheckS29ComplianceQuery) {
    const summary = {
      total: dependants.length,
      compliant: 0,
      nonCompliant: 0,
      // Explicitly type as any[] to avoid 'never[]' inference if initialized empty
      issues: [] as any[],
    };

    const details = dependants.map((dep) => {
      const compliance = this.checkDependantCompliance(dep);
      if (compliance.isCompliant) {
        summary.compliant++;
      } else {
        summary.nonCompliant++;
        summary.issues.push({ id: dep.id, issues: compliance.issues });
      }
      return {
        id: dep.id,
        basis: dep.dependencyBasis,
        ...compliance,
      };
    });

    return {
      deceasedId: query.deceasedId,
      timestamp: new Date(),
      summary,
      details,
      jurisdiction: query.jurisdiction,
      recommendations: this.generateRecommendations(summary),
    };
  }

  private checkDependantCompliance(dependant: any) {
    const issues: string[] = [];
    const props = typeof dependant.toJSON === 'function' ? dependant.toJSON() : dependant;

    // S.29(a) Priority Dependants
    if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(props.dependencyBasis)) {
      // Must be FULL level ideally
      if (props.dependencyLevel !== 'FULL') {
        issues.push('Priority dependant not set to FULL dependency.');
      }
    }
    // S.29(b) Conditional Dependants
    else {
      // Must have evidence
      if (
        (!props.dependencyProofDocuments || props.dependencyProofDocuments.length === 0) &&
        props.dependencyPercentage > 0
      ) {
        issues.push('Conditional dependant lacks financial evidence.');
      }
    }

    // Minors
    if (props.isMinor && !props.custodialParentId) {
      issues.push('Minor dependant lacks custodial parent.');
    }

    return {
      isCompliant: issues.length === 0,
      issues,
    };
  }

  private generateRecommendations(summary: any): string[] {
    const recs: string[] = []; // Explicit string[] typing
    if (summary.nonCompliant > 0) {
      recs.push(`Review ${summary.nonCompliant} non-compliant dependants.`);
    }
    if (summary.total === 0) {
      recs.push('No dependants found. Ensure comprehensive search is conducted.');
    }
    return recs;
  }
}
