import { ValueObject } from '../../../base/value-object';
import { Result, combine } from '../../../core/result';

export enum LegalCapacityStatus {
  ASSESSED_COMPETENT = 'ASSESSED_COMPETENT',
  ASSESSED_INCOMPETENT = 'ASSESSED_INCOMPETENT',
  PENDING_ASSESSMENT = 'PENDING_ASSESSMENT',
  MEDICAL_CERTIFICATION = 'MEDICAL_CERTIFICATION',
  COURT_DETERMINATION = 'COURT_DETERMINATION',
  SELF_DECLARATION = 'SELF_DECLARATION',
}

export enum CapacityAssessmentMethod {
  MEDICAL_EXAMINATION = 'MEDICAL_EXAMINATION',
  PSYCHIATRIC_EVALUATION = 'PSYCHIATRIC_EVALUATION',
  LEGAL_TEST = 'LEGAL_TEST',
  VIDEO_RECORDING = 'VIDEO_RECORDING',
  WITNESS_AFFIDAVIT = 'WITNESS_AFFIDAVIT',
  COURT_ORDER = 'COURT_ORDER',
  SELF_DECLARATION = 'SELF_DECLARATION',
}

interface LegalCapacityProps {
  // Core Status
  status: LegalCapacityStatus;

  // Assessment Details (Section 7 LSA requirements)
  assessedBy?: string; // User ID of assessor
  assessedAt?: Date;
  assessmentMethod?: CapacityAssessmentMethod;
  assessmentNotes?: string;

  // Medical Certification
  medicalPractitionerName?: string;
  medicalPractitionerLicense?: string;
  medicalCertificateDate?: Date;
  medicalFindings?: string;

  // Legal Requirements (Section 7(1) LSA)
  understandsNatureOfWill: boolean;
  understandsExtentOfProperty: boolean;
  understandsClaimsOfDependants: boolean;
  isFreeFromUndueInfluence: boolean;

  // Supporting Evidence
  supportingDocumentIds: string[];
  witnessStatements: string[]; // IDs of witness statements

  // Age Validation (Section 7(2) LSA)
  testatorAge: number;
  isMinor: boolean; // Must be ≥ 18

  // Special Circumstances
  hasMentalIllness: boolean;
  hasCognitiveImpairment: boolean;
  isUnderMedication: boolean;
  medicationAffectsJudgment: boolean;

  // Court Involvement
  courtCaseNumber?: string;
  courtOrderDate?: Date;
  courtStation?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export class LegalCapacity extends ValueObject<LegalCapacityProps> {
  get status(): LegalCapacityStatus {
    return this.props.status;
  }
  get isMinor(): boolean {
    return this.props.isMinor;
  }
  get understandsNatureOfWill(): boolean {
    return this.props.understandsNatureOfWill;
  }
  get testatorAge(): number {
    return this.props.testatorAge;
  }
  get assessedAt(): Date | undefined {
    return this.props.assessedAt;
  }

  private constructor(props: LegalCapacityProps) {
    super(props);
  }

  /**
   * Creates a new LegalCapacity assessment
   */
  public static create(props: Partial<LegalCapacityProps>): Result<LegalCapacity> {
    const defaultProps: LegalCapacityProps = {
      status: LegalCapacityStatus.PENDING_ASSESSMENT,
      understandsNatureOfWill: false,
      understandsExtentOfProperty: false,
      understandsClaimsOfDependants: false,
      isFreeFromUndueInfluence: false,
      testatorAge: 0,
      isMinor: false,
      hasMentalIllness: false,
      hasCognitiveImpairment: false,
      isUnderMedication: false,
      medicationAffectsJudgment: false,
      supportingDocumentIds: [],
      witnessStatements: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const finalProps = { ...defaultProps, ...props };

    const validationResult = this.validateCapacity(finalProps);
    if (validationResult.isFailure) {
      return Result.fail<LegalCapacity>(validationResult.getErrorValue());
    }

    return Result.ok<LegalCapacity>(new LegalCapacity(finalProps));
  }

  /**
   * Validates legal capacity requirements per Section 7 LSA
   */
  private static validateCapacity(props: LegalCapacityProps): Result<void> {
    const errors: string[] = [];

    // Age requirement (Section 7(2))
    if (props.testatorAge < 18) {
      props.isMinor = true;
      errors.push('Testator must be at least 18 years old to make a will');
    }

    // For ASSESSED_COMPETENT status, all understanding flags must be true
    if (props.status === LegalCapacityStatus.ASSESSED_COMPETENT) {
      if (!props.understandsNatureOfWill) {
        errors.push('Must understand nature of will to be assessed competent');
      }
      if (!props.understandsExtentOfProperty) {
        errors.push('Must understand extent of property to be assessed competent');
      }
      if (!props.understandsClaimsOfDependants) {
        errors.push('Must understand claims of dependants to be assessed competent');
      }
      if (!props.isFreeFromUndueInfluence) {
        errors.push('Must be free from undue influence to be assessed competent');
      }
    }

    // Medical certification validation
    if (props.status === LegalCapacityStatus.MEDICAL_CERTIFICATION) {
      if (!props.medicalPractitionerName || !props.medicalCertificateDate) {
        errors.push('Medical certification requires practitioner name and certificate date');
      }
    }

    // Court determination validation
    if (props.status === LegalCapacityStatus.COURT_DETERMINATION) {
      if (!props.courtCaseNumber || !props.courtOrderDate) {
        errors.push('Court determination requires case number and order date');
      }
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    return Result.ok();
  }

  /**
   * Assesses legal capacity with detailed evaluation
   */
  public assessCapacity(
    assessorId: string,
    method: CapacityAssessmentMethod,
    findings: {
      understandsNatureOfWill: boolean;
      understandsExtentOfProperty: boolean;
      understandsClaimsOfDependants: boolean;
      isFreeFromUndueInfluence: boolean;
    },
    notes?: string,
  ): Result<void> {
    if (this.props.status !== LegalCapacityStatus.PENDING_ASSESSMENT) {
      return Result.fail('Capacity has already been assessed');
    }

    // Update properties
    this.props.assessedBy = assessorId;
    this.props.assessedAt = new Date();
    this.props.assessmentMethod = method;
    this.props.assessmentNotes = notes;
    this.props.understandsNatureOfWill = findings.understandsNatureOfWill;
    this.props.understandsExtentOfProperty = findings.understandsExtentOfProperty;
    this.props.understandsClaimsOfDependants = findings.understandsClaimsOfDependants;
    this.props.isFreeFromUndueInfluence = findings.isFreeFromUndueInfluence;
    this.props.updatedAt = new Date();

    // Determine status based on findings
    if (
      findings.understandsNatureOfWill &&
      findings.understandsExtentOfProperty &&
      findings.understandsClaimsOfDependants &&
      findings.isFreeFromUndueInfluence
    ) {
      this.props.status = LegalCapacityStatus.ASSESSED_COMPETENT;
    } else {
      this.props.status = LegalCapacityStatus.ASSESSED_INCOMPETENT;
    }

    return Result.ok();
  }

  /**
   * Adds medical certification
   */
  public addMedicalCertification(
    practitionerName: string,
    licenseNumber: string,
    findings: string,
  ): Result<void> {
    if (this.props.status === LegalCapacityStatus.COURT_DETERMINATION) {
      return Result.fail('Cannot add medical certification after court determination');
    }

    this.props.medicalPractitionerName = practitionerName;
    this.props.medicalPractitionerLicense = licenseNumber;
    this.props.medicalCertificateDate = new Date();
    this.props.medicalFindings = findings;
    this.props.status = LegalCapacityStatus.MEDICAL_CERTIFICATION;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Adds court determination
   */
  public addCourtDetermination(
    caseNumber: string,
    courtStation: string,
    orderDate: Date,
  ): Result<void> {
    this.props.courtCaseNumber = caseNumber;
    this.props.courtStation = courtStation;
    this.props.courtOrderDate = orderDate;
    this.props.status = LegalCapacityStatus.COURT_DETERMINATION;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Checks if testator has legal capacity to make a will (Section 7 LSA)
   */
  public hasLegalCapacity(): boolean {
    // Minors cannot make wills (Section 7(2))
    if (this.props.isMinor) {
      return false;
    }

    // Check status
    switch (this.props.status) {
      case LegalCapacityStatus.ASSESSED_COMPETENT:
      case LegalCapacityStatus.MEDICAL_CERTIFICATION:
      case LegalCapacityStatus.COURT_DETERMINATION:
      case LegalCapacityStatus.SELF_DECLARATION:
        return true;

      case LegalCapacityStatus.ASSESSED_INCOMPETENT:
      case LegalCapacityStatus.PENDING_ASSESSMENT:
      default:
        return false;
    }
  }

  /**
   * Gets a summary of capacity assessment
   */
  public getAssessmentSummary(): string {
    const statusMap = {
      [LegalCapacityStatus.ASSESSED_COMPETENT]: 'Legally competent',
      [LegalCapacityStatus.ASSESSED_INCOMPETENT]: 'Legally incompetent',
      [LegalCapacityStatus.MEDICAL_CERTIFICATION]: 'Medically certified competent',
      [LegalCapacityStatus.COURT_DETERMINATION]: 'Court determined competent',
      [LegalCapacityStatus.SELF_DECLARATION]: 'Self-declared competent',
      [LegalCapacityStatus.PENDING_ASSESSMENT]: 'Pending assessment',
    };

    const issues: string[] = [];

    if (!this.props.understandsNatureOfWill) issues.push('Does not understand nature of will');
    if (!this.props.understandsExtentOfProperty)
      issues.push('Does not understand extent of property');
    if (!this.props.understandsClaimsOfDependants)
      issues.push('Does not understand dependant claims');
    if (!this.props.isFreeFromUndueInfluence) issues.push('Potential undue influence');
    if (this.props.hasMentalIllness) issues.push('Mental illness present');
    if (this.props.hasCognitiveImpairment) issues.push('Cognitive impairment present');

    const summary = `Status: ${statusMap[this.props.status]}`;
    if (issues.length > 0) {
      return `${summary}. Issues: ${issues.join(', ')}`;
    }

    return summary;
  }

  /**
   * Adds supporting document
   */
  public addSupportingDocument(documentId: string): void {
    if (!this.props.supportingDocumentIds.includes(documentId)) {
      this.props.supportingDocumentIds.push(documentId);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Adds witness statement
   */
  public addWitnessStatement(statementId: string): void {
    if (!this.props.witnessStatements.includes(statementId)) {
      this.props.witnessStatements.push(statementId);
      this.props.updatedAt = new Date();
    }
  }
}
