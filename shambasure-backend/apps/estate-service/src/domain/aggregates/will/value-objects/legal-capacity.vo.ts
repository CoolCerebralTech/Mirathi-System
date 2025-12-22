import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';

export class InvalidLegalCapacityException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_LEGAL_CAPACITY');
  }
}

export enum LegalCapacityStatus {
  PENDING_ASSESSMENT = 'PENDING_ASSESSMENT',
  ASSESSED_COMPETENT = 'ASSESSED_COMPETENT',
  ASSESSED_INCOMPETENT = 'ASSESSED_INCOMPETENT',
  MEDICAL_CERTIFICATION = 'MEDICAL_CERTIFICATION',
  COURT_DETERMINATION = 'COURT_DETERMINATION',
}

export enum CapacityAssessmentMethod {
  MEDICAL_EXAMINATION = 'MEDICAL_EXAMINATION',
  PSYCHIATRIC_EVALUATION = 'PSYCHIATRIC_EVALUATION',
  LEGAL_TEST = 'LEGAL_TEST',
  COURT_ORDER = 'COURT_ORDER',
  SELF_DECLARATION = 'SELF_DECLARATION',
}

interface LegalCapacityProps {
  status: LegalCapacityStatus;

  // Section 7(1) LSA Requirements
  understandsNatureOfWill: boolean;
  understandsExtentOfProperty: boolean;
  understandsClaimsOfDependants: boolean;
  isFreeFromUndueInfluence: boolean;

  // Section 7(2) LSA Age Requirement
  testatorAge: number;

  // Audit
  assessedBy?: string;
  assessedAt?: Date;
  method?: CapacityAssessmentMethod;
  notes?: string;
}

export class LegalCapacity extends ValueObject<LegalCapacityProps> {
  private constructor(props: LegalCapacityProps) {
    super(props);
  }

  protected validate(): void {
    if (this.props.testatorAge < 18) {
      throw new InvalidLegalCapacityException(
        'Testator must be at least 18 years old (Section 7(2) LSA)',
      );
    }

    if (this.props.status === LegalCapacityStatus.ASSESSED_COMPETENT) {
      if (
        !this.props.understandsNatureOfWill ||
        !this.props.understandsExtentOfProperty ||
        !this.props.understandsClaimsOfDependants ||
        !this.props.isFreeFromUndueInfluence
      ) {
        throw new InvalidLegalCapacityException('Cannot mark competent if legal tests fail');
      }
    }
  }

  // --- Factory Methods ---

  static createPending(testatorAge: number): LegalCapacity {
    return new LegalCapacity({
      status: LegalCapacityStatus.PENDING_ASSESSMENT,
      testatorAge,
      understandsNatureOfWill: false,
      understandsExtentOfProperty: false,
      understandsClaimsOfDependants: false,
      isFreeFromUndueInfluence: false,
    });
  }

  static createAssessed(
    testatorAge: number,
    findings: {
      understandsNature: boolean;
      understandsProperty: boolean;
      understandsDependants: boolean;
      isFree: boolean;
    },
    assessorId: string,
    method: CapacityAssessmentMethod,
    notes?: string,
  ): LegalCapacity {
    const isCompetent =
      findings.understandsNature &&
      findings.understandsProperty &&
      findings.understandsDependants &&
      findings.isFree;

    return new LegalCapacity({
      status: isCompetent
        ? LegalCapacityStatus.ASSESSED_COMPETENT
        : LegalCapacityStatus.ASSESSED_INCOMPETENT,
      testatorAge,
      understandsNatureOfWill: findings.understandsNature,
      understandsExtentOfProperty: findings.understandsProperty,
      understandsClaimsOfDependants: findings.understandsDependants,
      isFreeFromUndueInfluence: findings.isFree,
      assessedBy: assessorId,
      assessedAt: new Date(),
      method,
      notes,
    });
  }

  // --- Business Logic ---

  isCompetent(): boolean {
    return (
      this.props.status === LegalCapacityStatus.ASSESSED_COMPETENT ||
      this.props.status === LegalCapacityStatus.MEDICAL_CERTIFICATION ||
      this.props.status === LegalCapacityStatus.COURT_DETERMINATION
    );
  }

  // --- Getters ---
  get status(): LegalCapacityStatus {
    return this.props.status;
  }

  public toJSON(): Record<string, any> {
    return {
      status: this.props.status,
      isMinor: this.props.testatorAge < 18,
      testatorAge: this.props.testatorAge,
      assessment: {
        method: this.props.method,
        date: this.props.assessedAt,
        notes: this.props.notes,
      },
      competency: {
        nature: this.props.understandsNatureOfWill,
        property: this.props.understandsExtentOfProperty,
        dependants: this.props.understandsClaimsOfDependants,
        undueInfluence: !this.props.isFreeFromUndueInfluence, // Invert for clarity? No, keep raw
      },
    };
  }
}
