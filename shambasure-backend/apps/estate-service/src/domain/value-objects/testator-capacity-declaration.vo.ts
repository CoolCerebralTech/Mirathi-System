// src/estate-service/src/domain/value-objects/testator-capacity-declaration.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

export type CapacityStatus =
  | 'ASSESSED_COMPETENT'
  | 'ASSESSED_INCOMPETENT'
  | 'PENDING_ASSESSMENT'
  | 'MEDICAL_CERTIFICATION'
  | 'COURT_DETERMINATION'
  | 'SELF_DECLARATION';

export interface TestatorCapacityDeclarationProps {
  status: CapacityStatus;
  declarationDate: Date;
  assessedBy?: string; // Doctor, lawyer, court officer
  assessmentNotes?: string;
  supportingDocumentIds: string[];
  isVoluntarilyMade: boolean;
  isFreeFromUndueInfluence: boolean;
}

/**
 * Testator Capacity Declaration Value Object
 *
 * Records the mental capacity of the testator at time of will making
 * Legal Requirements (Kenyan Law of Succession Act):
 * - Testator must be of sound mind (animus testandi)
 * - Must understand nature of act and its consequences
 * - Must know extent of property being disposed
 * - Must recall persons with natural claims
 * - Declaration should be voluntary and free from undue influence
 */
export class TestatorCapacityDeclaration extends ValueObject<TestatorCapacityDeclarationProps> {
  constructor(props: TestatorCapacityDeclarationProps) {
    super(props);
  }
  public static create(props: any): TestatorCapacityDeclaration {
    return new TestatorCapacityDeclaration({
      status: props.status,
      declarationDate: props.declarationDate ? new Date(props.declarationDate) : new Date(),
      assessedBy: props.assessedBy,
      assessmentNotes: props.assessmentNotes,
      supportingDocumentIds: props.supportingDocumentIds || [],
      isVoluntarilyMade: props.isVoluntarilyMade ?? true,
      isFreeFromUndueInfluence: props.isFreeFromUndueInfluence ?? true,
    });
  }

  protected validate(): void {
    // Declaration date cannot be in the future
    const now = new Date();
    if (this.props.declarationDate > now) {
      throw new ValueObjectValidationError(
        'Declaration date cannot be in the future',
        'declarationDate',
      );
    }

    // Validate status
    const validStatuses: CapacityStatus[] = [
      'ASSESSED_COMPETENT',
      'ASSESSED_INCOMPETENT',
      'PENDING_ASSESSMENT',
      'MEDICAL_CERTIFICATION',
      'COURT_DETERMINATION',
      'SELF_DECLARATION',
    ];

    if (!validStatuses.includes(this.props.status)) {
      throw new ValueObjectValidationError(
        `Invalid capacity status: ${this.props.status}`,
        'status',
      );
    }

    // If assessed, must have assessor
    if (this.props.status.includes('ASSESSED') && !this.props.assessedBy) {
      throw new ValueObjectValidationError(
        'Assessment status requires assessor name',
        'assessedBy',
      );
    }

    // Medical certification requires notes
    if (this.props.status === 'MEDICAL_CERTIFICATION' && !this.props.assessmentNotes) {
      throw new ValueObjectValidationError(
        'Medical certification requires assessment notes',
        'assessmentNotes',
      );
    }

    // Must be voluntarily made
    if (!this.props.isVoluntarilyMade) {
      throw new ValueObjectValidationError(
        'Capacity declaration must be voluntarily made',
        'isVoluntarilyMade',
      );
    }

    // Must be free from undue influence
    if (!this.props.isFreeFromUndueInfluence) {
      throw new ValueObjectValidationError(
        'Capacity declaration must be free from undue influence',
        'isFreeFromUndueInfluence',
      );
    }
  }

  /**
   * Check if testator is considered competent
   */
  public isCompetent(): boolean {
    return (
      this.props.status === 'ASSESSED_COMPETENT' ||
      this.props.status === 'MEDICAL_CERTIFICATION' ||
      this.props.status === 'COURT_DETERMINATION' ||
      this.props.status === 'SELF_DECLARATION'
    );
  }

  /**
   * Check if declaration is legally sufficient
   */
  public isLegallySufficient(): boolean {
    // Self-declaration alone may not be sufficient for large estates
    if (this.props.status === 'SELF_DECLARATION') {
      return this.props.supportingDocumentIds.length > 0;
    }

    return (
      this.isCompetent() && this.props.isVoluntarilyMade && this.props.isFreeFromUndueInfluence
    );
  }

  /**
   * Get risk level for potential challenges
   */
  public getRiskLevel(): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (this.props.status === 'ASSESSED_INCOMPETENT') {
      return 'HIGH';
    }

    if (this.props.status === 'SELF_DECLARATION' && this.props.supportingDocumentIds.length === 0) {
      return 'HIGH';
    }

    if (this.props.status === 'PENDING_ASSESSMENT') {
      return 'MEDIUM';
    }

    if (!this.props.assessmentNotes && this.props.status !== 'SELF_DECLARATION') {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Get recommended actions to strengthen declaration
   */
  public getRecommendedActions(): string[] {
    const actions: string[] = [];

    if (this.props.status === 'SELF_DECLARATION') {
      actions.push('Obtain medical certification of mental capacity');
      actions.push('Have will witnessed by medical professional');
    }

    if (!this.props.assessmentNotes && this.props.status !== 'SELF_DECLARATION') {
      actions.push('Add detailed assessment notes');
    }

    if (this.props.supportingDocumentIds.length === 0) {
      actions.push('Attach supporting medical/legal documents');
    }

    if (this.getRiskLevel() === 'HIGH') {
      actions.push('Consider court determination of capacity');
    }

    return actions;
  }

  public toJSON(): Record<string, any> {
    return {
      status: this.props.status,
      declarationDate: this.props.declarationDate.toISOString(),
      assessedBy: this.props.assessedBy,
      assessmentNotes: this.props.assessmentNotes,
      supportingDocumentIds: this.props.supportingDocumentIds,
      isVoluntarilyMade: this.props.isVoluntarilyMade,
      isFreeFromUndueInfluence: this.props.isFreeFromUndueInfluence,
      isCompetent: this.isCompetent(),
      isLegallySufficient: this.isLegallySufficient(),
      riskLevel: this.getRiskLevel(),
      recommendedActions: this.getRecommendedActions(),
    };
  }

  // Static factory methods
  public static medicalCertification(
    doctorName: string,
    notes: string,
    documentIds: string[] = [],
  ): TestatorCapacityDeclaration {
    return new TestatorCapacityDeclaration({
      status: 'MEDICAL_CERTIFICATION',
      declarationDate: new Date(),
      assessedBy: doctorName,
      assessmentNotes: notes,
      supportingDocumentIds: documentIds,
      isVoluntarilyMade: true,
      isFreeFromUndueInfluence: true,
    });
  }

  public static selfDeclaration(documentIds: string[] = []): TestatorCapacityDeclaration {
    return new TestatorCapacityDeclaration({
      status: 'SELF_DECLARATION',
      declarationDate: new Date(),
      supportingDocumentIds: documentIds,
      isVoluntarilyMade: true,
      isFreeFromUndueInfluence: true,
    });
  }

  public static assessedCompetent(
    assessor: string,
    notes: string,
    documentIds: string[] = [],
  ): TestatorCapacityDeclaration {
    return new TestatorCapacityDeclaration({
      status: 'ASSESSED_COMPETENT',
      declarationDate: new Date(),
      assessedBy: assessor,
      assessmentNotes: notes,
      supportingDocumentIds: documentIds,
      isVoluntarilyMade: true,
      isFreeFromUndueInfluence: true,
    });
  }
}
