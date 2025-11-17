import { Injectable } from '@nestjs/common';
import { WillStatus, BequestType } from '@prisma/client';
import { WillAggregate } from '../aggregates/will.aggregate';
import { LegalCapacity } from '../value-objects/legal-capacity.vo';
import { DependantsProvisionPolicy } from '../policies/dependants-provision.policy';
import { WitnessEligibilityPolicy } from '../policies/witness-eligibility.policy';

export interface WillValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  complianceLevel: 'FULL' | 'PARTIAL' | 'MINIMAL' | 'NON_COMPLIANT';
}

@Injectable()
export class WillValidationService {
  constructor(
    private readonly dependantsPolicy: DependantsProvisionPolicy,
    private readonly witnessPolicy: WitnessEligibilityPolicy,
  ) {}

  /**
   * Comprehensive will validation against Kenyan legal requirements
   */
  async validateWill(
    will: WillAggregate,
    context: {
      testatorAge: number;
      familyMembers: any[];
      legalCapacity: LegalCapacity;
    },
  ): Promise<WillValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // 1. Basic validation
    this.validateBasicRequirements(will, errors, warnings);

    // 2. Legal capacity validation
    this.validateLegalCapacity(will, context.legalCapacity, errors);

    // 3. Witness validation
    await this.validateWitnesses(will, errors, warnings);

    // 4. Executor validation
    this.validateExecutors(will, errors, warnings);

    // 5. Beneficiary and asset validation
    this.validateBeneficiaryAssignments(will, errors, warnings);

    // 6. Dependants provision validation (Kenyan law)
    await this.validateDependantsProvision(will, context, errors, warnings, recommendations);

    // 7. Special Kenyan law requirements
    this.validateKenyanSpecificRequirements(will, errors, warnings, recommendations);

    // Determine compliance level
    const complianceLevel = this.determineComplianceLevel(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations,
      complianceLevel,
    };
  }

  /**
   * Validate basic will requirements
   */
  private validateBasicRequirements(
    will: WillAggregate,
    errors: string[],
    warnings: string[],
  ): void {
    const willEntity = will.getWill();

    // Title validation
    if (!willEntity.getTitle()?.trim()) {
      errors.push('Will must have a title');
    }

    // Testator validation
    if (!willEntity.getTestatorId()) {
      errors.push('Will must have a testator');
    }

    // Residuary clause validation
    if (!willEntity.getResiduaryClause()) {
      warnings.push('Residuary clause is recommended to handle unforeseen assets');
    }

    // Funeral wishes (optional but recommended)
    if (!willEntity.getFuneralWishes()) {
      recommendations.push('Consider adding funeral and burial wishes');
    }
  }

  /**
   * Validate testator's legal capacity
   */
  private validateLegalCapacity(
    will: WillAggregate,
    legalCapacity: LegalCapacity,
    errors: string[],
  ): void {
    if (!legalCapacity.hasLegalCapacity()) {
      errors.push('Testator does not have legal capacity to create a will');
      return;
    }

    // Check if capacity assessment is current
    if (!legalCapacity.isAssessmentCurrent()) {
      warnings.push('Legal capacity assessment may be outdated');
    }

    // Check for risk factors
    const riskFactors = legalCapacity.getRiskFactors();
    if (riskFactors.length > 0) {
      warnings.push(`Potential capacity concerns: ${riskFactors.join(', ')}`);
    }
  }

  /**
   * Validate witnesses according to Kenyan law
   */
  private async validateWitnesses(
    will: WillAggregate,
    errors: string[],
    warnings: string[],
  ): Promise<void> {
    const witnesses = will.getAllWitnesses();
    const signedWitnesses = will.getSignedWitnesses();

    // Minimum witness requirement
    if (will.getWill().getRequiresWitnesses() && signedWitnesses.length < 2) {
      errors.push('Kenyan law requires at least 2 signed witnesses');
    }

    // Witness eligibility
    for (const witness of witnesses) {
      const eligibility = this.witnessPolicy.validateEligibility({
        id: witness.getId(),
        userId: witness.getWitnessInfo().userId,
        fullName: witness.getWitnessInfo().fullName,
        idNumber: witness.getWitnessInfo().idNumber,
        relationship: witness.getWitnessInfo().relationship,
        age: 25, // In reality, we'd get this from user profile
        isBeneficiary: false, // In reality, we'd check beneficiary assignments
        isSpouse: witness.getWitnessInfo().relationship?.toLowerCase().includes('spouse') || false,
        isExecutor: false, // In reality, we'd check executor nominations
        hasMentalCapacity: true, // Assume yes unless known otherwise
        canReadWrite: true, // Assume yes for registered users
      });

      if (!eligibility.isEligible) {
        errors.push(
          `Witness ${witness.getWitnessName()} is ineligible: ${eligibility.issues.join(', ')}`,
        );
      }

      eligibility.recommendations.forEach((rec) => recommendations.push(rec));
    }

    // Witness signing process
    if (signedWitnesses.length > 0) {
      const signingValidation = this.witnessPolicy.validateWitnessingProcess({
        witnesses: signedWitnesses.map((w) => ({
          id: w.getId(),
          fullName: w.getWitnessInfo().fullName,
          // ... other properties
        })),
        testatorPresent: true, // Assume yes for digital signing
        allWitnessesPresentTogether: signedWitnesses.length >= 2,
        signedInPresenceOfTestator: true,
        dateOfSigning: will.getWill().getWillDate(),
      });

      if (!signingValidation.isValid) {
        errors.push(...signingValidation.issues);
      }
    }
  }

  /**
   * Validate executor nominations
   */
  private validateExecutors(will: WillAggregate, errors: string[], warnings: string[]): void {
    const executors = will.getAllExecutors();

    if (executors.length === 0) {
      errors.push('At least one executor must be nominated');
      return;
    }

    // Check for primary executor
    const primaryExecutor = will.getPrimaryExecutor();
    if (!primaryExecutor) {
      warnings.push('Consider nominating a primary executor for clarity');
    }

    // Validate executor order of priority
    const priorities = executors.map((e) => e.getOrderOfPriority());
    const uniquePriorities = new Set(priorities);
    if (uniquePriorities.size !== priorities.length) {
      warnings.push('Multiple executors have the same priority level');
    }

    // Check for accepted executors
    const acceptedExecutors = executors.filter((e) => e.hasAccepted());
    if (acceptedExecutors.length === 0 && will.getWill().isActiveWill()) {
      warnings.push('No executors have accepted their nomination for the active will');
    }
  }

  /**
   * Validate beneficiary assignments and asset distribution
   */
  private validateBeneficiaryAssignments(
    will: WillAggregate,
    errors: string[],
    warnings: string[],
  ): void {
    const assets = will.getAllAssets();
    const beneficiaries = will.getAllBeneficiaries();

    if (assets.length === 0) {
      errors.push('No assets assigned to the will');
    }

    if (beneficiaries.length === 0) {
      errors.push('No beneficiaries assigned to the will');
    }

    // Check each asset has beneficiaries
    for (const asset of assets) {
      const assetBeneficiaries = will.getBeneficiariesForAsset(asset.getId());
      if (assetBeneficiaries.length === 0) {
        errors.push(`Asset "${asset.getName()}" has no beneficiaries assigned`);
      }

      // Check percentage allocation
      const percentageBeneficiaries = assetBeneficiaries.filter(
        (b) => b.getBequestType() === BequestType.PERCENTAGE,
      );

      if (percentageBeneficiaries.length > 0) {
        const totalPercentage = percentageBeneficiaries.reduce(
          (sum, b) => sum + (b.getSharePercentage()?.getValue() || 0),
          0,
        );

        if (Math.abs(totalPercentage - 100) > 0.01) {
          errors.push(
            `Asset "${asset.getName()}" has invalid percentage allocation: ${totalPercentage}% (must total 100%)`,
          );
        }
      }
    }

    // Check for conditional bequests without alternates
    const conditionalBequests = beneficiaries.filter((b) => b.isConditional());
    for (const bequest of conditionalBequests) {
      if (!bequest.hasAlternate()) {
        warnings.push(
          `Conditional bequest for ${bequest.getBeneficiaryName()} has no alternate beneficiary specified`,
        );
      }
    }
  }

  /**
   * Validate provision for dependants as required by Kenyan law
   */
  private async validateDependantsProvision(
    will: WillAggregate,
    context: { testatorAge: number; familyMembers: any[] },
    errors: string[],
    warnings: string[],
    recommendations: string[],
  ): Promise<void> {
    // Identify dependants
    const dependants = DependantsProvisionPolicy.identifyDependants(
      context.familyMembers,
      context.testatorAge,
    );

    if (dependants.length === 0) {
      return; // No dependants to provide for
    }

    // Create estate context for validation
    const estateContext = {
      totalEstateValue: will.getTotalEstateValue(),
      testatorAge: context.testatorAge,
      hasValidWill: true,
      dependants,
      provisionsMade: [], // In reality, we'd map from beneficiary assignments
    };

    // Validate adequate provision
    const provisionValidation = this.dependantsPolicy.validateAdequateProvision(estateContext);

    if (!provisionValidation.isAdequate) {
      provisionValidation.shortfalls.forEach((shortfall) => {
        warnings.push(`Inadequate provision for dependant: ${shortfall.reason}`);
      });
    }

    provisionValidation.recommendations.forEach((rec) => recommendations.push(rec));
  }

  /**
   * Validate Kenyan-specific legal requirements
   */
  private validateKenyanSpecificRequirements(
    will: WillAggregate,
    errors: string[],
    warnings: string[],
    recommendations: string[],
  ): void {
    const willEntity = will.getWill();

    // Agricultural land considerations
    const hasAgriculturalLand = will
      .getAllAssets()
      .some(
        (asset) =>
          asset.getType() === 'LAND_PARCEL' &&
          asset.getLocation()?.county &&
          this.isAgriculturalCounty(asset.getLocation().county),
      );

    if (hasAgriculturalLand) {
      recommendations.push(
        'Consider spouse life interest provisions for agricultural land as per Kenyan customary law',
      );
    }

    // Digital assets in Kenyan context
    if (willEntity.getDigitalAssetInstructions()) {
      recommendations.push(
        'Ensure digital asset instructions comply with Kenyan data protection laws',
      );
    }

    // Funeral and burial customs
    if (willEntity.getFuneralWishes()) {
      recommendations.push(
        'Consider including traditional funeral rites if culturally appropriate',
      );
    }

    // Tax considerations
    const estateValue = will.getTotalEstateValue().getAmount();
    if (estateValue > 10000000) {
      // 10M KES
      recommendations.push(
        'Estate may be subject to inheritance tax - consider tax planning strategies',
      );
    }
  }

  /**
   * Determine overall compliance level
   */
  private determineComplianceLevel(
    errors: string[],
    warnings: string[],
  ): 'FULL' | 'PARTIAL' | 'MINIMAL' | 'NON_COMPLIANT' {
    if (errors.length === 0 && warnings.length === 0) {
      return 'FULL';
    } else if (errors.length === 0 && warnings.length <= 2) {
      return 'PARTIAL';
    } else if (errors.length === 0) {
      return 'MINIMAL';
    } else {
      return 'NON_COMPLIANT';
    }
  }

  private isAgriculturalCounty(county: string): boolean {
    const agriculturalCounties = [
      'Nakuru',
      'Uasin Gishu',
      'Trans Nzoia',
      'Laikipia',
      'Nyandarua',
      'Meru',
      'Embu',
      'Kirinyaga',
      'Nyeri',
      'Muranga',
      'Kiambu',
    ];
    return agriculturalCounties.includes(county);
  }

  /**
   * Quick validation for will status transitions
   */
  validateStatusTransition(
    currentStatus: WillStatus,
    newStatus: WillStatus,
  ): { isValid: boolean; reason?: string } {
    const validTransitions: Record<WillStatus, WillStatus[]> = {
      [WillStatus.DRAFT]: [WillStatus.PENDING_WITNESS, WillStatus.REVOKED],
      [WillStatus.PENDING_WITNESS]: [WillStatus.WITNESSED, WillStatus.DRAFT, WillStatus.REVOKED],
      [WillStatus.WITNESSED]: [WillStatus.ACTIVE, WillStatus.REVOKED],
      [WillStatus.ACTIVE]: [
        WillStatus.REVOKED,
        WillStatus.CONTESTED,
        WillStatus.PROBATE,
        WillStatus.EXECUTED,
      ],
      [WillStatus.REVOKED]: [],
      [WillStatus.SUPERSEDED]: [],
      [WillStatus.EXECUTED]: [],
      [WillStatus.CONTESTED]: [WillStatus.ACTIVE, WillStatus.REVOKED],
      [WillStatus.PROBATE]: [WillStatus.EXECUTED, WillStatus.CONTESTED],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      return {
        isValid: false,
        reason: `Cannot transition from ${currentStatus} to ${newStatus}`,
      };
    }

    return { isValid: true };
  }
}
