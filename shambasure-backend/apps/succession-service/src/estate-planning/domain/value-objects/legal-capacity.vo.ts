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

  constructor(assessment: CapacityAssessment, notes?: string) {
    if (!assessment.assessmentDate) {
      throw new Error('Assessment date is required');
    }

    if (assessment.assessmentDate > new Date()) {
      throw new Error('Assessment date cannot be in the future');
    }

    this.assessment = { ...assessment };
    this.notes = notes;
  }

  getAssessment(): Readonly<CapacityAssessment> {
    return { ...this.assessment };
  }

  getNotes(): string | undefined {
    return this.notes;
  }

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
    const diffTime = Math.abs(now.getTime() - this.assessment.assessmentDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
    return (
      this.assessment.assessmentDate.getTime() === other.getAssessment().assessmentDate.getTime() &&
      this.assessment.assessedBy === other.getAssessment().assessedBy
    );
  }

  toString(): string {
    return `Legal Capacity Assessment: ${this.hasLegalCapacity() ? 'VALID' : 'INVALID'} (${this.assessment.assessmentDate.toISOString().split('T')[0]})`;
  }

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
