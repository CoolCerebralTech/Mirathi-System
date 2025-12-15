// domain/value-objects/legal/legal-capacity.vo.ts
import { ValueObject } from '../../base/value-object';

export type LegalCapacityStatus =
  | 'ASSESSED_COMPETENT'
  | 'ASSESSED_INCOMPETENT'
  | 'PENDING_ASSESSMENT'
  | 'MEDICAL_CERTIFICATION'
  | 'COURT_DETERMINATION'
  | 'SELF_DECLARATION';

export interface LegalCapacityProps {
  status: LegalCapacityStatus;
  assessmentDate: Date;
  assessedBy: string;
  assessorQualification: string;
  assessmentMethod: string;
  assessmentScore?: number;
  assessmentMaxScore?: number;
  isCompetent: boolean;
  competenceAreas: string[];
  limitations: string[];
  requiresSupportedDecisionMaking: boolean;
  supportedDecisionMakerId?: string;
  supportedDecisionMakerRole?: string;
  medicalCertificationId?: string;
  medicalCertificationDate?: Date;
  certifyingDoctor?: string;
  courtOrderNumber?: string;
  courtOrderDate?: Date;
  courtStation?: string;
  validUntil?: Date;
  reviewRequired: boolean;
  nextReviewDate?: Date;
  notes?: string;
}

export class LegalCapacity extends ValueObject<LegalCapacityProps> {
  private constructor(props: LegalCapacityProps) {
    super(props);
    this.validate();
  }

  static createCompetent(assessmentDate: Date, assessedBy: string): LegalCapacity {
    return new LegalCapacity({
      status: 'ASSESSED_COMPETENT',
      assessmentDate,
      assessedBy,
      assessorQualification: 'QUALIFIED_ASSESSOR',
      assessmentMethod: 'STANDARD_ASSESSMENT',
      isCompetent: true,
      competenceAreas: ['FINANCIAL', 'LEGAL', 'MEDICAL', 'PERSONAL'],
      limitations: [],
      requiresSupportedDecisionMaking: false,
      reviewRequired: true,
    });
  }

  static createFromProps(props: LegalCapacityProps): LegalCapacity {
    return new LegalCapacity(props);
  }

  validate(): void {
    if (!this._value.status) {
      throw new Error('Legal capacity status is required');
    }

    if (!this._value.assessmentDate) {
      throw new Error('Assessment date is required');
    }

    if (this._value.assessmentDate > new Date()) {
      throw new Error('Assessment date cannot be in the future');
    }

    if (!this._value.assessedBy || this._value.assessedBy.trim().length === 0) {
      throw new Error('Assessed by is required');
    }

    if (
      !this._value.assessorQualification ||
      this._value.assessorQualification.trim().length === 0
    ) {
      throw new Error('Assessor qualification is required');
    }

    if (!this._value.assessmentMethod || this._value.assessmentMethod.trim().length === 0) {
      throw new Error('Assessment method is required');
    }

    // Assessment score validation
    if (this._value.assessmentScore !== undefined) {
      if (this._value.assessmentScore < 0) {
        throw new Error('Assessment score cannot be negative');
      }

      if (
        this._value.assessmentMaxScore &&
        this._value.assessmentScore > this._value.assessmentMaxScore
      ) {
        throw new Error('Assessment score cannot exceed maximum score');
      }
    }

    // Status consistency validation
    if (this._value.status === 'ASSESSED_COMPETENT' && !this._value.isCompetent) {
      throw new Error('Status must be consistent with competence flag');
    }

    if (this._value.status === 'ASSESSED_INCOMPETENT' && this._value.isCompetent) {
      throw new Error('Status must be consistent with competence flag');
    }

    // Supported decision making validation
    if (this._value.requiresSupportedDecisionMaking && !this._value.supportedDecisionMakerId) {
      throw new Error('Supported decision maker ID is required when support is needed');
    }

    // Medical certification validation
    if (this._value.status === 'MEDICAL_CERTIFICATION') {
      if (!this._value.medicalCertificationId) {
        throw new Error('Medical certification ID is required for medical certification');
      }
      if (!this._value.medicalCertificationDate) {
        throw new Error('Medical certification date is required');
      }
      if (!this._value.certifyingDoctor) {
        throw new Error('Certifying doctor is required');
      }
    }

    // Court determination validation
    if (this._value.status === 'COURT_DETERMINATION') {
      if (!this._value.courtOrderNumber) {
        throw new Error('Court order number is required for court determination');
      }
      if (!this._value.courtOrderDate) {
        throw new Error('Court order date is required');
      }
      if (!this._value.courtStation) {
        throw new Error('Court station is required');
      }
    }

    // Valid until validation
    if (this._value.validUntil && this._value.validUntil <= this._value.assessmentDate) {
      throw new Error('Valid until date must be after assessment date');
    }

    // Review date validation
    if (this._value.reviewRequired && !this._value.nextReviewDate) {
      throw new Error('Next review date is required when review is required');
    }

    if (this._value.nextReviewDate && this._value.nextReviewDate <= this._value.assessmentDate) {
      throw new Error('Next review date must be after assessment date');
    }
  }

  updateStatus(
    status: LegalCapacityStatus,
    assessmentDate: Date,
    assessedBy: string,
    method: string,
  ): LegalCapacity {
    let isCompetent = this._value.isCompetent;

    // Update competence based on status
    if (status === 'ASSESSED_COMPETENT') {
      isCompetent = true;
    } else if (status === 'ASSESSED_INCOMPETENT') {
      isCompetent = false;
    }

    return new LegalCapacity({
      ...this._value,
      status,
      assessmentDate,
      assessedBy,
      assessmentMethod: method,
      isCompetent,
    });
  }

  recordAssessmentScore(score: number, maxScore: number): LegalCapacity {
    if (score < 0 || score > maxScore) {
      throw new Error('Score must be between 0 and maximum score');
    }

    return new LegalCapacity({
      ...this._value,
      assessmentScore: score,
      assessmentMaxScore: maxScore,
      isCompetent: score >= maxScore * 0.7, // 70% threshold for competence
    });
  }

  addCompetenceArea(area: string): LegalCapacity {
    const competenceAreas = [...this._value.competenceAreas, area];

    return new LegalCapacity({
      ...this._value,
      competenceAreas,
    });
  }

  removeCompetenceArea(area: string): LegalCapacity {
    const competenceAreas = this._value.competenceAreas.filter((a) => a !== area);

    return new LegalCapacity({
      ...this._value,
      competenceAreas,
    });
  }

  addLimitation(limitation: string): LegalCapacity {
    const limitations = [...this._value.limitations, limitation];

    return new LegalCapacity({
      ...this._value,
      limitations,
    });
  }

  removeLimitation(limitation: string): LegalCapacity {
    const limitations = this._value.limitations.filter((l) => l !== limitation);

    return new LegalCapacity({
      ...this._value,
      limitations,
    });
  }

  requireSupportedDecisionMaking(supporterId: string, supporterRole: string): LegalCapacity {
    return new LegalCapacity({
      ...this._value,
      requiresSupportedDecisionMaking: true,
      supportedDecisionMakerId: supporterId,
      supportedDecisionMakerRole: supporterRole,
    });
  }

  removeSupportedDecisionMaking(): LegalCapacity {
    return new LegalCapacity({
      ...this._value,
      requiresSupportedDecisionMaking: false,
      supportedDecisionMakerId: undefined,
      supportedDecisionMakerRole: undefined,
    });
  }

  addMedicalCertification(
    certificationId: string,
    certificationDate: Date,
    doctorName: string,
  ): LegalCapacity {
    return new LegalCapacity({
      ...this._value,
      status: 'MEDICAL_CERTIFICATION',
      medicalCertificationId: certificationId,
      medicalCertificationDate: certificationDate,
      certifyingDoctor: doctorName,
    });
  }

  addCourtDetermination(
    courtOrderNumber: string,
    courtOrderDate: Date,
    courtStation: string,
  ): LegalCapacity {
    return new LegalCapacity({
      ...this._value,
      status: 'COURT_DETERMINATION',
      courtOrderNumber,
      courtOrderDate,
      courtStation,
    });
  }

  setValidityPeriod(validUntil: Date): LegalCapacity {
    if (validUntil <= this._value.assessmentDate) {
      throw new Error('Valid until date must be after assessment date');
    }

    return new LegalCapacity({
      ...this._value,
      validUntil,
      reviewRequired: true,
      nextReviewDate: validUntil,
    });
  }

  scheduleReview(reviewDate: Date): LegalCapacity {
    if (reviewDate <= this._value.assessmentDate) {
      throw new Error('Review date must be after assessment date');
    }

    return new LegalCapacity({
      ...this._value,
      reviewRequired: true,
      nextReviewDate: reviewDate,
    });
  }

  updateNotes(notes: string): LegalCapacity {
    return new LegalCapacity({
      ...this._value,
      notes,
    });
  }

  get status(): LegalCapacityStatus {
    return this._value.status;
  }

  get assessmentDate(): Date {
    return this._value.assessmentDate;
  }

  get assessedBy(): string {
    return this._value.assessedBy;
  }

  get assessorQualification(): string {
    return this._value.assessorQualification;
  }

  get assessmentMethod(): string {
    return this._value.assessmentMethod;
  }

  get assessmentScore(): number | undefined {
    return this._value.assessmentScore;
  }

  get assessmentMaxScore(): number | undefined {
    return this._value.assessmentMaxScore;
  }

  get isCompetent(): boolean {
    return this._value.isCompetent;
  }

  get competenceAreas(): string[] {
    return [...this._value.competenceAreas];
  }

  // domain/value-objects/legal/legal-capacity.vo.ts (continued)

  get limitations(): string[] {
    return [...this._value.limitations];
  }

  get requiresSupportedDecisionMaking(): boolean {
    return this._value.requiresSupportedDecisionMaking;
  }

  get supportedDecisionMakerId(): string | undefined {
    return this._value.supportedDecisionMakerId;
  }

  get supportedDecisionMakerRole(): string | undefined {
    return this._value.supportedDecisionMakerRole;
  }

  get medicalCertificationId(): string | undefined {
    return this._value.medicalCertificationId;
  }

  get medicalCertificationDate(): Date | undefined {
    return this._value.medicalCertificationDate;
  }

  get certifyingDoctor(): string | undefined {
    return this._value.certifyingDoctor;
  }

  get courtOrderNumber(): string | undefined {
    return this._value.courtOrderNumber;
  }

  get courtOrderDate(): Date | undefined {
    return this._value.courtOrderDate;
  }

  get courtStation(): string | undefined {
    return this._value.courtStation;
  }

  get validUntil(): Date | undefined {
    return this._value.validUntil;
  }

  get reviewRequired(): boolean {
    return this._value.reviewRequired;
  }

  get nextReviewDate(): Date | undefined {
    return this._value.nextReviewDate;
  }

  get notes(): string | undefined {
    return this._value.notes;
  }

  // Check if legal capacity is currently valid
  get isValid(): boolean {
    if (this._value.validUntil && new Date() > this._value.validUntil) {
      return false;
    }
    return this._value.isCompetent || this._value.requiresSupportedDecisionMaking;
  }

  // Check if review is overdue
  get isReviewOverdue(): boolean {
    if (!this._value.reviewRequired || !this._value.nextReviewDate) {
      return false;
    }
    return new Date() > this._value.nextReviewDate;
  }

  // Get days until next review
  get daysUntilReview(): number | null {
    if (!this._value.nextReviewDate) return null;

    const now = new Date();
    const diffTime = this._value.nextReviewDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get assessment score percentage
  get assessmentScorePercentage(): number | null {
    if (
      this._value.assessmentScore === undefined ||
      this._value.assessmentMaxScore === undefined ||
      this._value.assessmentMaxScore === 0
    ) {
      return null;
    }

    return (this._value.assessmentScore / this._value.assessmentMaxScore) * 100;
  }

  // Check if person has capacity for specific area
  hasCapacityForArea(area: string): boolean {
    if (!this._value.isCompetent) return false;
    return this._value.competenceAreas.includes(area);
  }

  // Check if person can make a will (must be competent and have legal capacity)
  get canMakeWill(): boolean {
    return (
      this._value.isCompetent &&
      this.hasCapacityForArea('LEGAL') &&
      !this._value.requiresSupportedDecisionMaking
    );
  }

  // Check if person can marry (must be competent)
  get canMarry(): boolean {
    return this._value.isCompetent && this.hasCapacityForArea('PERSONAL');
  }

  // Check if person can enter into contracts
  get canEnterContracts(): boolean {
    return this._value.isCompetent && this.hasCapacityForArea('FINANCIAL');
  }

  // Get legal capacity status description
  get statusDescription(): string {
    switch (this._value.status) {
      case 'ASSESSED_COMPETENT':
        return 'Assessed as legally competent';
      case 'ASSESSED_INCOMPETENT':
        return 'Assessed as legally incompetent';
      case 'PENDING_ASSESSMENT':
        return 'Legal capacity assessment pending';
      case 'MEDICAL_CERTIFICATION':
        return 'Medical certification of capacity';
      case 'COURT_DETERMINATION':
        return 'Court determination of capacity';
      case 'SELF_DECLARATION':
        return 'Self-declaration of capacity';
      default:
        return 'Unknown capacity status';
    }
  }

  // Get authority that determined capacity
  get determiningAuthority(): string {
    switch (this._value.status) {
      case 'MEDICAL_CERTIFICATION':
        return `Medical certification by ${this._value.certifyingDoctor || 'doctor'}`;
      case 'COURT_DETERMINATION':
        return `Court order from ${this._value.courtStation || 'court'}`;
      case 'ASSESSED_COMPETENT':
      case 'ASSESSED_INCOMPETENT':
        return `Assessment by ${this._value.assessedBy} (${this._value.assessorQualification})`;
      default:
        return 'Self-declared';
    }
  }

  toJSON() {
    return {
      status: this._value.status,
      assessmentDate: this._value.assessmentDate.toISOString(),
      assessedBy: this._value.assessedBy,
      assessorQualification: this._value.assessorQualification,
      assessmentMethod: this._value.assessmentMethod,
      assessmentScore: this._value.assessmentScore,
      assessmentMaxScore: this._value.assessmentMaxScore,
      isCompetent: this._value.isCompetent,
      competenceAreas: this._value.competenceAreas,
      limitations: this._value.limitations,
      requiresSupportedDecisionMaking: this._value.requiresSupportedDecisionMaking,
      supportedDecisionMakerId: this._value.supportedDecisionMakerId,
      supportedDecisionMakerRole: this._value.supportedDecisionMakerRole,
      medicalCertificationId: this._value.medicalCertificationId,
      medicalCertificationDate: this._value.medicalCertificationDate?.toISOString(),
      certifyingDoctor: this._value.certifyingDoctor,
      courtOrderNumber: this._value.courtOrderNumber,
      courtOrderDate: this._value.courtOrderDate?.toISOString(),
      courtStation: this._value.courtStation,
      validUntil: this._value.validUntil?.toISOString(),
      reviewRequired: this._value.reviewRequired,
      nextReviewDate: this._value.nextReviewDate?.toISOString(),
      notes: this._value.notes,
      isValid: this.isValid,
      isReviewOverdue: this.isReviewOverdue,
      daysUntilReview: this.daysUntilReview,
      assessmentScorePercentage: this.assessmentScorePercentage,
      canMakeWill: this.canMakeWill,
      canMarry: this.canMarry,
      canEnterContracts: this.canEnterContracts,
      statusDescription: this.statusDescription,
      determiningAuthority: this.determiningAuthority,
    };
  }
}
