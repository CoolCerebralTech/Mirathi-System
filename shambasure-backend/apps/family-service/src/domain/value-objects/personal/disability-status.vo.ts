// domain/value-objects/personal/disability-status.vo.ts
import { ValueObject } from '../base/value-object';

export type DisabilityType =
  | 'NONE'
  | 'PHYSICAL'
  | 'VISUAL'
  | 'HEARING'
  | 'SPEECH'
  | 'INTELLECTUAL'
  | 'MENTAL_HEALTH'
  | 'MULTIPLE'
  | 'OTHER';

export interface DisabilityDetails {
  type: DisabilityType;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'PROFOUND';
  description?: string;
  onsetDate?: Date;
  diagnosedBy?: string;
  medicalCertificationId?: string;
  requiresAssistance: boolean;
  assistanceNeeds?: string[];
  mobilityAids?: string[];
}

export interface DisabilityStatusProps {
  hasDisability: boolean;
  disabilityCardNumber?: string; // National Council for Persons with Disabilities card
  registeredWithNCPWD: boolean;
  ncpwdRegistrationDate?: Date;
  disabilityDetails: DisabilityDetails[];
  functionalLimitations?: string[];
  requiresSupportedDecisionMaking: boolean;
  legalCapacityAssessed?: boolean;
  assessmentDate?: Date;
  assessorName?: string;
}

export class DisabilityStatus extends ValueObject<DisabilityStatusProps> {
  private constructor(props: DisabilityStatusProps) {
    super(props);
    this.validate();
  }

  static create(hasDisability: boolean = false): DisabilityStatus {
    return new DisabilityStatus({
      hasDisability,
      registeredWithNCPWD: false,
      disabilityDetails: [],
      requiresSupportedDecisionMaking: false,
    });
  }

  static createFromProps(props: DisabilityStatusProps): DisabilityStatus {
    return new DisabilityStatus(props);
  }

  validate(): void {
    // If hasDisability is false, other disability fields should not be present
    if (!this._value.hasDisability) {
      if (this._value.disabilityDetails.length > 0) {
        throw new Error('Cannot have disability details when hasDisability is false');
      }
      if (this._value.registeredWithNCPWD) {
        throw new Error('Cannot be registered with NCPWD when hasDisability is false');
      }
      if (this._value.requiresSupportedDecisionMaking) {
        throw new Error('Cannot require supported decision making when hasDisability is false');
      }
    }

    // Validate disability details
    for (const detail of this._value.disabilityDetails) {
      this.validateDisabilityDetail(detail);
    }

    // NCPWD registration validation
    if (this._value.registeredWithNCPWD) {
      if (!this._value.ncpwdRegistrationDate) {
        throw new Error('NCPWD registration date is required when registered');
      }
      if (this._value.ncpwdRegistrationDate > new Date()) {
        throw new Error('NCPWD registration date cannot be in the future');
      }
    }

    // Legal capacity assessment validation
    if (this._value.legalCapacityAssessed && !this._value.assessmentDate) {
      throw new Error('Assessment date is required when legal capacity is assessed');
    }

    if (this._value.assessmentDate && this._value.assessmentDate > new Date()) {
      throw new Error('Assessment date cannot be in the future');
    }
  }

  private validateDisabilityDetail(detail: DisabilityDetails): void {
    if (!detail.type) {
      throw new Error('Disability type is required');
    }

    if (!detail.severity) {
      throw new Error('Disability severity is required');
    }

    if (detail.onsetDate && detail.onsetDate > new Date()) {
      throw new Error('Onset date cannot be in the future');
    }

    if (detail.requiresAssistance === undefined) {
      throw new Error('Requires assistance flag is required');
    }
  }

  addDisability(detail: DisabilityDetails): DisabilityStatus {
    this.validateDisabilityDetail(detail);

    return new DisabilityStatus({
      ...this._value,
      hasDisability: true,
      disabilityDetails: [...this._value.disabilityDetails, detail],
    });
  }

  updateDisability(index: number, detail: DisabilityDetails): DisabilityStatus {
    this.validateDisabilityDetail(detail);

    const disabilityDetails = [...this._value.disabilityDetails];
    disabilityDetails[index] = detail;

    return new DisabilityStatus({
      ...this._value,
      disabilityDetails,
    });
  }

  removeDisability(index: number): DisabilityStatus {
    const disabilityDetails = this._value.disabilityDetails.filter((_, i) => i !== index);

    return new DisabilityStatus({
      ...this._value,
      hasDisability: disabilityDetails.length > 0,
      disabilityDetails,
    });
  }

  registerWithNCPWD(cardNumber: string, registrationDate: Date): DisabilityStatus {
    if (!this._value.hasDisability) {
      throw new Error('Cannot register with NCPWD without a disability');
    }

    return new DisabilityStatus({
      ...this._value,
      disabilityCardNumber: cardNumber,
      registeredWithNCPWD: true,
      ncpwdRegistrationDate: registrationDate,
    });
  }

  unregisterFromNCPWD(): DisabilityStatus {
    return new DisabilityStatus({
      ...this._value,
      disabilityCardNumber: undefined,
      registeredWithNCPWD: false,
      ncpwdRegistrationDate: undefined,
    });
  }

  setSupportedDecisionMaking(requires: boolean): DisabilityStatus {
    if (requires && !this._value.hasDisability) {
      throw new Error('Cannot require supported decision making without a disability');
    }

    return new DisabilityStatus({
      ...this._value,
      requiresSupportedDecisionMaking: requires,
    });
  }

  recordLegalCapacityAssessment(
    assessed: boolean,
    assessmentDate: Date,
    assessorName?: string,
  ): DisabilityStatus {
    if (assessed && !this._value.hasDisability) {
      throw new Error('Cannot assess legal capacity without a disability');
    }

    return new DisabilityStatus({
      ...this._value,
      legalCapacityAssessed: assessed,
      assessmentDate,
      assessorName,
    });
  }

  get hasDisability(): boolean {
    return this._value.hasDisability;
  }

  get disabilityCardNumber(): string | undefined {
    return this._value.disabilityCardNumber;
  }

  get registeredWithNCPWD(): boolean {
    return this._value.registeredWithNCPWD;
  }

  get ncpwdRegistrationDate(): Date | undefined {
    return this._value.ncpwdRegistrationDate;
  }

  get disabilityDetails(): DisabilityDetails[] {
    return [...this._value.disabilityDetails];
  }

  get functionalLimitations(): string[] {
    return [...(this._value.functionalLimitations || [])];
  }

  get requiresSupportedDecisionMaking(): boolean {
    return this._value.requiresSupportedDecisionMaking;
  }

  get legalCapacityAssessed(): boolean | undefined {
    return this._value.legalCapacityAssessed;
  }

  get assessmentDate(): Date | undefined {
    return this._value.assessmentDate;
  }

  get assessorName(): string | undefined {
    return this._value.assessorName;
  }

  // Get primary disability (first in list)
  get primaryDisability(): DisabilityDetails | undefined {
    return this._value.disabilityDetails[0];
  }

  // Check if person has severe disability (for S.29 dependency)
  get hasSevereDisability(): boolean {
    return this._value.disabilityDetails.some(
      (detail) => detail.severity === 'SEVERE' || detail.severity === 'PROFOUND',
    );
  }

  // Check if disability affects inheritance capacity
  get affectsInheritanceCapacity(): boolean {
    return (
      this._value.requiresSupportedDecisionMaking ||
      this.hasSevereDisability ||
      this._value.legalCapacityAssessed === false
    );
  }

  // Check if person qualifies for S.29 dependency due to disability
  get qualifiesForDependantStatus(): boolean {
    return (
      this._value.hasDisability &&
      (this.hasSevereDisability || this._value.requiresSupportedDecisionMaking)
    );
  }

  // Get years since disability onset
  get disabilityDuration(): number | null {
    const earliestOnset = this._value.disabilityDetails.reduce(
      (earliest, detail) => {
        if (!detail.onsetDate) return earliest;
        return earliest
          ? new Date(Math.min(earliest.getTime(), detail.onsetDate.getTime()))
          : detail.onsetDate;
      },
      null as Date | null,
    );

    if (!earliestOnset) return null;

    const now = new Date();
    const diffYears = now.getFullYear() - earliestOnset.getFullYear();
    return diffYears;
  }

  // Check if person needs mobility assistance
  get needsMobilityAssistance(): boolean {
    return this._value.disabilityDetails.some(
      (detail) =>
        detail.type === 'PHYSICAL' &&
        detail.requiresAssistance &&
        detail.mobilityAids &&
        detail.mobilityAids.length > 0,
    );
  }

  toJSON() {
    return {
      hasDisability: this._value.hasDisability,
      disabilityCardNumber: this._value.disabilityCardNumber,
      registeredWithNCPWD: this._value.registeredWithNCPWD,
      ncpwdRegistrationDate: this._value.ncpwdRegistrationDate?.toISOString(),
      disabilityDetails: this._value.disabilityDetails,
      functionalLimitations: this._value.functionalLimitations,
      requiresSupportedDecisionMaking: this._value.requiresSupportedDecisionMaking,
      legalCapacityAssessed: this._value.legalCapacityAssessed,
      assessmentDate: this._value.assessmentDate?.toISOString(),
      assessorName: this._value.assessorName,
      primaryDisability: this.primaryDisability,
      hasSevereDisability: this.hasSevereDisability,
      affectsInheritanceCapacity: this.affectsInheritanceCapacity,
      qualifiesForDependantStatus: this.qualifiesForDependantStatus,
      disabilityDuration: this.disabilityDuration,
      needsMobilityAssistance: this.needsMobilityAssistance,
    };
  }
}
