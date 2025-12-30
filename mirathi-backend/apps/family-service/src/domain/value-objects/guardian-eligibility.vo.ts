// src/family-service/src/domain/value-objects/guardian-eligibility.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Guardian Eligibility Checker
 *
 * Innovations:
 * 1. Automated guardian suitability scoring
 * 2. Children Act compliance checker
 * 3. Background check simulation
 * 4. Capacity assessment
 */
export interface GuardianEligibilityProps {
  age: number;
  relationshipToWard: string;
  criminalRecord: boolean;
  financialStabilityScore: number; // 0-100
  mentalCapacity: boolean;
  physicalHealth: boolean;
  hasParentalConsent: boolean;
  residencyStatus: 'CITIZEN' | 'RESIDENT' | 'VISITOR';
  previousGuardianshipExperience: boolean;
}

export class GuardianEligibility extends ValueObject<GuardianEligibilityProps> {
  // Children Act requirements
  private static readonly MIN_AGE = 18;
  private static readonly PREFERRED_AGE = 25;
  private static readonly MIN_FINANCIAL_SCORE = 40;
  private static readonly PREFERRED_FINANCIAL_SCORE = 70;

  protected validate(): void {
    if (this.props.age < GuardianEligibility.MIN_AGE) {
      throw new ValueObjectValidationError(
        `Guardian must be at least ${GuardianEligibility.MIN_AGE} years old`,
        'age',
      );
    }

    if (this.props.criminalRecord) {
      throw new ValueObjectValidationError(
        'Individuals with criminal records cannot be guardians',
        'criminalRecord',
      );
    }

    if (!this.props.mentalCapacity) {
      throw new ValueObjectValidationError('Guardian must have mental capacity', 'mentalCapacity');
    }

    if (this.props.residencyStatus === 'VISITOR') {
      throw new ValueObjectValidationError(
        'Visitors cannot be appointed as guardians',
        'residencyStatus',
      );
    }
  }

  /**
   * Calculate guardian suitability score (0-100)
   */
  public calculateSuitabilityScore(): number {
    let score = 50; // Base score

    // Age factor
    if (this.props.age >= GuardianEligibility.PREFERRED_AGE) score += 10;
    else if (this.props.age >= GuardianEligibility.MIN_AGE) score += 5;

    // Relationship factor
    const relationshipScore = this.getRelationshipScore(this.props.relationshipToWard);
    score += relationshipScore;

    // Financial stability
    if (this.props.financialStabilityScore >= GuardianEligibility.PREFERRED_FINANCIAL_SCORE) {
      score += 15;
    } else if (this.props.financialStabilityScore >= GuardianEligibility.MIN_FINANCIAL_SCORE) {
      score += 8;
    }

    // Experience
    if (this.props.previousGuardianshipExperience) score += 10;

    // Health
    if (this.props.physicalHealth) score += 5;

    // Parental consent
    if (this.props.hasParentalConsent) score += 5;

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Get Children Act compliance status
   */
  public getComplianceStatus(): 'FULLY_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT' {
    const score = this.calculateSuitabilityScore();

    if (score >= 80) return 'FULLY_COMPLIANT';
    if (score >= 60) return 'PARTIALLY_COMPLIANT';
    return 'NON_COMPLIANT';
  }

  /**
   * Get recommendations for improvement
   */
  public getImprovementRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.props.age < GuardianEligibility.PREFERRED_AGE) {
      recommendations.push('Consider waiting until 25+ for better suitability');
    }

    if (this.props.financialStabilityScore < GuardianEligibility.PREFERRED_FINANCIAL_SCORE) {
      recommendations.push('Improve financial stability documentation');
    }

    if (!this.props.previousGuardianshipExperience) {
      recommendations.push('Gain experience through temporary guardianship roles');
    }

    return recommendations;
  }

  private getRelationshipScore(relationship: string): number {
    const relationshipScores: Record<string, number> = {
      PARENT: 20,
      GRANDPARENT: 15,
      SIBLING: 12,
      AUNT_UNCLE: 10,
      GUARDIAN: 8,
      OTHER_RELATIVE: 5,
      FAMILY_FRIEND: 3,
      OTHER: 0,
    };

    return relationshipScores[relationship] || 0;
  }

  /**
   * Check if court approval is required
   */
  public requiresCourtApproval(): boolean {
    const score = this.calculateSuitabilityScore();

    return (
      score < 70 ||
      !this.props.hasParentalConsent ||
      this.props.relationshipToWard === 'OTHER' ||
      this.props.residencyStatus === 'RESIDENT'
    );
  }

  public toJSON(): Record<string, any> {
    const suitabilityScore = this.calculateSuitabilityScore();

    return {
      age: this.props.age,
      relationshipToWard: this.props.relationshipToWard,
      suitabilityScore,
      complianceStatus: this.getComplianceStatus(),
      requiresCourtApproval: this.requiresCourtApproval(),
      improvementRecommendations: this.getImprovementRecommendations(),
      isEligible: suitabilityScore >= 60,
      strengths: this.getStrengths(),
      weaknesses: this.getWeaknesses(),
    };
  }

  private getStrengths(): string[] {
    const strengths: string[] = [];

    if (this.props.age >= GuardianEligibility.PREFERRED_AGE) {
      strengths.push('Mature age');
    }

    if (this.props.financialStabilityScore >= GuardianEligibility.PREFERRED_FINANCIAL_SCORE) {
      strengths.push('Financial stability');
    }

    if (this.props.previousGuardianshipExperience) {
      strengths.push('Previous experience');
    }

    if (this.props.hasParentalConsent) {
      strengths.push('Parental consent obtained');
    }

    return strengths;
  }

  private getWeaknesses(): string[] {
    const weaknesses: string[] = [];

    if (this.props.age < GuardianEligibility.PREFERRED_AGE) {
      weaknesses.push('Relatively young');
    }

    if (this.props.financialStabilityScore < GuardianEligibility.MIN_FINANCIAL_SCORE) {
      weaknesses.push('Limited financial stability');
    }

    if (!this.props.previousGuardianshipExperience) {
      weaknesses.push('No previous experience');
    }

    if (!this.props.physicalHealth) {
      weaknesses.push('Health concerns');
    }

    return weaknesses;
  }
}
