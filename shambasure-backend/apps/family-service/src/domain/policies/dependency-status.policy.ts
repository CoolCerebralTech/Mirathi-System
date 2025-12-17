import { Injectable } from '@nestjs/common';

import { LegalDependant } from '../entities/legal-dependant.entity';

export type DependencyStatus = 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'DISPUTED';

export interface StatusEvaluationResult {
  status: DependencyStatus;
  reasons: string[];
  requiresAttention: boolean;
  nextReviewDate?: Date;
}

@Injectable()
export class DependencyStatusPolicy {
  /**
   * Evaluate overall dependency status for multiple dependants
   */
  evaluateStatus(dependants: LegalDependant[]): StatusEvaluationResult {
    if (dependants.length === 0) {
      return {
        status: 'PENDING',
        reasons: ['No dependants declared'],
        requiresAttention: true,
      };
    }

    const issues: string[] = [];
    let requiresAttention = false;

    // Check for pending claims
    const pendingClaims = dependants.filter((d) => d.s26ClaimStatus === 'PENDING');
    if (pendingClaims.length > 0) {
      issues.push(`${pendingClaims.length} S.26 claims pending`);
      requiresAttention = true;
    }

    // Check for denied claims (disputes)
    const deniedClaims = dependants.filter((d) => d.s26ClaimStatus === 'DENIED');
    if (deniedClaims.length > 0) {
      issues.push(`${deniedClaims.length} S.26 claims denied`);
      requiresAttention = true;
    }

    // Check for unverified evidence
    const unverified = dependants.filter(
      (d) => !d['verifiedByCourtAt'] && !d.isPriorityDependant && d.dependencyPercentage > 0,
    );
    if (unverified.length > 0) {
      issues.push(`${unverified.length} non-priority dependants unverified`);
      requiresAttention = true;
    }

    // Check for missing evidence
    const missingEvidence = dependants.filter(
      (d) =>
        !d.isPriorityDependant &&
        (!d['dependencyProofDocuments'] || d['dependencyProofDocuments'].length === 0) &&
        d.dependencyPercentage > 0,
    );
    if (missingEvidence.length > 0) {
      issues.push(`${missingEvidence.length} non-priority dependants lack evidence`);
      requiresAttention = true;
    }

    // Determine status based on issues
    let status: DependencyStatus = 'COMPLETE';

    if (deniedClaims.length > 0) {
      status = 'DISPUTED';
    } else if (pendingClaims.length > 0 || unverified.length > 0) {
      status = 'IN_PROGRESS';
    } else if (issues.length > 0) {
      status = 'IN_PROGRESS';
    }

    // Calculate next review date if needed
    const nextReviewDate = this.calculateNextReviewDate(dependants);

    return {
      status,
      reasons: issues,
      requiresAttention,
      nextReviewDate,
    };
  }

  /**
   * Evaluate compliance with S.29
   */
  evaluateS29Compliance(dependant: LegalDependant): {
    isCompliant: boolean;
    violations: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    const violations: string[] = [];

    // S.29(a) - Spouse and children are automatic dependants
    if (dependant.isPriorityDependant && dependant.dependencyPercentage < 100) {
      violations.push('Priority dependant (spouse/child) should have 100% dependency');
    }

    // S.29(b) - Others must be substantially maintained
    if (!dependant.isPriorityDependant) {
      if (dependant.dependencyPercentage > 0 && !dependant['dependencyProofDocuments']) {
        violations.push('Non-priority dependant lacks evidence of substantial maintenance');
      }

      if (dependant.dependencyPercentage > 0 && dependant.dependencyPercentage < 25) {
        violations.push('Dependency percentage below threshold for non-priority dependant');
      }
    }

    // S.29(2) - Special provisions for disabled, minors, students
    if (dependant['hasDisability'] && !dependant.requiresOngoingCare) {
      violations.push('Disabled dependant lacks designated ongoing care requirement');
    }

    if (dependant.isMinor && !dependant['custodialParentId']) {
      violations.push('Minor dependant lacks designated custodial parent');
    }

    if (dependant.isStudent && !dependant.isMinor && !dependant['studentUntil']) {
      violations.push('Adult student lacks expected graduation date');
    }

    // Determine severity
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (violations.some((v) => v.includes('Priority dependant') || v.includes('disabled'))) {
      severity = 'HIGH';
    } else if (violations.some((v) => v.includes('evidence') || v.includes('custodial'))) {
      severity = 'MEDIUM';
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      severity,
    };
  }

  /**
   * Evaluate if dependant qualifies for S.26 claim
   */
  qualifiesForS26Claim(dependant: LegalDependant): {
    qualifies: boolean;
    basis: string[];
    restrictions?: string[];
  } {
    const basis: string[] = [];
    const restrictions: string[] = [];

    // S.26 qualification basis
    if (dependant.dependencyBasis === 'EX_SPOUSE') {
      basis.push('Former spouse qualifies under S.26(1)');
    }

    if (dependant.dependencyBasis === 'COHABITOR') {
      basis.push('Cohabiting partner qualifies under S.26(6)');
    }

    if (dependant['hasDisability'] && dependant.requiresOngoingCare) {
      basis.push('Disabled dependant requiring ongoing care qualifies');
    }

    if (dependant.isMinor && !dependant['custodialParentId']) {
      basis.push('Minor without custodial parent may qualify');
    }

    // Restrictions
    if (dependant.hasCourtOrder) {
      restrictions.push('Court order already issued');
    }

    if (dependant.isPriorityDependant && dependant.dependencyPercentage === 100) {
      restrictions.push('Priority dependant already at full dependency');
    }

    return {
      qualifies: basis.length > 0 && restrictions.length === 0,
      basis,
      restrictions: restrictions.length > 0 ? restrictions : undefined,
    };
  }

  private calculateNextReviewDate(dependants: LegalDependant[]): Date | undefined {
    // Find the earliest next review date from dependants
    const reviewDates = dependants
      .map((d) => d['nextReviewDate'])
      .filter((date) => date && date > new Date())
      .sort((a, b) => a.getTime() - b.getTime());

    return reviewDates.length > 0 ? reviewDates[0] : undefined;
  }
}
