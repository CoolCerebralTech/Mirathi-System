import { Injectable } from '@nestjs/common';
import { BequestType } from '@prisma/client';

import { BeneficiaryAssignment } from '../entities/beneficiary.entity';

export interface PotentialDependant {
  id: string;
  fullName: string;
  relationshipToTestator: string; // CODE from RELATIONSHIP_TYPES
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
          `Provision for ${dependant.fullName} (${dependant.relationshipToTestator}) may be inadequate.`,
        );
      }
    }

    if (highRiskCount > 0) {
      result.isSafe = false;
      result.riskLevel = 'HIGH';
      result.issues.unshift(
        'CRITICAL: One or more primary dependants are fully excluded. High risk of contestation.',
      );
    } else if (mediumRiskCount > 0) {
      result.isSafe = false;
      result.riskLevel = 'MEDIUM';
    }

    return result;
  }

  private isSection29Dependant(person: PotentialDependant): boolean {
    if (
      ['SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'CHILD_OUT_OF_WEDLOCK'].includes(
        person.relationshipToTestator,
      )
    ) {
      return true;
    }
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
      result.suggestions.push(`Set up a Testamentary Trust for ${person.fullName}.`);
    } else if (person.relationshipToTestator === 'SPOUSE') {
      result.issues.push(`${baseMsg} Spouse claims are strong.`);
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
    if (totalEstateValue <= 0) return 'UNKNOWN';

    let totalAssignedValue = 0;
    for (const assignment of assignments) {
      const percentage = assignment.getSharePercentage();
      if (percentage) totalAssignedValue += totalEstateValue * (percentage.getValue() / 100);

      const specificAmount = assignment.getSpecificAmount();
      if (specificAmount) totalAssignedValue += specificAmount.getAmount();

      if (assignment.getBequestType() === BequestType.RESIDUARY) return 'ADEQUATE';
    }

    const sharePercentage = (totalAssignedValue / totalEstateValue) * 100;
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
      const percentage = assignment.getSharePercentage();
      if (percentage) totalAssignedValue += totalEstateValue * (percentage.getValue() / 100);
      const specificAmount = assignment.getSpecificAmount();
      if (specificAmount) totalAssignedValue += specificAmount.getAmount();
    }

    const percentageOfEstate =
      totalEstateValue > 0 ? (totalAssignedValue / totalEstateValue) * 100 : 0;
    const adequacy = this.assessAdequacy(dependant, dependantAssignments, totalEstateValue);

    return { totalAssignedValue, percentageOfEstate, assignments: dependantAssignments, adequacy };
  }

  getProvisionRecommendations(dependant: PotentialDependant, currentPercentage: number): string[] {
    const recs: string[] = [];
    if (dependant.isMinor) recs.push(`Set up a testamentary trust for ${dependant.fullName}.`);
    if (dependant.relationshipToTestator === 'SPOUSE') {
      if (currentPercentage < 30) recs.push(`Increase spouse's share to at least 30% of estate.`);
      recs.push('Consider life interest in matrimonial home.');
    } else if (dependant.relationshipToTestator === 'CHILD' && currentPercentage < 10)
      recs.push(`Allocate at least 10% to ${dependant.fullName}.`);
    if (dependant.isIncapacitated)
      recs.push(`Establish a special needs trust for ${dependant.fullName}.`);
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

    if (legalDependants.length > 0 && result.percentageToDependants < 50) {
      result.warnings.push(
        'Dependants receive less than 50% of estate. Consider increasing provision.',
      );
      result.isValid = false;
    }

    const spouse = legalDependants.find((d) => d.relationshipToTestator === 'SPOUSE');
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
