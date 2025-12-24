// domain/services/will-validation.service.ts
import { Will } from '../aggregates/will.aggregate';

/**
 * Will Validation Service
 *
 * Purpose:
 * - Comprehensive will validation before witnessing/activation
 * - Cross-entity business rule enforcement
 * - Kenyan Law of Succession Act compliance checks
 * - Pre-court filing validation
 *
 * This is a DOMAIN SERVICE (not Application Service)
 * - Pure business logic, no infrastructure dependencies
 * - Operates on domain objects only
 * - Stateless (no internal state)
 * - Reusable across use cases
 *
 * Kenyan Legal Context:
 * - Section 9 LSA: Testamentary capacity
 * - Section 11 LSA: Witnessing requirements
 * - Section 26 LSA: Dependant provision
 * - Section 83 LSA: Executor duties
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100, readiness score
  recommendations: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  field?: string;
  legalReference?: string;
  context?: Record<string, any>;
}

export interface ValidationWarning {
  code: string;
  message: string;
  recommendation: string;
  impact?: string;
}

/**
 * WillValidationService
 *
 * Domain service for comprehensive will validation
 */
export class WillValidationService {
  /**
   * Validate will for witnessing
   *
   * Checks:
   * - Testamentary capacity
   * - Executor nomination
   * - Beneficiary assignments
   * - Residuary provision
   * - Percentage allocations
   */
  public validateForWitnessing(will: Will): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const recommendations: string[] = [];

    // 1. Testamentary Capacity (Section 9 LSA)
    this.validateTestamentaryCapacity(will, errors);

    // 2. Executor Requirements
    this.validateExecutors(will, errors, warnings);

    // 3. Beneficiary Requirements
    this.validateBeneficiaries(will, errors, warnings);

    // 4. Residuary Provision
    this.validateResiduaryProvision(will, errors, warnings);

    // 5. Mathematical Consistency
    this.validateMathematicalConsistency(will, errors);

    // 6. Disinheritance Vulnerability
    this.validateDisinheritanceRecords(will, warnings);

    // Generate recommendations
    this.generateRecommendations(will, warnings, recommendations);

    // Calculate readiness score
    const score = this.calculateReadinessScore(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      recommendations,
    };
  }

  /**
   * Validate will for activation (becoming current will)
   *
   * More stringent than witnessing validation
   */
  public validateForActivation(will: Will): ValidationResult {
    const result = this.validateForWitnessing(will);

    // Additional checks for activation
    const additionalErrors: ValidationError[] = [];
    const additionalWarnings: ValidationWarning[] = [];

    // 1. Must be witnessed (Section 11 LSA)
    if (!will.status.isWitnessed()) {
      additionalErrors.push({
        code: 'NOT_WITNESSED',
        message: 'Will must be WITNESSED before activation (Section 11 LSA)',
        severity: 'CRITICAL',
        legalReference: 'Section 11 LSA',
      });
    }

    // 2. Witness signatures must be verified
    const witnesses = will.witnesses;
    const unverifiedWitnesses = witnesses.filter((w) => !w.isVerified());
    if (unverifiedWitnesses.length > 0) {
      additionalErrors.push({
        code: 'UNVERIFIED_WITNESSES',
        message: `${unverifiedWitnesses.length} witness(es) not verified`,
        severity: 'HIGH',
        context: {
          unverifiedCount: unverifiedWitnesses.length,
          unverifiedNames: unverifiedWitnesses.map((w) => w.fullName),
        },
      });
    }

    // 3. At least one executor must have accepted
    const executors = will.executors;
    const acceptedExecutors = executors.filter((e) => e.hasAccepted());
    if (acceptedExecutors.length === 0) {
      additionalWarnings.push({
        code: 'NO_ACCEPTED_EXECUTORS',
        message: 'No executor has accepted their nomination',
        recommendation: 'At least one executor should confirm acceptance before activation',
        impact: 'May delay probate process',
      });
    }

    // Merge results
    result.errors.push(...additionalErrors);
    result.warnings.push(...additionalWarnings);
    result.isValid = result.isValid && additionalErrors.length === 0;
    result.score = this.calculateReadinessScore(result.errors, result.warnings);

    return result;
  }

  /**
   * Validate will for court filing (probate readiness)
   *
   * Most stringent validation
   */
  public validateForProbate(will: Will): ValidationResult {
    const result = this.validateForActivation(will);

    // Additional checks for probate
    const additionalErrors: ValidationError[] = [];
    const additionalWarnings: ValidationWarning[] = [];

    // 1. Will must be executed (testator deceased)
    if (!will.isExecuted()) {
      additionalErrors.push({
        code: 'NOT_EXECUTED',
        message: 'Will must be executed (testator deceased) before probate',
        severity: 'CRITICAL',
      });
    }

    // 2. Primary executor must be available
    const primaryExecutor = will.getPrimaryExecutor();
    if (!primaryExecutor) {
      additionalErrors.push({
        code: 'NO_PRIMARY_EXECUTOR',
        message: 'Primary executor is required for probate application',
        severity: 'CRITICAL',
        context: {
          alternatesAvailable: will.getAlternateExecutors().length,
        },
      });
    }

    // 3. Check for potential Section 26 challenges
    const vulnerableDisinheritance = will.disinheritanceRecords.filter(
      (d) => d.isActive() && d.isVulnerableToChallenge,
    );

    if (vulnerableDisinheritance.length > 0) {
      additionalWarnings.push({
        code: 'VULNERABLE_DISINHERITANCE',
        message: `${vulnerableDisinheritance.length} disinheritance(s) vulnerable to Section 26 challenge`,
        recommendation: 'Strengthen evidence and reasoning for disinheritance',
        impact: 'May face dependant claims in court',
      });
    }

    // 4. Document completeness
    if (!will.props.originalDocumentId) {
      additionalWarnings.push({
        code: 'NO_DOCUMENT_LINK',
        message: 'No original will document linked',
        recommendation: 'Upload original will document for court submission',
        impact: 'Required for probate application',
      });
    }

    result.errors.push(...additionalErrors);
    result.warnings.push(...additionalWarnings);
    result.isValid = result.isValid && additionalErrors.length === 0;
    result.score = this.calculateReadinessScore(result.errors, result.warnings);

    return result;
  }

  // =========================================================================
  // PRIVATE VALIDATION METHODS
  // =========================================================================

  private validateTestamentaryCapacity(will: Will, errors: ValidationError[]): void {
    if (!will.hasTestamentaryCapacity) {
      errors.push({
        code: 'LACKS_TESTAMENTARY_CAPACITY',
        message: 'Testator lacks testamentary capacity (Section 9 LSA)',
        severity: 'CRITICAL',
        legalReference: 'Section 9 LSA',
        context: {
          assessmentDate: will.props.capacityAssessmentDate,
          assessedBy: will.props.capacityAssessedBy,
        },
      });
    }
  }

  private validateExecutors(
    will: Will,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const executors = will.executors;

    // Must have at least one executor
    if (executors.length === 0) {
      errors.push({
        code: 'NO_EXECUTOR_NOMINATED',
        message: 'At least one executor must be nominated',
        severity: 'HIGH',
        field: 'executors',
      });
      return;
    }

    // Must have at least one eligible executor
    const eligibleExecutors = executors.filter((e) => e.canServe());
    if (eligibleExecutors.length === 0) {
      errors.push({
        code: 'NO_ELIGIBLE_EXECUTOR',
        message: 'No eligible executor available',
        severity: 'CRITICAL',
        field: 'executors',
        context: {
          totalNominated: executors.length,
          eligibleCount: 0,
        },
      });
    }

    // Warn if no primary executor
    const primaryExecutor = will.getPrimaryExecutor();
    if (!primaryExecutor && eligibleExecutors.length > 0) {
      warnings.push({
        code: 'NO_PRIMARY_EXECUTOR',
        message: 'No primary executor designated',
        recommendation: 'Designate one executor as primary',
        impact: 'May cause confusion during probate',
      });
    }

    // Warn if no alternate executors
    const alternates = will.getAlternateExecutors();
    if (alternates.length === 0) {
      warnings.push({
        code: 'NO_ALTERNATE_EXECUTORS',
        message: 'No alternate executors nominated',
        recommendation: 'Consider nominating alternate executor(s)',
        impact: 'If primary cannot serve, court will appoint administrator',
      });
    }

    // Validate each executor
    executors.forEach((executor) => {
      const validation = executor.validate();
      if (!validation.valid) {
        validation.errors.forEach((err) => {
          errors.push({
            code: 'EXECUTOR_VALIDATION_FAILED',
            message: err,
            severity: 'MEDIUM',
            field: `executor_${executor.id.toString()}`,
            context: {
              executorName: executor.fullName,
              executorId: executor.id.toString(),
            },
          });
        });
      }
    });
  }

  private validateBeneficiaries(
    will: Will,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const beneficiaries = will.getActiveBeneficiaries();

    // Must have at least one beneficiary
    if (beneficiaries.length === 0) {
      errors.push({
        code: 'NO_BENEFICIARIES',
        message: 'At least one beneficiary must be assigned',
        severity: 'CRITICAL',
        field: 'beneficiaries',
      });
      return;
    }

    // Validate each beneficiary
    beneficiaries.forEach((beneficiary) => {
      const validation = beneficiary.validate();
      if (!validation.valid) {
        validation.errors.forEach((err) => {
          errors.push({
            code: 'BENEFICIARY_VALIDATION_FAILED',
            message: err,
            severity: 'MEDIUM',
            field: `beneficiary_${beneficiary.id.toString()}`,
            context: {
              beneficiaryName: beneficiary.getBeneficiaryName(),
              beneficiaryId: beneficiary.id.toString(),
            },
          });
        });
      }
    });

    // Check for conditional bequests with unclear conditions
    const conditionalBequests = beneficiaries.filter((b) => b.isConditional());
    conditionalBequests.forEach((bequest) => {
      const condition = bequest.condition;
      const validity = condition.isLegallyValid();
      if (!validity.valid) {
        warnings.push({
          code: 'QUESTIONABLE_CONDITION',
          message: `Condition on bequest to ${bequest.getBeneficiaryName()}: ${validity.reason}`,
          recommendation: 'Review condition for legal compliance',
          impact: 'May be challenged as unconstitutional',
        });
      }
    });
  }

  private validateResiduaryProvision(
    will: Will,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const hasResiduary = will.hasResiduary();

    if (!hasResiduary) {
      warnings.push({
        code: 'NO_RESIDUARY_PROVISION',
        message: 'No residuary clause or residuary beneficiary',
        recommendation: 'Add residuary clause to prevent partial intestacy',
        impact: 'Unmentioned assets will be distributed under intestacy rules',
      });
    }

    // Check residuary percentages
    const residuaryBeneficiaries = will.getActiveBeneficiaries().filter((b) => b.isResiduary());

    if (residuaryBeneficiaries.length > 1) {
      const totalResiduaryPercentage = residuaryBeneficiaries.reduce(
        (sum, b) => sum + (b.getSharePercentage() ?? 0),
        0,
      );

      if (Math.abs(totalResiduaryPercentage - 100) > 0.01) {
        errors.push({
          code: 'RESIDUARY_PERCENTAGE_MISMATCH',
          message: `Residuary beneficiary percentages total ${totalResiduaryPercentage}% (must be 100%)`,
          severity: 'HIGH',
          field: 'beneficiaries',
          context: {
            totalPercentage: totalResiduaryPercentage,
            expectedTotal: 100,
          },
        });
      }
    }
  }

  private validateMathematicalConsistency(will: Will, errors: ValidationError[]): void {
    const beneficiaries = will.getActiveBeneficiaries();

    // Calculate total percentage allocation (excluding residuary)
    const percentageBeneficiaries = beneficiaries.filter(
      (b) => b.share.isPercentage() && !b.isResiduary(),
    );

    const totalPercentage = percentageBeneficiaries.reduce(
      (sum, b) => sum + (b.getSharePercentage() ?? 0),
      0,
    );

    if (totalPercentage > 100) {
      errors.push({
        code: 'PERCENTAGE_EXCEEDS_100',
        message: `Total percentage allocation is ${totalPercentage}% (max 100%)`,
        severity: 'CRITICAL',
        field: 'beneficiaries',
        context: {
          totalPercentage,
          maxAllowed: 100,
          excess: totalPercentage - 100,
        },
      });
    }

    // Check for duplicate specific asset assignments
    const specificAssets = beneficiaries
      .filter((b) => b.isSpecificAsset())
      .map((b) => b.getAssetId())
      .filter((id): id is string => !!id);

    const duplicateAssets = specificAssets.filter(
      (id, index) => specificAssets.indexOf(id) !== index,
    );

    if (duplicateAssets.length > 0) {
      duplicateAssets.forEach((assetId) => {
        errors.push({
          code: 'DUPLICATE_ASSET_ASSIGNMENT',
          message: `Asset ${assetId} is assigned to multiple beneficiaries`,
          severity: 'HIGH',
          field: 'beneficiaries',
          context: { assetId },
        });
      });
    }
  }

  private validateDisinheritanceRecords(will: Will, warnings: ValidationWarning[]): void {
    const activeDisinheritance = will.disinheritanceRecords.filter((d) => d.isActive());

    activeDisinheritance.forEach((record) => {
      const validation = record.validate();

      // Add validation errors as warnings (not critical for witnessing)
      validation.errors.forEach((err) => {
        warnings.push({
          code: 'DISINHERITANCE_ISSUE',
          message: `Disinheritance of ${record.disinheritedName}: ${err}`,
          recommendation: 'Provide more detailed justification',
          impact: 'Vulnerable to Section 26 challenge',
        });
      });

      // Add validation warnings
      validation.warnings.forEach((warn) => {
        warnings.push({
          code: 'DISINHERITANCE_WARNING',
          message: warn,
          recommendation: 'Consider strengthening disinheritance defense',
          impact: 'May face dependant claim',
        });
      });

      // Check legal strength
      const strength = record.getLegalStrength();
      if (strength.rating === 'WEAK') {
        warnings.push({
          code: 'WEAK_DISINHERITANCE',
          message: `Disinheritance of ${record.disinheritedName} has weak legal defense (score: ${strength.score}/100)`,
          recommendation: strength.recommendations.join('; '),
          impact: 'High risk of Section 26 challenge',
        });
      }
    });
  }

  private generateRecommendations(
    will: Will,
    warnings: ValidationWarning[],
    recommendations: string[],
  ): void {
    // Generate actionable recommendations based on warnings
    const warningCodes = new Set(warnings.map((w) => w.code));

    if (warningCodes.has('NO_ALTERNATE_EXECUTORS')) {
      recommendations.push('Nominate at least one alternate executor');
    }

    if (warningCodes.has('NO_RESIDUARY_PROVISION')) {
      recommendations.push('Add residuary clause: "All remaining property to [beneficiary]"');
    }

    if (warningCodes.has('WEAK_DISINHERITANCE')) {
      recommendations.push('Provide detailed written statement for disinheritance');
      recommendations.push('Gather supporting evidence (letters, photos, witnesses)');
    }

    if (warningCodes.has('NO_ACCEPTED_EXECUTORS')) {
      recommendations.push('Notify executor(s) and request acceptance');
    }

    // Generic recommendations
    if (recommendations.length === 0) {
      recommendations.push('Will appears complete - proceed with witnessing');
    }
  }

  private calculateReadinessScore(
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): number {
    let score = 100;

    // Deduct for errors
    errors.forEach((error) => {
      switch (error.severity) {
        case 'CRITICAL':
          score -= 25;
          break;
        case 'HIGH':
          score -= 15;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    });

    // Deduct for warnings (less severe)
    warnings.forEach(() => {
      score -= 3;
    });

    return Math.max(0, Math.min(100, score));
  }

  // =========================================================================
  // SECTION 11 LSA SPECIFIC VALIDATION
  // =========================================================================

  /**
   * Validate Section 11 LSA witnessing requirements
   *
   * Requirements:
   * - 2+ witnesses
   * - Witnesses present at same time
   * - Witnesses not beneficiaries
   * - Signatures captured
   */
  public validateSection11Compliance(will: Will): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const witnesses = will.witnesses;

    // 1. Minimum witness count
    const minRequired = will.type.getMinimumWitnessCount();
    if (witnesses.length < minRequired) {
      errors.push({
        code: 'INSUFFICIENT_WITNESSES',
        message: `Section 11 LSA requires ${minRequired} witnesses. Current: ${witnesses.length}`,
        severity: 'CRITICAL',
        legalReference: 'Section 11 LSA',
        context: {
          required: minRequired,
          current: witnesses.length,
        },
      });
    }

    // 2. Witness eligibility
    witnesses.forEach((witness) => {
      const legalCheck = witness.meetsLegalRequirements();
      if (!legalCheck.valid) {
        legalCheck.violations.forEach((violation) => {
          errors.push({
            code: 'WITNESS_LEGAL_VIOLATION',
            message: `Witness ${witness.fullName}: ${violation}`,
            severity: 'CRITICAL',
            legalReference: 'Section 11 LSA',
            field: `witness_${witness.id.toString()}`,
          });
        });
      }
    });

    // 3. Witness simultaneity
    if (witnesses.length >= 2) {
      const simultaneityCheck = will.validateWitnessSimultaneity();
      if (!simultaneityCheck.valid) {
        errors.push({
          code: 'WITNESSES_NOT_SIMULTANEOUS',
          message: simultaneityCheck.reason!,
          severity: 'CRITICAL',
          legalReference: 'Section 11 LSA',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateReadinessScore(errors, warnings),
      recommendations: [],
    };
  }
}
