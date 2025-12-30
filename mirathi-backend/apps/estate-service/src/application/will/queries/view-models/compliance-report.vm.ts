import { Will } from '../../../../domain/aggregates/will.aggregate';
import { WillStatus } from '../../../../domain/enums/will-status.enum';

/**
 * Compliance Report View Model
 *
 * PURPOSE:
 * Provides a detailed legal health check of the Will.
 * Used by lawyers or the automated "Pre-Probate Check" system.
 */
export class ComplianceReportVm {
  public willId: string;
  public generatedAt: string;
  public overallStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
  public riskScore: number; // 0-100 (100 = Safe)

  // Section-Specific Analysis
  public sectionAnalysis: {
    s5_capacity: LegalSectionResult; // Mental Capacity
    s11_execution: LegalSectionResult; // Witnessing & Formalities
    s26_dependants: LegalSectionResult; // Reasonable Provision
    s83_executors: LegalSectionResult; // Representation
  };

  public violations: ComplianceIssue[];
  public warnings: ComplianceIssue[];
  public recommendations: string[];

  public static fromDomain(will: Will): ComplianceReportVm {
    const vm = new ComplianceReportVm();
    vm.willId = will.id.toString();
    vm.generatedAt = new Date().toISOString();

    const violations: ComplianceIssue[] = [];
    const warnings: ComplianceIssue[] = [];
    const recommendations: string[] = [];

    // =========================================================================
    // 1. ANALYSIS: S.5 (Testamentary Capacity)
    // =========================================================================
    const s5Result: LegalSectionResult = { status: 'PASS', issues: [] };

    if (!will.capacityDeclaration) {
      if (will.status !== WillStatus.DRAFT) {
        s5Result.status = 'FAIL';
        const issue: ComplianceIssue = {
          code: 'S5_MISSING_DECLARATION',
          message: 'Executed will lacks capacity declaration',
          severity: 'CRITICAL',
        };
        s5Result.issues.push(issue);
        violations.push(issue);
      } else {
        recommendations.push('Complete capacity declaration before execution');
      }
    } else {
      const risk = will.capacityDeclaration.getRiskLevel();
      if (risk === 'HIGH') {
        s5Result.status = 'WARN';
        const issue: ComplianceIssue = {
          code: 'S5_HIGH_RISK_CAPACITY',
          message: 'Capacity declaration indicates high risk of challenge',
          severity: 'HIGH',
        };
        s5Result.issues.push(issue);
        warnings.push(issue);
        recommendations.push(...will.capacityDeclaration.getRecommendedActions());
      }
    }

    // =========================================================================
    // 2. ANALYSIS: S.11 (Execution & Witnessing)
    // =========================================================================
    const s11Result: LegalSectionResult = { status: 'PASS', issues: [] };

    const validWitnesses = will.witnesses.filter(
      (w) => w.status === 'SIGNED' || w.status === 'VERIFIED',
    );
    if (will.status === WillStatus.WITNESSED || will.status === WillStatus.ACTIVE) {
      if (validWitnesses.length < 2) {
        s11Result.status = 'FAIL';
        const issue: ComplianceIssue = {
          code: 'S11_INSUFFICIENT_WITNESSES',
          message: 'Fewer than 2 valid witnesses present',
          severity: 'CRITICAL',
        };
        s11Result.issues.push(issue);
        violations.push(issue);
      }
    } else if (will.status === WillStatus.DRAFT && will.witnesses.length < 2) {
      recommendations.push('Nominate at least 2 witnesses prior to execution');
    }

    // Check Beneficiary Witnesses (S.11(2))
    const witnessErrors = will.validationErrors.filter(
      (e) => e.includes('Witness') && e.includes('beneficiary'),
    );
    if (witnessErrors.length > 0) {
      s11Result.status = 'FAIL';
      witnessErrors.forEach((err) => {
        const issue: ComplianceIssue = {
          code: 'S11_CONFLICT_OF_INTEREST',
          message: err,
          severity: 'CRITICAL',
        };
        s11Result.issues.push(issue);
        violations.push(issue);
      });
    }

    // =========================================================================
    // 3. ANALYSIS: S.26 (Dependants & Disinheritance)
    // =========================================================================
    const s26Result: LegalSectionResult = { status: 'PASS', issues: [] };

    will.disinheritanceRecords.forEach((record) => {
      const assessment = record.getLegalAssessment();

      if (assessment.strength === 'WEAK') {
        s26Result.status = 'WARN';
        const issue: ComplianceIssue = {
          code: 'S26_WEAK_DISINHERITANCE',
          message: `Weak grounds for disinheriting ${record.disinheritedPerson.getDisplayName()}`,
          severity: 'HIGH',
        };
        s26Result.issues.push(issue);
        warnings.push(issue);
        recommendations.push(...assessment.recommendations);
      }
    });

    will.bequests.forEach((bequest) => {
      const risk = bequest.getRiskAssessment();
      if (risk.riskLevel === 'HIGH') {
        const issue: ComplianceIssue = {
          code: 'BEQUEST_RISK',
          message: `High risk bequest to ${bequest.beneficiary.getDisplayName()}: ${risk.reasons.join(', ')}`,
          severity: 'MEDIUM',
        };
        warnings.push(issue);
      }
    });

    // =========================================================================
    // 4. ANALYSIS: S.83 (Executors)
    // =========================================================================
    const s83Result: LegalSectionResult = { status: 'PASS', issues: [] };

    if (will.executors.length === 0) {
      if (will.status !== WillStatus.DRAFT) {
        s83Result.status = 'WARN';
        const issue: ComplianceIssue = {
          code: 'S83_NO_EXECUTOR',
          message: 'No executor appointed. Court will appoint Administrator.',
          severity: 'MEDIUM',
        };
        s83Result.issues.push(issue);
        warnings.push(issue);
      }
      recommendations.push('Appoint at least one executor to avoid administrative delays');
    }

    will.executors.forEach((ex) => {
      const assessment = ex.getLegalAssessment();
      if (assessment.status === 'INVALID') {
        s83Result.status = 'FAIL';
        assessment.reasons.forEach((r) => {
          const issue: ComplianceIssue = {
            code: 'S83_INVALID_EXECUTOR',
            message: r,
            severity: 'CRITICAL',
          };
          s83Result.issues.push(issue);
          violations.push(issue);
        });
      } else if (assessment.status === 'WARNING') {
        if (s83Result.status !== 'FAIL') s83Result.status = 'WARN';
        assessment.reasons.forEach((r) => {
          const issue: ComplianceIssue = {
            code: 'S83_EXECUTOR_WARNING',
            message: r,
            severity: 'MEDIUM',
          };
          s83Result.issues.push(issue);
          warnings.push(issue);
        });
        recommendations.push(...assessment.actions);
      }
    });

    // =========================================================================
    // FINAL SCORING
    // =========================================================================

    vm.sectionAnalysis = {
      s5_capacity: s5Result,
      s11_execution: s11Result,
      s26_dependants: s26Result,
      s83_executors: s83Result,
    };

    vm.violations = violations;
    vm.warnings = warnings;
    vm.recommendations = [...new Set(recommendations)];

    if (violations.length > 0) {
      vm.overallStatus = 'NON_COMPLIANT';
      vm.riskScore = 0;
    } else if (warnings.length > 0) {
      vm.overallStatus = 'AT_RISK';
      vm.riskScore = Math.max(0, 100 - warnings.length * 15);
    } else {
      vm.overallStatus = 'COMPLIANT';
      vm.riskScore = 100;
    }

    return vm;
  }
}

export interface LegalSectionResult {
  status: 'PASS' | 'WARN' | 'FAIL';
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  code: string;
  message: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
