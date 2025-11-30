import { Injectable } from '@nestjs/common';

import { WillAggregate } from '../aggregates/will.aggregate';
import { AssetVerificationPolicy } from '../policies/asset-verification.policy';
import {
  DependantsProvisionPolicy,
  PotentialDependant,
} from '../policies/dependants-provision.policy';
import { ExecutorEligibilityPolicy } from '../policies/executor-eligibility.policy';
import { WillStructurePolicy } from '../policies/will-structure.policy';
import { WitnessEligibilityPolicy } from '../policies/witness-eligibility.policy';

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
    // Validates math (percentages add up) and logic (residuary clause exists)
    const structureCheck = this.structurePolicy.validateDistributionStructure(
      aggregate.getWill(),
      aggregate.getBeneficiaries(),
    );
    this.mergeResult(result, structureCheck.errors, structureCheck.warnings, [], true);

    // 2. Asset Verification (Testamentary Capacity)
    // Validates if assets can legally be willed (e.g. Joint Tenancy vs Tenancy in Common)
    for (const asset of aggregate.getAssets()) {
      const assetCheck = this.assetPolicy.checkTestamentaryCapacity(asset);

      // Handle non-compliance (Critical Errors)
      if (!assetCheck.isCompliant) {
        this.mergeResult(
          result,
          assetCheck.errors.map((e) => `Asset '${asset.name}': ${e}`),
          assetCheck.warnings.map((w) => `Asset '${asset.name}': ${w}`),
          [],
          true, // Critical because invalid assets can't be willed
        );
      }
      // Handle warnings for compliant assets (e.g. Unverified)
      else if (assetCheck.warnings.length > 0) {
        this.mergeResult(
          result,
          [],
          assetCheck.warnings.map((w) => `Asset '${asset.name}': ${w}`),
          [],
          false, // Not critical, just risky
        );
      }
    }

    // 3. Executor Eligibility
    // Validates number of executors (max 4) and basics
    const executorCheck = this.executorPolicy.checkExecutorComposition(aggregate.getExecutors());
    this.mergeResult(result, executorCheck.errors, executorCheck.warnings, [], true);

    // 4. Witness Eligibility (Section 11 & 13)
    const witnesses = aggregate.getWitnesses();
    if (witnesses.length > 0) {
      // A. Composition Check (Min 2 witnesses)
      const witnessCompCheck = this.witnessPolicy.validateWitnessComposition(witnesses);
      this.mergeResult(result, witnessCompCheck.errors, witnessCompCheck.warnings, [], true);

      // B. Conflict of Interest Check (Witness != Beneficiary)
      for (const witness of witnesses) {
        const conflictCheck = this.witnessPolicy.checkConflictOfInterest(
          witness,
          aggregate.getBeneficiaries(),
        );
        this.mergeResult(result, conflictCheck.errors, conflictCheck.warnings, [], true);
      }
    }

    // 5. Dependant Provision (Section 26)
    // Validates if Spouse/Children are adequately provided for
    if (familyMembers.length > 0) {
      // Calculate real value for adequacy check
      const totalEstateValue = aggregate.getTotalEstateValue();

      const provisionCheck = this.dependantsPolicy.validateProvision(
        familyMembers,
        aggregate.getBeneficiaries(),
        totalEstateValue,
      );

      // Section 26 issues typically lead to contestation, not invalidity.
      // We reduce the score and add warnings, but don't mark 'isValid=false' unless strictly required.
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
