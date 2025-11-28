export interface CapacityAssessment {
  isOfAge: boolean;
  isSoundMind: boolean;
  understandsWillNature: boolean;
  understandsAssetExtent: boolean;
  understandsBeneficiaryClaims: boolean;
  freeFromUndueInfluence: boolean;
  assessmentDate: Date;
  assessedBy?: string; // Lawyer/doctor ID
}

export class LegalCapacity {
  private readonly assessment: CapacityAssessment;
  private readonly notes?: string;

  public constructor(assessment: CapacityAssessment, notes?: string) {
    this.assessment = { ...assessment }; // Immutable copy
    this.notes = notes;

    Object.freeze(this); // Ensure immutability
  }

  // -----------------------------------------------------
  // Factory method
  // -----------------------------------------------------
  static create(assessment: CapacityAssessment, notes?: string): LegalCapacity {
    if (!assessment.assessmentDate) {
      throw new Error('Assessment date is required');
    }

    if (assessment.assessmentDate > new Date()) {
      throw new Error('Assessment date cannot be in the future');
    }

    return new LegalCapacity(assessment, notes);
  }

  // -----------------------------------------------------
  // Getters
  // -----------------------------------------------------
  getAssessment(): Readonly<CapacityAssessment> {
    return { ...this.assessment };
  }

  getNotes(): string | undefined {
    return this.notes;
  }

  // -----------------------------------------------------
  // Business logic
  // -----------------------------------------------------
  hasLegalCapacity(): boolean {
    return (
      this.assessment.isOfAge &&
      this.assessment.isSoundMind &&
      this.assessment.understandsWillNature &&
      this.assessment.understandsAssetExtent &&
      this.assessment.understandsBeneficiaryClaims &&
      this.assessment.freeFromUndueInfluence
    );
  }

  isAssessmentCurrent(maxAgeInDays: number = 30): boolean {
    const now = new Date();
    const diffTime = now.getTime() - this.assessment.assessmentDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= maxAgeInDays;
  }

  getRiskFactors(): string[] {
    const risks: string[] = [];
    if (!this.assessment.isOfAge) risks.push('Testator is underage');
    if (!this.assessment.isSoundMind) risks.push('Testator not of sound mind');
    if (!this.assessment.understandsWillNature)
      risks.push('Testator does not understand will nature');
    if (!this.assessment.understandsAssetExtent)
      risks.push('Testator does not understand asset extent');
    if (!this.assessment.understandsBeneficiaryClaims)
      risks.push('Testator does not understand beneficiary claims');
    if (!this.assessment.freeFromUndueInfluence) risks.push('Potential undue influence detected');

    return risks;
  }

  equals(other: LegalCapacity): boolean {
    const otherAssessment = other.getAssessment();
    return (
      this.assessment.assessmentDate.getTime() === otherAssessment.assessmentDate.getTime() &&
      this.assessment.assessedBy === otherAssessment.assessedBy
    );
  }

  toString(): string {
    return `Legal Capacity Assessment: ${this.hasLegalCapacity() ? 'VALID' : 'INVALID'} (${this.assessment.assessmentDate.toISOString().split('T')[0]})`;
  }

  // -----------------------------------------------------
  // Convenience factory for always-valid assessment
  // -----------------------------------------------------
  static createValidAssessment(assessedBy?: string): LegalCapacity {
    const assessment: CapacityAssessment = {
      isOfAge: true,
      isSoundMind: true,
      understandsWillNature: true,
      understandsAssetExtent: true,
      understandsBeneficiaryClaims: true,
      freeFromUndueInfluence: true,
      assessmentDate: new Date(),
      assessedBy,
    };

    return new LegalCapacity(assessment, 'Automatic valid assessment');
  }
}
