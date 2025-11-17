import { RelationshipType } from '@prisma/client';
import { KenyanId } from '../value-objects/kenyan-id.vo';

export interface WitnessCandidate {
  id: string;
  userId?: string;
  fullName: string;
  idNumber?: string;
  relationship?: string;
  relationshipType?: RelationshipType;
  age?: number;
  isBeneficiary: boolean;
  isSpouse: boolean;
  isExecutor: boolean;
  hasMentalCapacity: boolean;
  canReadWrite: boolean;
}

export class WitnessEligibilityPolicy {
  /**
   * Kenyan Law of Succession Act: Witness eligibility requirements
   * - Must be 18+ years old
   * - Must be of sound mind
   * - Must not be beneficiary or spouse of beneficiary
   * - Must be literate (can read and write)
   * - Must have valid identification
   */
  validateEligibility(candidate: WitnessCandidate): {
    isEligible: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Age requirement
    if (!candidate.age || candidate.age < 18) {
      issues.push('Witness must be at least 18 years old');
    }

    // Mental capacity
    if (!candidate.hasMentalCapacity) {
      issues.push('Witness must be of sound mind');
    }

    // Literacy requirement
    if (!candidate.canReadWrite) {
      issues.push('Witness must be able to read and write to understand the will');
    }

    // Identification requirement
    if (!candidate.idNumber) {
      issues.push('Witness must have valid identification');
    } else if (!KenyanId.isValid(candidate.idNumber)) {
      issues.push('Witness must have valid Kenyan ID number');
    }

    // Conflict of interest checks
    if (candidate.isBeneficiary) {
      issues.push('Beneficiary cannot serve as witness under Kenyan law');
    }

    if (candidate.isSpouse) {
      issues.push('Spouse of testator cannot serve as witness');
    }

    if (candidate.isExecutor) {
      issues.push('Executor should not serve as witness to avoid conflicts');
      recommendations.push(
        'Consider using independent witnesses not involved in estate administration',
      );
    }

    // Relationship restrictions
    if (candidate.relationshipType && this.isCloseFamily(candidate.relationshipType)) {
      issues.push(
        `Close family member (${candidate.relationshipType}) should not serve as witness`,
      );
      recommendations.push('Use independent witnesses not related to the testator');
    }

    // Professional witness recommendations
    if (issues.length === 0 && !this.hasProfessionalBackground(candidate)) {
      recommendations.push(
        'Consider using professional witnesses (lawyers, magistrates, commissioners for oaths) for stronger legal standing',
      );
    }

    return {
      isEligible: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Kenyan best practices for witness selection
   */
  getIdealWitnessProfile(): {
    minimumAge: number;
    requiredDocuments: string[];
    prohibitedRelationships: RelationshipType[];
    recommendedProfessions: string[];
  } {
    return {
      minimumAge: 18,
      requiredDocuments: ['National ID', 'Passport or Driving License'],
      prohibitedRelationships: [
        RelationshipType.SPOUSE,
        RelationshipType.CHILD,
        RelationshipType.PARENT,
        RelationshipType.SIBLING,
      ],
      recommendedProfessions: [
        'Lawyer',
        'Magistrate',
        'Commissioner for Oaths',
        'Medical Doctor',
        'Registered Engineer',
        'Bank Manager',
      ],
    };
  }

  /**
   * Validate witness signature process per Kenyan requirements
   */
  validateWitnessingProcess(params: {
    witnesses: WitnessCandidate[];
    testatorPresent: boolean;
    allWitnessesPresentTogether: boolean;
    signedInPresenceOfTestator: boolean;
    dateOfSigning: Date;
  }): {
    isValid: boolean;
    issues: string[];
    legalRequirements: string[];
  } {
    const {
      witnesses,
      testatorPresent,
      allWitnessesPresentTogether,
      signedInPresenceOfTestator,
      dateOfSigning,
    } = params;
    const issues: string[] = [];
    const legalRequirements: string[] = [];

    // Minimum 2 witnesses required
    if (witnesses.length < 2) {
      issues.push('Kenyan law requires at least 2 witnesses');
    }
    legalRequirements.push('Minimum of 2 witnesses required');

    // Testator must be present
    if (!testatorPresent) {
      issues.push('Testator must be present during witnessing');
    }
    legalRequirements.push('Testator must be physically present during signing');

    // All witnesses must be present together
    if (!allWitnessesPresentTogether) {
      issues.push('All witnesses must be present together during signing');
    }
    legalRequirements.push('All witnesses must sign in the presence of each other');

    // Must sign in presence of testator
    if (!signedInPresenceOfTestator) {
      issues.push('Witnesses must sign in the presence of the testator');
    }
    legalRequirements.push('Witnesses must sign in the presence of the testator');

    // Date validation
    if (dateOfSigning > new Date()) {
      issues.push('Signing date cannot be in the future');
    }

    // Witness eligibility checks
    for (const witness of witnesses) {
      const eligibility = this.validateEligibility(witness);
      if (!eligibility.isEligible) {
        issues.push(`Witness ${witness.fullName} is ineligible: ${eligibility.issues.join(', ')}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      legalRequirements,
    };
  }

  private isCloseFamily(relationship: RelationshipType): boolean {
    const closeRelationships = [
      RelationshipType.SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
      RelationshipType.PARENT,
      RelationshipType.SIBLING,
    ];
    return closeRelationships.includes(relationship);
  }

  private hasProfessionalBackground(candidate: WitnessCandidate): boolean {
    // In reality, we'd check candidate's profession
    // For now, return true if they have certain professional indicators
    const professionalIndicators = [
      'advocate',
      'lawyer',
      'magistrate',
      'judge',
      'doctor',
      'engineer',
    ];
    return professionalIndicators.some(
      (profession) =>
        candidate.fullName.toLowerCase().includes(profession) ||
        candidate.relationship?.toLowerCase().includes(profession),
    );
  }
}
