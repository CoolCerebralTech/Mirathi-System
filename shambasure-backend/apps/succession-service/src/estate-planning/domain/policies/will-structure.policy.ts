import { Injectable } from '@nestjs/common';
import { BequestConditionType, BequestType } from '@prisma/client';

import { BeneficiaryAssignment } from '../entities/beneficiary.entity';
import { Will } from '../entities/will.entity';

export interface StructureResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AssetCoverageResult {
  assetId: string;
  totalPercentage: number;
  hasSpecificAssignments: boolean;
  hasResiduary: boolean;
  isFullyAllocated: boolean;
  beneficiaryCount: number;
}

// Helper interface for local logic
interface LocalBeneficiaryIdentity {
  userId?: string;
  familyMemberId?: string;
  externalName?: string;
}

@Injectable()
export class WillStructurePolicy {
  /**
   * Validates the internal logic of the Will's distribution.
   * Ensures math adds up and catch-all clauses exist.
   */
  validateDistributionStructure(will: Will, assignments: BeneficiaryAssignment[]): StructureResult {
    const result: StructureResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // 1. Validate Residuary Clause (The "Safety Net")
    // A Will should either have a residuary text clause OR a specific residuary beneficiary assignment.
    const hasResiduaryText = !!will.residuaryClause;
    const hasResiduaryBeneficiary = assignments.some(
      (assignment) => assignment.bequestType === BequestType.RESIDUARY,
    );

    if (!hasResiduaryText && !hasResiduaryBeneficiary) {
      result.warnings.push(
        'Missing Residuary Clause: You have not specified what happens to assets not listed in the will (or acquired later). This causes "Partial Intestacy" where the government decides distribution for the remainder.',
      );
    }

    // 2. Validate Share Totals per Asset
    const assetMap = new Map<string, BeneficiaryAssignment[]>();

    assignments.forEach((assignment) => {
      const assetId = assignment.assetId;
      if (!assetMap.has(assetId)) {
        assetMap.set(assetId, []);
      }
      assetMap.get(assetId)?.push(assignment);
    });

    assetMap.forEach((assetAssignments, assetId) => {
      const percentageAssignments = assetAssignments.filter(
        (assignment) => assignment.bequestType === BequestType.PERCENTAGE,
      );

      if (percentageAssignments.length > 0) {
        let totalPercent = 0;
        percentageAssignments.forEach((assignment) => {
          if (assignment.sharePercent !== null) {
            totalPercent += assignment.sharePercent;
          }
        });

        // Allow small float precision error (0.01)
        if (Math.abs(totalPercent - 100) > 0.01) {
          result.errors.push(
            `Asset Distribution Error: The percentage shares for asset ID ${assetId} total ${totalPercent}%, but must equal 100%.`,
          );
          result.isValid = false;
        }
      }
    });

    // 3. Check for Duplicate/Conflicting Assignments
    assetMap.forEach((assetAssignments, assetId) => {
      const specificAssignments = assetAssignments.filter(
        (assignment) =>
          assignment.bequestType === BequestType.SPECIFIC ||
          assignment.bequestType === BequestType.CONDITIONAL,
      );

      if (specificAssignments.length > 1) {
        result.warnings.push(
          `Potential Conflict: Asset ID ${assetId} is assigned as a 'Specific Gift' to ${specificAssignments.length} different beneficiaries. Ensure you intended to share it, otherwise change to 'Percentage' or 'Joint'.`,
        );
      }
    });

    return result;
  }

  /**
   * Comprehensive will structure validation with detailed analysis
   */
  comprehensiveStructureValidation(
    will: Will,
    assignments: BeneficiaryAssignment[],
  ): {
    distribution: StructureResult;
    assetCoverage: AssetCoverageResult[];
    overallValid: boolean;
  } {
    const distributionResult = this.validateDistributionStructure(will, assignments);
    const assetCoverage = this.analyzeAssetCoverage(assignments);

    const overallValid =
      distributionResult.isValid &&
      assetCoverage.every((asset) => asset.isFullyAllocated || asset.hasResiduary);

    return {
      distribution: distributionResult,
      assetCoverage,
      overallValid,
    };
  }

  /**
   * Analyzes how well assets are covered by beneficiary assignments
   */
  private analyzeAssetCoverage(assignments: BeneficiaryAssignment[]): AssetCoverageResult[] {
    const assetMap = new Map<string, AssetCoverageResult>();

    // First pass: collect all assets and their assignments
    assignments.forEach((assignment) => {
      const assetId = assignment.assetId;
      if (!assetMap.has(assetId)) {
        assetMap.set(assetId, {
          assetId,
          totalPercentage: 0,
          hasSpecificAssignments: false,
          hasResiduary: false,
          isFullyAllocated: false,
          beneficiaryCount: 0,
        });
      }

      const coverage = assetMap.get(assetId)!;
      coverage.beneficiaryCount++;

      if (assignment.sharePercent !== null) {
        coverage.totalPercentage += assignment.sharePercent;
      }

      if (assignment.bequestType === BequestType.SPECIFIC) {
        coverage.hasSpecificAssignments = true;
      }

      if (assignment.bequestType === BequestType.RESIDUARY) {
        coverage.hasResiduary = true;
      }
    });

    // Second pass: determine if assets are fully allocated
    assetMap.forEach((coverage) => {
      coverage.isFullyAllocated =
        Math.abs(coverage.totalPercentage - 100) < 0.01 || coverage.hasResiduary;
    });

    return Array.from(assetMap.values());
  }

  /**
   * Validates that conditional bequests have proper alternates
   */
  validateConditionalBequests(assignments: BeneficiaryAssignment[]): StructureResult {
    const result: StructureResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    const conditionalAssignments = assignments.filter(
      (assignment) => assignment.bequestType === BequestType.CONDITIONAL,
    );

    conditionalAssignments.forEach((assignment) => {
      const hasAlternate = !!assignment.alternateAssignmentId;
      const conditionType = assignment.conditionType;
      const conditionDetails = assignment.conditionDetails;

      if (!conditionDetails) {
        result.errors.push(
          `Conditional bequest for beneficiary ${assignment.getBeneficiaryName()} has no condition details.`,
        );
        result.isValid = false;
      }

      if (!hasAlternate) {
        result.warnings.push(
          `Conditional bequest for beneficiary ${assignment.getBeneficiaryName()} has no alternate beneficiary specified. If the condition fails, this gift may fail (Intestacy risk).`,
        );
      }

      // Validate specific condition types
      if (conditionType && conditionType !== BequestConditionType.NONE) {
        const detailsLower = conditionDetails?.toLowerCase() || '';

        if (
          conditionType === BequestConditionType.AGE_REQUIREMENT &&
          !detailsLower.includes('age')
        ) {
          result.warnings.push(
            `Age condition for ${assignment.getBeneficiaryName()} should specify the exact age requirement.`,
          );
        }

        if (
          conditionType === BequestConditionType.EDUCATION &&
          !detailsLower.includes('education')
        ) {
          result.warnings.push(
            `Education condition for ${assignment.getBeneficiaryName()} should specify the educational requirement.`,
          );
        }

        if (conditionType === BequestConditionType.MARRIAGE && !detailsLower.includes('marriage')) {
          result.warnings.push(
            `Marriage condition for ${assignment.getBeneficiaryName()} should specify the marriage requirement.`,
          );
        }

        if (conditionType === BequestConditionType.SURVIVAL && !detailsLower.includes('survive')) {
          result.warnings.push(
            `Survival condition for ${assignment.getBeneficiaryName()} should specify the survival period (e.g. 30 days).`,
          );
        }
      }
    });

    return result;
  }

  /**
   * Checks for potential conflicts in beneficiary assignments
   */
  validateBeneficiaryConflicts(assignments: BeneficiaryAssignment[]): StructureResult {
    const result: StructureResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Helper to get identity from assignment
    const getIdentity = (a: BeneficiaryAssignment): LocalBeneficiaryIdentity => ({
      userId: a.userId || undefined,
      familyMemberId: a.familyMemberId || undefined,
      externalName: a.externalName || undefined,
    });

    const beneficiaryMap = new Map<string, BeneficiaryAssignment[]>();

    assignments.forEach((assignment) => {
      const identity = getIdentity(assignment);
      const key = this.getBeneficiaryKey(identity);

      if (!beneficiaryMap.has(key)) {
        beneficiaryMap.set(key, []);
      }
      beneficiaryMap.get(key)!.push(assignment);
    });

    // Check for multiple assignments to same beneficiary for same asset
    const assetBeneficiaryMap = new Map<string, Set<string>>();

    assignments.forEach((assignment) => {
      const assetId = assignment.assetId;
      const beneficiaryKey = this.getBeneficiaryKey(getIdentity(assignment));

      if (!assetBeneficiaryMap.has(assetId)) {
        assetBeneficiaryMap.set(assetId, new Set());
      }

      const beneficiariesForAsset = assetBeneficiaryMap.get(assetId)!;
      if (beneficiariesForAsset.has(beneficiaryKey)) {
        result.warnings.push(
          `Beneficiary ${assignment.getBeneficiaryName()} has multiple assignments for asset ${assetId}. This may cause conflicts.`,
        );
      } else {
        beneficiariesForAsset.add(beneficiaryKey);
      }
    });

    return result;
  }

  private getBeneficiaryKey(identity: LocalBeneficiaryIdentity): string {
    if (identity.userId) {
      return `USER_${identity.userId}`;
    } else if (identity.familyMemberId) {
      return `FAMILY_${identity.familyMemberId}`;
    } else if (identity.externalName) {
      return `EXTERNAL_${identity.externalName.toLowerCase()}`;
    }
    return 'UNKNOWN';
  }

  /**
   * Comprehensive validation combining all structure checks
   */
  fullStructureValidation(
    will: Will,
    assignments: BeneficiaryAssignment[],
  ): {
    overallValid: boolean;
    distribution: StructureResult;
    conditional: StructureResult;
    conflicts: StructureResult;
    coverage: AssetCoverageResult[];
    recommendations: string[];
  } {
    const comprehensive = this.comprehensiveStructureValidation(will, assignments);
    const conditional = this.validateConditionalBequests(assignments);
    const conflicts = this.validateBeneficiaryConflicts(assignments);

    const overallValid = comprehensive.overallValid && conditional.isValid && conflicts.isValid;

    const recommendations = this.generateRecommendations(comprehensive, conditional, conflicts);

    return {
      overallValid,
      distribution: comprehensive.distribution,
      conditional,
      conflicts,
      coverage: comprehensive.assetCoverage,
      recommendations,
    };
  }

  private generateRecommendations(
    comprehensive: ReturnType<typeof this.comprehensiveStructureValidation>,
    conditional: StructureResult,
    conflicts: StructureResult,
  ): string[] {
    const recommendations: string[] = [];

    if (!comprehensive.overallValid) {
      recommendations.push('Fix asset allocation issues to ensure proper distribution.');
    }

    if (comprehensive.distribution.warnings.some((w) => w.includes('Residuary Clause'))) {
      recommendations.push('Add a residuary clause to handle any unallocated or future assets.');
    }

    if (conditional.warnings.length > 0) {
      recommendations.push(
        'Review conditional bequests and consider adding alternate beneficiaries.',
      );
    }

    if (conflicts.warnings.length > 0) {
      recommendations.push('Resolve potential beneficiary conflicts to avoid distribution issues.');
    }

    const underallocatedAssets = comprehensive.assetCoverage.filter(
      (asset) => !asset.isFullyAllocated && !asset.hasResiduary,
    );

    if (underallocatedAssets.length > 0) {
      recommendations.push(
        `Ensure complete allocation for ${underallocatedAssets.length} asset(s) or add residuary clause.`,
      );
    }

    return recommendations;
  }

  validateExecutorAppointments(hasActiveExecutors: boolean): StructureResult {
    const result: StructureResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!hasActiveExecutors) {
      result.warnings.push(
        'No active executors appointed. Consider appointing at least one executor to administer your estate.',
      );
    }

    return result;
  }

  validateSpecialInstructions(will: Will): StructureResult {
    const result: StructureResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    const funeralWishes = will.funeralWishes;
    const specialInstructions = will.specialInstructions;

    if (!funeralWishes && !specialInstructions) {
      result.warnings.push(
        'Consider adding funeral wishes or special instructions to guide your executors and family.',
      );
    }

    if (funeralWishes) {
      const hasBurialLocation = !!funeralWishes.burialLocation;
      const hasFuneralType = !!funeralWishes.funeralType;
      const hasSpecificInstructions = !!funeralWishes.specificInstructions;

      if (!hasBurialLocation && !hasFuneralType && !hasSpecificInstructions) {
        result.warnings.push(
          'Funeral wishes are provided but lack specific details. Consider adding burial location, funeral type, or specific instructions.',
        );
      }
    }

    return result;
  }
}
