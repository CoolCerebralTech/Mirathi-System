import { Injectable } from '@nestjs/common';
import { BeneficiaryAssignment } from '../entities/beneficiary.entity';
import { BequestType } from '@prisma/client';

// Interface for the "Person" input to avoid tight coupling to the Family Entity
export interface PotentialDependant {
  id: string;
  fullName: string;
  relationshipToTestator: string; // CODE from RELATIONSHIP_TYPES
  isMinor: boolean;
  isIncapacitated?: boolean;
  wasMaintainedByTestator?: boolean; // Critical for Sec 29(2)
}

export interface ProvisionResult {
  isSafe: boolean; // Is the risk of contestation low?
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  issues: string[];
  suggestions: string[];
}

export interface DistributionValidationResult {
  isValid: boolean;
  warnings: string[];
  totalDependantProvision: number;
  percentageToDependants: number;
}

@Injectable()
export class DependantsProvisionPolicy {
  /**
   * Analyzes the Will's distribution against Kenyan Section 26 (Reasonable Provision).
   *
   * @param dependants List of all known family members eligible as dependants
   * @param assignments List of actual assignments made in the Will
   * @param totalEstateValue Estimated total value (optional, for % calculation)
   */
  validateProvision(
    dependants: PotentialDependant[],
    assignments: BeneficiaryAssignment[],
    totalEstateValue: number = 0,
  ): ProvisionResult {
    const result: ProvisionResult = {
      isSafe: true,
      riskLevel: 'LOW',
      issues: [],
      suggestions: [],
    };

    let highRiskCount = 0;
    let mediumRiskCount = 0;

    // 1. Identify and Iterate through all Legal Dependants
    for (const dependant of dependants) {
      // Skip if not a Section 29 Dependant
      if (!this.isSection29Dependant(dependant)) {
        continue;
      }

      // Check if they are assigned anything
      const dependantAssignments = this.findAssignmentsForDependant(dependant, assignments);

      if (dependantAssignments.length === 0) {
        // --- SCENARIO A: TOTAL EXCLUSION (High Risk) ---
        highRiskCount++;
        this.addExclusionWarning(result, dependant);
      } else {
        // --- SCENARIO B: POTENTIAL UNDER-PROVISION ---
        const provisionAdequacy = this.assessAdequacy(
          dependant,
          dependantAssignments,
          totalEstateValue,
        );

        if (provisionAdequacy === 'INADEQUATE') {
          mediumRiskCount++;
          result.issues.push(
            `Provision for ${dependant.fullName} (${dependant.relationshipToTestator}) may be considered inadequate by court standards.`,
          );
        }
      }
    }

    // 2. Aggregate Risk Level
    if (highRiskCount > 0) {
      result.isSafe = false;
      result.riskLevel = 'HIGH';
      result.issues.unshift(
        'CRITICAL: One or more primary dependants have been completely excluded. This creates a very high probability of the Will being contested under Section 26.',
      );
    } else if (mediumRiskCount > 0) {
      result.isSafe = false;
      result.riskLevel = 'MEDIUM';
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Determines if a person qualifies as a Dependant under Section 29 Law of Succession Act
   */
  private isSection29Dependant(person: PotentialDependant): boolean {
    // 1. Primary Dependants (Spouse & Children) - ALWAYS Dependants
    if (
      ['SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'CHILD_OUT_OF_WEDLOCK'].includes(
        person.relationshipToTestator,
      )
    ) {
      return true;
    }

    // 2. Secondary Dependants (Parents, Step-children, Siblings)
    // ONLY if they were being maintained by the deceased
    if (
      ['PARENT', 'STEPCHILD', 'SIBLING', 'HALF_SIBLING'].includes(person.relationshipToTestator)
    ) {
      return person.wasMaintainedByTestator === true;
    }

    return false;
  }

  private findAssignmentsForDependant(
    person: PotentialDependant,
    assignments: BeneficiaryAssignment[],
  ): BeneficiaryAssignment[] {
    return assignments.filter((assignment) => {
      const identity = assignment.getIdentity();
      // Match by Family ID or exact name match (fallback)
      return (
        identity.familyMemberId === person.id ||
        (identity.externalName &&
          identity.externalName.toLowerCase() === person.fullName.toLowerCase())
      );
    });
  }

  private addExclusionWarning(result: ProvisionResult, person: PotentialDependant): void {
    const baseMsg = `Dependant ${person.fullName} (${person.relationshipToTestator}) is excluded.`;

    if (person.isMinor) {
      result.issues.push(`${baseMsg} MINOR children must be provided for.`);
      result.suggestions.push(`Consider setting up a Testamentary Trust for ${person.fullName}.`);
    } else if (person.relationshipToTestator === 'SPOUSE') {
      result.issues.push(`${baseMsg} Spouses have a strong claim to life interest.`);
    } else {
      result.issues.push(baseMsg);
      result.suggestions.push(
        'If excluding deliberately, ensure a Disinheritance Reason is formally recorded.',
      );
    }
  }

  private assessAdequacy(
    person: PotentialDependant,
    assignments: BeneficiaryAssignment[],
    totalEstateValue: number,
  ): 'ADEQUATE' | 'INADEQUATE' | 'UNKNOWN' {
    // If we don't know estate value, we can't calculate percentages precisely
    if (totalEstateValue <= 0) return 'UNKNOWN';

    let totalAssignedValue = 0;

    for (const assignment of assignments) {
      // 1. Check Percentage - CORRECTED METHOD NAME: getSharePercentage (not getSharePercent)
      const percentage = assignment.getSharePercentage();
      if (percentage) {
        totalAssignedValue += totalEstateValue * (percentage.getValue() / 100);
      }

      // 2. Check Specific Amount
      const specificAmount = assignment.getSpecificAmount();
      if (specificAmount) {
        // Simple currency check - assuming base currency for now
        totalAssignedValue += specificAmount.getAmount();
      }

      // 3. Residuary
      if (assignment.getBequestType() === BequestType.RESIDUARY) {
        // Residuary is usually considered adequate provision
        return 'ADEQUATE';
      }
    }

    // Calculate Share %
    const sharePercentage = (totalAssignedValue / totalEstateValue) * 100;

    // Business Rule: Is this share suspiciously low? (e.g., < 5%)
    // This is a heuristic, not strict law, but helpful for user guidance.
    if (sharePercentage < 5) {
      return 'INADEQUATE';
    }

    return 'ADEQUATE';
  }

  // Additional helper methods for enhanced analysis

  /**
   * Gets detailed breakdown of provision for a specific dependant
   */
  getDependantProvisionDetail(
    dependant: PotentialDependant,
    assignments: BeneficiaryAssignment[],
    totalEstateValue: number,
  ): {
    totalAssignedValue: number;
    percentageOfEstate: number;
    assignments: BeneficiaryAssignment[];
    adequacy: 'ADEQUATE' | 'INADEQUATE' | 'UNKNOWN';
  } {
    const dependantAssignments = this.findAssignmentsForDependant(dependant, assignments);
    let totalAssignedValue = 0;

    for (const assignment of dependantAssignments) {
      const percentage = assignment.getSharePercentage();
      if (percentage) {
        totalAssignedValue += totalEstateValue * (percentage.getValue() / 100);
      }

      const specificAmount = assignment.getSpecificAmount();
      if (specificAmount) {
        totalAssignedValue += specificAmount.getAmount();
      }
    }

    const percentageOfEstate =
      totalEstateValue > 0 ? (totalAssignedValue / totalEstateValue) * 100 : 0;
    const adequacy = this.assessAdequacy(dependant, dependantAssignments, totalEstateValue);

    return {
      totalAssignedValue,
      percentageOfEstate,
      assignments: dependantAssignments,
      adequacy,
    };
  }

  /**
   * Gets recommendations for improving provision adequacy
   */
  getProvisionRecommendations(dependant: PotentialDependant, currentPercentage: number): string[] {
    const recommendations: string[] = [];

    if (dependant.isMinor) {
      recommendations.push(
        `Consider setting up a testamentary trust for ${dependant.fullName} to manage their inheritance until they reach majority age.`,
      );
    }

    if (dependant.relationshipToTestator === 'SPOUSE') {
      if (currentPercentage < 30) {
        recommendations.push(
          `Consider increasing the spouse's share to at least 30% of the estate to reduce contestation risk.`,
        );
      }
      recommendations.push(`Consider granting the spouse a life interest in the matrimonial home.`);
    } else if (dependant.relationshipToTestator === 'CHILD') {
      if (currentPercentage < 10) {
        recommendations.push(
          `Consider allocating at least 10% of the estate to ${dependant.fullName} to meet reasonable provision standards.`,
        );
      }
    }

    if (dependant.isIncapacitated) {
      recommendations.push(
        `Establish a special needs trust for ${dependant.fullName} to preserve their eligibility for government benefits.`,
      );
    }

    return recommendations;
  }

  /**
   * Validates if the overall estate distribution follows Kenyan succession principles
   */
  validateOverallDistribution(
    dependants: PotentialDependant[],
    assignments: BeneficiaryAssignment[],
    totalEstateValue: number,
  ): DistributionValidationResult {
    const result: DistributionValidationResult = {
      isValid: true,
      warnings: [],
      totalDependantProvision: 0,
      percentageToDependants: 0,
    };

    // Calculate total provision to all dependants
    let totalDependantValue = 0;
    const legalDependants = dependants.filter((d) => this.isSection29Dependant(d));

    for (const dependant of legalDependants) {
      const provision = this.getDependantProvisionDetail(dependant, assignments, totalEstateValue);
      totalDependantValue += provision.totalAssignedValue;
    }

    result.totalDependantProvision = totalDependantValue;
    result.percentageToDependants =
      totalEstateValue > 0 ? (totalDependantValue / totalEstateValue) * 100 : 0;

    // Check if dependants are receiving reasonable overall provision
    if (legalDependants.length > 0 && result.percentageToDependants < 50) {
      result.warnings.push(
        `Dependants are receiving less than 50% of the estate. Consider increasing dependant provisions to reduce contestation risk.`,
      );
      result.isValid = false;
    }

    // Check for spouse provision specifically
    const spouse = legalDependants.find((d) => d.relationshipToTestator === 'SPOUSE');
    if (spouse) {
      const spouseProvision = this.getDependantProvisionDetail(
        spouse,
        assignments,
        totalEstateValue,
      );
      if (spouseProvision.percentageOfEstate < 20) {
        result.warnings.push(
          `Spouse is receiving less than 20% of the estate. Kenyan courts typically expect spouses to receive significant provision.`,
        );
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Comprehensive analysis combining all validation methods
   */
  comprehensiveAnalysis(
    dependants: PotentialDependant[],
    assignments: BeneficiaryAssignment[],
    totalEstateValue: number,
  ): {
    provisionResult: ProvisionResult;
    distributionResult: DistributionValidationResult;
    dependantDetails: Array<{
      dependant: PotentialDependant;
      provision: ReturnType<typeof this.getDependantProvisionDetail>;
      recommendations: string[];
    }>;
  } {
    const provisionResult = this.validateProvision(dependants, assignments, totalEstateValue);
    const distributionResult = this.validateOverallDistribution(
      dependants,
      assignments,
      totalEstateValue,
    );

    const dependantDetails = dependants
      .filter((d) => this.isSection29Dependant(d))
      .map((dependant) => {
        const provision = this.getDependantProvisionDetail(
          dependant,
          assignments,
          totalEstateValue,
        );
        const recommendations = this.getProvisionRecommendations(
          dependant,
          provision.percentageOfEstate,
        );

        return {
          dependant,
          provision,
          recommendations,
        };
      });

    return {
      provisionResult,
      distributionResult,
      dependantDetails,
    };
  }
}
