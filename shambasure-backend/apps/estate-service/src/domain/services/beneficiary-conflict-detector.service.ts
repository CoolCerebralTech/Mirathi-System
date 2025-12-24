// domain/services/beneficiary-conflict-detector.service.ts
import { Will } from '../aggregates/will.aggregate';
import { BeneficiaryAssignment } from '../entities/beneficiary-assignment.entity';

/**
 * Beneficiary Conflict Detector Service
 *
 * Purpose:
 * - Detect conflicts between beneficiary assignments
 * - Identify ambiguous distributions
 * - Find mathematical inconsistencies
 * - Detect potential Section 26 challenges
 * - Validate family fairness
 *
 * Kenyan Legal Context:
 * - Section 26 LSA: Dependants may challenge "unfair" distributions
 * - Section 35 LSA: Intestate spouse/children entitlements
 * - Common disputes: Unequal treatment of children, excluded spouses
 *
 * This is a DOMAIN SERVICE
 * - Pure business logic
 * - No infrastructure dependencies
 * - Stateless
 */

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: BeneficiaryConflict[];
  warnings: BeneficiaryWarning[];
  mathematicalIssues: MathematicalIssue[];
  section26Risks: Section26Risk[];
  recommendations: string[];
  riskScore: number; // 0-100, higher = more risk
}

export interface BeneficiaryConflict {
  type: ConflictType;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedBeneficiaries: string[];
  legalBasis?: string;
  resolution: string;
  example?: string;
}

export enum ConflictType {
  DUPLICATE_ASSET = 'DUPLICATE_ASSET',
  PERCENTAGE_OVERFLOW = 'PERCENTAGE_OVERFLOW',
  AMBIGUOUS_RESIDUARY = 'AMBIGUOUS_RESIDUARY',
  MISSING_RESIDUARY = 'MISSING_RESIDUARY',
  CONFLICTING_CONDITIONS = 'CONFLICTING_CONDITIONS',
  UNEQUAL_CHILDREN = 'UNEQUAL_CHILDREN',
  EXCLUDED_SPOUSE = 'EXCLUDED_SPOUSE',
  EXCLUDED_DEPENDANT = 'EXCLUDED_DEPENDANT',
  CIRCULAR_ALTERNATES = 'CIRCULAR_ALTERNATES',
  IMPOSSIBLE_CONDITION = 'IMPOSSIBLE_CONDITION',
}

export interface BeneficiaryWarning {
  code: string;
  message: string;
  impact: string;
  recommendation: string;
}

export interface MathematicalIssue {
  description: string;
  calculation: string;
  expected: number;
  actual: number;
  difference: number;
}

export interface Section26Risk {
  potentialClaimant: string;
  claimantRelationship: string;
  basisForClaim: string;
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigationSteps: string[];
}

/**
 * BeneficiaryConflictDetector
 *
 * Domain service for detecting and analyzing beneficiary conflicts
 */
export class BeneficiaryConflictDetector {
  /**
   * Detect all conflicts and issues in beneficiary assignments
   */
  public detectConflicts(will: Will): ConflictDetectionResult {
    const conflicts: BeneficiaryConflict[] = [];
    const warnings: BeneficiaryWarning[] = [];
    const mathematicalIssues: MathematicalIssue[] = [];
    const section26Risks: Section26Risk[] = [];
    const recommendations: string[] = [];

    const beneficiaries = will.getActiveBeneficiaries();

    // 1. Detect duplicate asset assignments
    this.detectDuplicateAssets(beneficiaries, conflicts);

    // 2. Check percentage calculations
    this.checkPercentageConsistency(beneficiaries, mathematicalIssues, conflicts);

    // 3. Check residuary provision
    this.checkResiduaryProvision(will, conflicts, warnings);

    // 4. Detect conflicting conditions
    this.detectConflictingConditions(beneficiaries, conflicts, warnings);

    // 5. Check for circular alternate beneficiaries
    this.detectCircularAlternates(beneficiaries, conflicts);

    // 6. Analyze family fairness (Section 26 LSA risk)
    this.analyzeSection26Risks(will, section26Risks, warnings);

    // 7. Check for impossible conditions
    this.detectImpossibleConditions(beneficiaries, conflicts);

    // 8. Generate recommendations
    this.generateRecommendations(conflicts, warnings, section26Risks, recommendations);

    // Calculate risk score
    const riskScore = this.calculateRiskScore(conflicts, warnings, section26Risks);

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      warnings,
      mathematicalIssues,
      section26Risks,
      recommendations,
      riskScore,
    };
  }

  // =========================================================================
  // CONFLICT DETECTION METHODS
  // =========================================================================

  private detectDuplicateAssets(
    beneficiaries: BeneficiaryAssignment[],
    conflicts: BeneficiaryConflict[],
  ): void {
    const specificAssets = beneficiaries.filter((b) => b.isSpecificAsset());
    const assetMap = new Map<string, string[]>();

    specificAssets.forEach((beneficiary) => {
      const assetId = beneficiary.getAssetId();
      if (!assetId) return;

      if (!assetMap.has(assetId)) {
        assetMap.set(assetId, []);
      }
      assetMap.get(assetId)!.push(beneficiary.getBeneficiaryName());
    });

    // Find duplicates
    assetMap.forEach((beneficiaryNames, assetId) => {
      if (beneficiaryNames.length > 1) {
        conflicts.push({
          type: ConflictType.DUPLICATE_ASSET,
          description: `Asset ${assetId} is assigned to ${beneficiaryNames.length} different beneficiaries`,
          severity: 'CRITICAL',
          affectedBeneficiaries: beneficiaryNames,
          resolution:
            'Each asset can only be assigned to one beneficiary. Remove duplicate assignments or use co-ownership percentages.',
          example: `Asset can go to ${beneficiaryNames[0]} OR ${beneficiaryNames[1]}, but not both`,
        });
      }
    });
  }

  private checkPercentageConsistency(
    beneficiaries: BeneficiaryAssignment[],
    mathematicalIssues: MathematicalIssue[],
    conflicts: BeneficiaryConflict[],
  ): void {
    // Calculate total percentage allocation (excluding residuary)
    const percentageBeneficiaries = beneficiaries.filter(
      (b) => b.share.isPercentage() && !b.isResiduary(),
    );

    const totalPercentage = percentageBeneficiaries.reduce(
      (sum, b) => sum + (b.getSharePercentage() ?? 0),
      0,
    );

    if (totalPercentage > 100) {
      const excess = totalPercentage - 100;

      mathematicalIssues.push({
        description: 'Total percentage allocation exceeds 100%',
        calculation: percentageBeneficiaries
          .map((b) => `${b.getBeneficiaryName()}: ${b.getSharePercentage()}%`)
          .join(' + '),
        expected: 100,
        actual: totalPercentage,
        difference: excess,
      });

      conflicts.push({
        type: ConflictType.PERCENTAGE_OVERFLOW,
        description: `Total percentage is ${totalPercentage}% (exceeds 100% by ${excess}%)`,
        severity: 'CRITICAL',
        affectedBeneficiaries: percentageBeneficiaries.map((b) => b.getBeneficiaryName()),
        resolution: `Reduce percentages by total of ${excess}% to reach 100%`,
        example: 'If 3 people each get 40% = 120% total (impossible)',
      });
    }

    // Check residuary percentages
    const residuaryBeneficiaries = beneficiaries.filter((b) => b.isResiduary());
    if (residuaryBeneficiaries.length > 1) {
      const totalResiduary = residuaryBeneficiaries.reduce(
        (sum, b) => sum + (b.getSharePercentage() ?? 100),
        0,
      );

      if (Math.abs(totalResiduary - 100) > 0.01) {
        mathematicalIssues.push({
          description: 'Residuary beneficiary percentages must total 100%',
          calculation: residuaryBeneficiaries
            .map((b) => `${b.getBeneficiaryName()}: ${b.getSharePercentage()}%`)
            .join(' + '),
          expected: 100,
          actual: totalResiduary,
          difference: totalResiduary - 100,
        });

        conflicts.push({
          type: ConflictType.AMBIGUOUS_RESIDUARY,
          description: `Residuary percentages total ${totalResiduary}% (must be 100%)`,
          severity: 'HIGH',
          affectedBeneficiaries: residuaryBeneficiaries.map((b) => b.getBeneficiaryName()),
          resolution: 'Adjust residuary percentages to total exactly 100%',
        });
      }
    }
  }

  private checkResiduaryProvision(
    will: Will,
    conflicts: BeneficiaryConflict[],
    warnings: BeneficiaryWarning[],
  ): void {
    const hasResiduary = will.hasResiduary();

    if (!hasResiduary) {
      conflicts.push({
        type: ConflictType.MISSING_RESIDUARY,
        description: 'No residuary clause or residuary beneficiary',
        severity: 'MEDIUM',
        affectedBeneficiaries: [],
        legalBasis: 'Best practice',
        resolution:
          'Add residuary clause: "All remaining property to [beneficiary]" or add residuary beneficiary',
        example: 'Without residuary, unlisted assets distributed under intestacy',
      });

      warnings.push({
        code: 'NO_RESIDUARY',
        message: 'Partial intestacy will occur for assets not specifically mentioned',
        impact: 'Assets forgotten or acquired after will-making go to intestate heirs',
        recommendation: 'Always include residuary clause to catch all assets',
      });
    }
  }

  private detectConflictingConditions(
    beneficiaries: BeneficiaryAssignment[],
    conflicts: BeneficiaryConflict[],
    warnings: BeneficiaryWarning[],
  ): void {
    // Check for same asset with different conditions to different people
    const assetConditionMap = new Map<string, Array<{ beneficiary: string; condition: string }>>();

    beneficiaries
      .filter((b) => b.isSpecificAsset() && b.isConditional())
      .forEach((beneficiary) => {
        const assetId = beneficiary.getAssetId();
        if (!assetId) return;

        if (!assetConditionMap.has(assetId)) {
          assetConditionMap.set(assetId, []);
        }

        assetConditionMap.get(assetId)!.push({
          beneficiary: beneficiary.getBeneficiaryName(),
          condition: beneficiary.condition.getDescription(),
        });
      });

    // Find conflicting conditions
    assetConditionMap.forEach((conditions, assetId) => {
      if (conditions.length > 1) {
        warnings.push({
          code: 'CONFLICTING_CONDITIONS',
          message: `Asset ${assetId} has multiple conditional assignments with different conditions`,
          impact: 'Unclear which condition takes precedence',
          recommendation: 'Use alternate beneficiary structure instead',
        });
      }
    });
  }

  private detectCircularAlternates(
    beneficiaries: BeneficiaryAssignment[],
    conflicts: BeneficiaryConflict[],
  ): void {
    // Build alternate relationship graph
    const alternateMap = new Map<string, string>();

    beneficiaries.forEach((b) => {
      if (b.hasAlternate) {
        alternateMap.set(b.id.toString(), b.props.alternateAssignmentId!);
      }
    });

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true; // Cycle detected
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const nextNode = alternateMap.get(nodeId);
      if (nextNode && hasCycle(nextNode)) {
        return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // Check each alternate chain
    alternateMap.forEach((_, assignmentId) => {
      if (hasCycle(assignmentId)) {
        const affected = beneficiaries
          .filter((b) => recursionStack.has(b.id.toString()))
          .map((b) => b.getBeneficiaryName());

        conflicts.push({
          type: ConflictType.CIRCULAR_ALTERNATES,
          description: 'Circular reference detected in alternate beneficiaries',
          severity: 'HIGH',
          affectedBeneficiaries: affected,
          resolution: 'Break circular chain by removing one alternate link',
          example: 'A→B→C→A creates infinite loop',
        });
      }
    });
  }

  private detectImpossibleConditions(
    beneficiaries: BeneficiaryAssignment[],
    conflicts: BeneficiaryConflict[],
  ): void {
    beneficiaries
      .filter((b) => b.isConditional())
      .forEach((beneficiary) => {
        const condition = beneficiary.condition;

        // Check age condition feasibility
        if (condition.isAgeCondition()) {
          const requiredAge = condition.getRequiredAge();
          if (requiredAge && requiredAge > 100) {
            conflicts.push({
              type: ConflictType.IMPOSSIBLE_CONDITION,
              description: `Age requirement of ${requiredAge} years is unrealistic for ${beneficiary.getBeneficiaryName()}`,
              severity: 'MEDIUM',
              affectedBeneficiaries: [beneficiary.getBeneficiaryName()],
              resolution: 'Set reasonable age requirement (typically 18-35)',
            });
          }
        }

        // Check survival condition
        if (condition.isSurvivalCondition()) {
          const days = condition.getSurvivalDays();
          if (days && days > 365) {
            conflicts.push({
              type: ConflictType.IMPOSSIBLE_CONDITION,
              description: `Survival period of ${days} days (${Math.floor(days / 365)} years) is unusually long`,
              severity: 'LOW',
              affectedBeneficiaries: [beneficiary.getBeneficiaryName()],
              resolution: 'Survival clauses typically use 30-90 days',
            });
          }
        }
      });
  }

  // =========================================================================
  // SECTION 26 LSA RISK ANALYSIS
  // =========================================================================

  private analyzeSection26Risks(
    will: Will,
    section26Risks: Section26Risk[],
    warnings: BeneficiaryWarning[],
  ): void {
    const beneficiaries = will.getActiveBeneficiaries();
    const disinheritedPersons = will.disinheritanceRecords.filter((d) => d.isActive());

    // Check for excluded spouse
    const hasSpouseBeneficiary = beneficiaries.some((b) =>
      b.props.relationshipToTestator?.toLowerCase().includes('spouse'),
    );

    if (!hasSpouseBeneficiary) {
      section26Risks.push({
        potentialClaimant: 'Spouse (if exists)',
        claimantRelationship: 'SPOUSE',
        basisForClaim:
          'Section 26 LSA: Court may order provision for spouse if will fails to provide',
        likelihood: 'HIGH',
        mitigationSteps: [
          'Include spouse as beneficiary',
          'If divorced, document divorce decree',
          'If excluding spouse, provide strong written justification',
        ],
      });

      warnings.push({
        code: 'NO_SPOUSE_PROVISION',
        message: 'No spouse identified as beneficiary',
        impact: 'Spouse may challenge under Section 26 LSA',
        recommendation: 'Include spouse or document reason for exclusion',
      });
    }

    // Check for unequal treatment of children
    const childBeneficiaries = beneficiaries.filter((b) =>
      ['child', 'son', 'daughter'].some((term) =>
        b.props.relationshipToTestator?.toLowerCase().includes(term),
      ),
    );

    if (childBeneficiaries.length > 1) {
      const shares = childBeneficiaries.map((b) => b.getSharePercentage() ?? 0);
      const maxShare = Math.max(...shares);
      const minShare = Math.min(...shares);
      const difference = maxShare - minShare;

      if (difference > 20) {
        // More than 20% difference
        warnings.push({
          code: 'UNEQUAL_CHILDREN_TREATMENT',
          message: `Children receive unequal shares (difference: ${difference}%)`,
          impact: 'Disadvantaged children may challenge under Section 26 LSA',
          recommendation: 'Document reasons for unequal distribution or equalize shares',
        });

        section26Risks.push({
          potentialClaimant: 'Children with smaller shares',
          claimantRelationship: 'CHILD',
          basisForClaim: 'Section 26 LSA: Unequal treatment of children without justification',
          likelihood: 'MEDIUM',
          mitigationSteps: [
            'Document specific reasons for unequal distribution',
            'Show gifts during lifetime to one child',
            'Explain special needs or circumstances',
          ],
        });
      }
    }

    // Check disinherited persons
    disinheritedPersons.forEach((record) => {
      if (record.isVulnerableToChallenge) {
        const strength = record.getLegalStrength();

        section26Risks.push({
          potentialClaimant: record.disinheritedName,
          claimantRelationship: record.relationshipToTestator,
          basisForClaim: `Section 26 LSA: Dependant provision claim. Disinheritance defense is ${strength.rating}`,
          likelihood: strength.rating === 'WEAK' ? 'HIGH' : 'MEDIUM',
          mitigationSteps: strength.recommendations,
        });
      }
    });
  }

  // =========================================================================
  // RECOMMENDATIONS & SCORING
  // =========================================================================

  private generateRecommendations(
    conflicts: BeneficiaryConflict[],
    warnings: BeneficiaryWarning[],
    section26Risks: Section26Risk[],
    recommendations: string[],
  ): void {
    // Priority 1: Fix critical conflicts
    const criticalConflicts = conflicts.filter((c) => c.severity === 'CRITICAL');
    if (criticalConflicts.length > 0) {
      recommendations.push(
        `FIX CRITICAL: ${criticalConflicts.length} critical conflict(s) must be resolved before witnessing`,
      );
      criticalConflicts.forEach((c) => {
        recommendations.push(`- ${c.resolution}`);
      });
    }

    // Priority 2: Address Section 26 risks
    const highRisks = section26Risks.filter((r) => r.likelihood === 'HIGH');
    if (highRisks.length > 0) {
      recommendations.push(`SECTION 26 RISK: ${highRisks.length} high-risk dependant claim(s)`);
      highRisks.forEach((r) => {
        recommendations.push(`- ${r.potentialClaimant}: ${r.mitigationSteps[0]}`);
      });
    }

    // Priority 3: Mathematical fixes
    if (conflicts.some((c) => c.type === ConflictType.PERCENTAGE_OVERFLOW)) {
      recommendations.push('MATH: Reduce percentage allocations to total ≤100%');
    }

    // Priority 4: Best practices
    if (warnings.some((w) => w.code === 'NO_RESIDUARY')) {
      recommendations.push('BEST PRACTICE: Add residuary clause');
    }

    // If no recommendations, all good!
    if (recommendations.length === 0) {
      recommendations.push('✓ No conflicts detected - beneficiary assignments look good');
    }
  }

  private calculateRiskScore(
    conflicts: BeneficiaryConflict[],
    warnings: BeneficiaryWarning[],
    section26Risks: Section26Risk[],
  ): number {
    let score = 0;

    // Add conflict severity scores
    conflicts.forEach((conflict) => {
      switch (conflict.severity) {
        case 'CRITICAL':
          score += 25;
          break;
        case 'HIGH':
          score += 15;
          break;
        case 'MEDIUM':
          score += 10;
          break;
        case 'LOW':
          score += 5;
          break;
      }
    });

    // Add warning scores
    score += warnings.length * 3;

    // Add Section 26 risk scores
    section26Risks.forEach((risk) => {
      switch (risk.likelihood) {
        case 'HIGH':
          score += 20;
          break;
        case 'MEDIUM':
          score += 10;
          break;
        case 'LOW':
          score += 5;
          break;
      }
    });

    return Math.min(100, score);
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get beneficiary distribution summary
   */
  public getDistributionSummary(will: Will): {
    totalBeneficiaries: number;
    specificAssets: number;
    percentageShares: number;
    residuaryBeneficiaries: number;
    conditionalBequests: number;
    totalPercentageAllocated: number;
  } {
    const beneficiaries = will.getActiveBeneficiaries();

    return {
      totalBeneficiaries: beneficiaries.length,
      specificAssets: beneficiaries.filter((b) => b.isSpecificAsset()).length,
      percentageShares: beneficiaries.filter((b) => b.share.isPercentage() && !b.isResiduary())
        .length,
      residuaryBeneficiaries: beneficiaries.filter((b) => b.isResiduary()).length,
      conditionalBequests: beneficiaries.filter((b) => b.isConditional()).length,
      totalPercentageAllocated: beneficiaries
        .filter((b) => b.share.isPercentage() && !b.isResiduary())
        .reduce((sum, b) => sum + (b.getSharePercentage() ?? 0), 0),
    };
  }
}
