import { Injectable } from '@nestjs/common';
import { BequestType, RelationshipType } from '@prisma/client';

import { BeneficiaryAssignment } from '../entities/beneficiary.entity';

/**
 * Interface representing a potential dependant for analysis.
 * Usually mapped from FamilyMember entity.
 */
export interface PotentialDependant {
  id: string;
  fullName: string;
  relationshipToTestator: string; // Mapped from RelationshipType enum or custom string
  isMinor: boolean;
  isIncapacitated?: boolean;
  wasMaintainedByTestator?: boolean;
}

export interface ProvisionResult {
  isSafe: boolean;
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
   * Validates provision for Section 29 dependants.
   * Checks if all mandatory dependants have been adequately provided for.
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

    for (const dependant of dependants) {
      if (!this.isSection29Dependant(dependant)) continue;

      const dependantAssignments = this.findAssignmentsForDependant(dependant, assignments);

      if (dependantAssignments.length === 0) {
        highRiskCount++;
        this.addExclusionWarning(result, dependant);
      } else if (
        this.assessAdequacy(dependant, dependantAssignments, totalEstateValue) === 'INADEQUATE'
      ) {
        mediumRiskCount++;
        result.issues.push(
          `Provision for ${dependant.fullName} (${dependant.relationshipToTestator}) may be inadequate (<5% of estate).`,
        );
      }
    }

    if (highRiskCount > 0) {
      result.isSafe = false;
      result.riskLevel = 'HIGH';
      result.issues.unshift(
        'CRITICAL: One or more primary dependants are fully excluded. High risk of contestation under Section 26.',
      );
    } else if (mediumRiskCount > 0) {
      result.isSafe = false;
      result.riskLevel = 'MEDIUM';
    }

    return result;
  }

  /**
   * Determines if a person qualifies as a Dependant under Section 29 of the Law of Succession Act.
   */
  private isSection29Dependant(person: PotentialDependant): boolean {
    const rel = person.relationshipToTestator;

    // Category 1: Spouse & Children (Always dependants)
    // Note: Kenyan law treats 'Child' broadly (biological, adopted, out of wedlock, unborn)
    // We type this as string[] to allow mixing Enum values and custom strings
    const mandatoryDependants: string[] = [
      RelationshipType.SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      'CHILD_OUT_OF_WEDLOCK',
    ];

    if (mandatoryDependants.includes(rel)) {
      return true;
    }

    // Category 2: Parents, Step-children, Siblings, etc. (Dependants ONLY if maintained)
    // Explicitly typed as string[] to prevent TS strictness error when checking generic string
    const conditionalDependants: string[] = [
      RelationshipType.PARENT,
      RelationshipType.STEPCHILD,
      RelationshipType.SIBLING,
      RelationshipType.HALF_SIBLING,
      RelationshipType.GRANDCHILD,
    ];

    if (conditionalDependants.includes(rel)) {
      return person.wasMaintainedByTestator === true;
    }

    return false;
  }

  private findAssignmentsForDependant(
    person: PotentialDependant,
    assignments: BeneficiaryAssignment[],
  ): BeneficiaryAssignment[] {
    return assignments.filter((assignment) => {
      // Check for direct FamilyMember link
      if (assignment.familyMemberId === person.id) return true;

      // Check for external name match (fallback)
      if (assignment.externalName && person.fullName) {
        return assignment.externalName.toLowerCase() === person.fullName.toLowerCase();
      }

      return false;
    });
  }

  private addExclusionWarning(result: ProvisionResult, person: PotentialDependant): void {
    const baseMsg = `Dependant ${person.fullName} (${person.relationshipToTestator}) is excluded.`;

    if (person.isMinor) {
      result.issues.push(`${baseMsg} MINOR children must be provided for.`);
      result.suggestions.push(`Set up a Testamentary Trust for ${person.fullName}.`);
    } else if (person.relationshipToTestator === RelationshipType.SPOUSE) {
      result.issues.push(`${baseMsg} Spouse claims are very strong under Kenyan law.`);
    } else {
      result.issues.push(baseMsg);
      result.suggestions.push('Record Disinheritance Reason formally if exclusion is intentional.');
    }
  }

  private assessAdequacy(
    person: PotentialDependant,
    assignments: BeneficiaryAssignment[],
    totalEstateValue: number,
  ): 'ADEQUATE' | 'INADEQUATE' | 'UNKNOWN' {
    // If total estate value is unknown or zero, we can't calculate percentage
    if (totalEstateValue <= 0) return 'UNKNOWN';

    let totalAssignedValue = 0;

    for (const assignment of assignments) {
      // 1. Check for Residuary
      // Residuary beneficiaries essentially get "everything else", which is usually adequate
      if (assignment.bequestType === BequestType.RESIDUARY) return 'ADEQUATE';

      // 2. Check for Percentage
      if (assignment.sharePercent !== null) {
        totalAssignedValue += totalEstateValue * (assignment.sharePercent / 100);
      }

      // 3. Check for Specific Amount
      if (assignment.specificAmount !== null) {
        totalAssignedValue += assignment.specificAmount;
      }
    }

    const sharePercentage = (totalAssignedValue / totalEstateValue) * 100;

    // Heuristic: Less than 5% for a primary dependant might be argued as inadequate
    if (sharePercentage < 5) return 'INADEQUATE';

    return 'ADEQUATE';
  }

  getDependantProvisionDetail(
    dependant: PotentialDependant,
    assignments: BeneficiaryAssignment[],
    totalEstateValue: number,
  ) {
    const dependantAssignments = this.findAssignmentsForDependant(dependant, assignments);
    let totalAssignedValue = 0;

    for (const assignment of dependantAssignments) {
      if (assignment.sharePercent !== null) {
        totalAssignedValue += totalEstateValue * (assignment.sharePercent / 100);
      }
      if (assignment.specificAmount !== null) {
        totalAssignedValue += assignment.specificAmount;
      }
    }

    const percentageOfEstate =
      totalEstateValue > 0 ? (totalAssignedValue / totalEstateValue) * 100 : 0;
    const adequacy = this.assessAdequacy(dependant, dependantAssignments, totalEstateValue);

    return { totalAssignedValue, percentageOfEstate, assignments: dependantAssignments, adequacy };
  }

  getProvisionRecommendations(dependant: PotentialDependant, currentPercentage: number): string[] {
    const recs: string[] = [];
    if (dependant.isMinor) recs.push(`Set up a testamentary trust for ${dependant.fullName}.`);

    if (dependant.relationshipToTestator === RelationshipType.SPOUSE) {
      if (currentPercentage < 30) recs.push(`Increase spouse's share to at least 30% of estate.`);
      recs.push('Consider life interest in matrimonial home.');
    } else if (
      dependant.relationshipToTestator === RelationshipType.CHILD &&
      currentPercentage < 10
    ) {
      recs.push(`Allocate at least 10% to ${dependant.fullName}.`);
    }

    if (dependant.isIncapacitated) {
      recs.push(`Establish a special needs trust for ${dependant.fullName}.`);
    }
    return recs;
  }

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

    let totalDependantValue = 0;
    const legalDependants = dependants.filter((d) => this.isSection29Dependant(d));

    for (const d of legalDependants) {
      const provision = this.getDependantProvisionDetail(d, assignments, totalEstateValue);
      totalDependantValue += provision.totalAssignedValue;
    }

    result.totalDependantProvision = totalDependantValue;
    result.percentageToDependants =
      totalEstateValue > 0 ? (totalDependantValue / totalEstateValue) * 100 : 0;

    // Warning: If dependants (Spouse + Kids) get less than half the estate, it's highly contestable
    if (legalDependants.length > 0 && result.percentageToDependants < 50) {
      result.warnings.push(
        'Dependants receive less than 50% of estate. High risk of contestation.',
      );
      result.isValid = false; // Soft validation failure
    }

    const spouse = legalDependants.find(
      (d) => d.relationshipToTestator === RelationshipType.SPOUSE,
    );
    if (spouse) {
      const spouseProvision = this.getDependantProvisionDetail(
        spouse,
        assignments,
        totalEstateValue,
      );
      if (spouseProvision.percentageOfEstate < 20) {
        result.warnings.push('Spouse receives less than 20% of estate. Consider increasing share.');
        result.isValid = false;
      }
    }

    return result;
  }

  comprehensiveAnalysis(
    dependants: PotentialDependant[],
    assignments: BeneficiaryAssignment[],
    totalEstateValue: number,
  ) {
    const provisionResult = this.validateProvision(dependants, assignments, totalEstateValue);
    const distributionResult = this.validateOverallDistribution(
      dependants,
      assignments,
      totalEstateValue,
    );

    const dependantDetails = dependants
      .filter((d) => this.isSection29Dependant(d))
      .map((d) => {
        const provision = this.getDependantProvisionDetail(d, assignments, totalEstateValue);
        const recommendations = this.getProvisionRecommendations(d, provision.percentageOfEstate);
        return { dependant: d, provision, recommendations };
      });

    return { provisionResult, distributionResult, dependantDetails };
  }
}
