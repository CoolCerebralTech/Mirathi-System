import { Injectable } from '@nestjs/common';
import { WillAggregate } from '../aggregates/will.aggregate';
import { WillStructurePolicy } from '../policies/will-structure.policy';
import {
  DependantsProvisionPolicy,
  PotentialDependant,
} from '../policies/dependants-provision.policy';
import { ExecutorEligibilityPolicy } from '../policies/executor-eligibility.policy';
import { WitnessEligibilityPolicy } from '../policies/witness-eligibility.policy';
import { AssetVerificationPolicy } from '../policies/asset-verification.policy';

export interface ValidationResult {
  isValid: boolean;
  isLegallyCompliant: boolean; // Distinct from valid structure (e.g., structure ok, but illegal witness)
  criticalErrors: string[];
  warnings: string[];
  suggestions: string[];
  complianceScore: number; // 0-100
}

@Injectable()
export class WillValidationService {
  constructor(
    private readonly structurePolicy: WillStructurePolicy,
    private readonly dependantsPolicy: DependantsProvisionPolicy,
    private readonly executorPolicy: ExecutorEligibilityPolicy,
    private readonly witnessPolicy: WitnessEligibilityPolicy,
    private readonly assetPolicy: AssetVerificationPolicy,
  ) {}

  /**
   * Performs a comprehensive legal and structural audit of the Will.
   * @param aggregate The Will Aggregate containing all entities
   * @param familyMembers List of potential dependants (fetched from Family Service)
   */
  public validateWill(
    aggregate: WillAggregate,
    familyMembers: PotentialDependant[] = [], // Optional, but required for Sec 26 check
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      isLegallyCompliant: true,
      criticalErrors: [],
      warnings: [],
      suggestions: [],
      complianceScore: 100,
    };

    // 1. Structure & Distribution Logic
    const structureCheck = this.structurePolicy.validateDistributionStructure(
      aggregate.getWill(),
      aggregate.getBeneficiaries(),
    );
    this.mergeResult(result, structureCheck.errors, structureCheck.warnings, [], true);

    // 2. Asset Verification (Testamentary Capacity)
    for (const asset of aggregate.getAssets()) {
      const assetCheck = this.assetPolicy.checkTestamentaryCapacity(asset);
      if (!assetCheck.isCompliant) {
        // Use the 'name' property instead of getName()
        const assetName = 'name' in asset && asset.name ? asset.name : 'Unnamed Asset';
        this.mergeResult(
          result,
          assetCheck.errors.map((e) => `Asset '${assetName}': ${e}`),
          assetCheck.warnings.map((w) => `Asset '${assetName}': ${w}`),
          [],
          true,
        );
      }
    }

    // 3. Executor Eligibility
    const executorCheck = this.executorPolicy.checkExecutorComposition(aggregate.getExecutors());
    this.mergeResult(result, executorCheck.errors, executorCheck.warnings, [], true);

    // 4. Witness Eligibility (Section 11 & 13)
    const witnesses = aggregate.getWitnesses();
    if (witnesses.length > 0) {
      const witnessCompCheck = this.witnessPolicy.validateWitnessComposition(witnesses);
      this.mergeResult(result, witnessCompCheck.errors, witnessCompCheck.warnings, [], true);

      for (const witness of witnesses) {
        const conflictCheck = this.witnessPolicy.checkConflictOfInterest(
          witness,
          aggregate.getBeneficiaries(),
        );
        this.mergeResult(result, conflictCheck.errors, conflictCheck.warnings, [], true);
      }
    }

    // 5. Dependant Provision (Section 26)
    if (familyMembers.length > 0) {
      const provisionCheck = this.dependantsPolicy.validateProvision(
        familyMembers,
        aggregate.getBeneficiaries(),
        0,
      );

      if (provisionCheck.riskLevel === 'HIGH' || provisionCheck.riskLevel === 'CRITICAL') {
        this.mergeResult(result, [], provisionCheck.issues, provisionCheck.suggestions, false);
        result.complianceScore -= 20;
      } else if (provisionCheck.riskLevel === 'MEDIUM') {
        this.mergeResult(result, [], provisionCheck.issues, provisionCheck.suggestions, false);
        result.complianceScore -= 10;
      }
    }

    // Final Score Calculation
    if (result.criticalErrors.length > 0) {
      result.isValid = false;
      result.isLegallyCompliant = false;
      result.complianceScore = 0;
    }

    return result;
  }

  // Helper to merge policy results into main result
  private mergeResult(
    target: ValidationResult,
    errors: string[],
    warnings: string[],
    suggestions: string[] = [],
    isCritical: boolean,
  ) {
    if (errors.length > 0) {
      target.criticalErrors.push(...errors);
      if (isCritical) {
        target.isValid = false;
        target.isLegallyCompliant = false;
      }
    }
    target.warnings.push(...warnings);
    target.suggestions.push(...suggestions);
  }
}
