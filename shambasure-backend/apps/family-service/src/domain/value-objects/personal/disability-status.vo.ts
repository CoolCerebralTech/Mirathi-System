// domain/value-objects/personal/disability-status.vo.ts
import { ValueObject } from '../../base/value-object';

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

  static createFromJSON(data: any): DisabilityStatus | undefined {
    if (!data) return undefined;

    return new DisabilityStatus({
      hasDisability: data.hasDisability || false,
      disabilityCardNumber: data.disabilityCardNumber,
      registeredWithNCPWD: data.registeredWithNCPWD || false,
      ncpwdRegistrationDate: data.ncpwdRegistrationDate
        ? new Date(data.ncpwdRegistrationDate)
        : undefined,
      disabilityDetails: (data.disabilityDetails || []).map((detail: any) => ({
        type: detail.type,
        severity: detail.severity,
        description: detail.description,
        onsetDate: detail.onsetDate ? new Date(detail.onsetDate) : undefined,
        diagnosedBy: detail.diagnosedBy,
        medicalCertificationId: detail.medicalCertificationId,
        requiresAssistance: detail.requiresAssistance || false,
        assistanceNeeds: detail.assistanceNeeds,
        mobilityAids: detail.mobilityAids,
      })),
      functionalLimitations: data.functionalLimitations,
      requiresSupportedDecisionMaking: data.requiresSupportedDecisionMaking || false,
      legalCapacityAssessed: data.legalCapacityAssessed,
      assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : undefined,
      assessorName: data.assessorName,
    });
  }

  // Factory method for creating from Prisma string status
  static createFromPrismaStatus(
    disabilityStatus?: string,
    requiresSupportedDecisionMaking: boolean = false,
    disabilityCertificate?: string,
  ): DisabilityStatus | undefined {
    if (!disabilityStatus || disabilityStatus === 'NONE') {
      if (requiresSupportedDecisionMaking) {
        const status = DisabilityStatus.create(false);
        return status.setSupportedDecisionMaking(true);
      }
      return undefined;
    }

    // Map Prisma string to DisabilityType
    const disabilityType = this.mapPrismaToDisabilityType(disabilityStatus);

    const disabilityDetail: DisabilityDetails = {
      type: disabilityType,
      severity: 'MODERATE', // Default severity
      requiresAssistance: requiresSupportedDecisionMaking,
    };

    let status = DisabilityStatus.create(true);
    status = status.addDisability(disabilityDetail);

    if (disabilityCertificate) {
      status = status.registerWithNCPWD(disabilityCertificate, new Date());
    }

    if (requiresSupportedDecisionMaking) {
      status = status.setSupportedDecisionMaking(true);
    }

    return status;
  }

  private static mapPrismaToDisabilityType(prismaStatus: string): DisabilityType {
    // Map Prisma disability status strings to our DisabilityType
    const statusMap: Record<string, DisabilityType> = {
      PHYSICAL: 'PHYSICAL',
      MENTAL: 'MENTAL_HEALTH',
      BOTH: 'MULTIPLE',
      VISUAL: 'VISUAL',
      HEARING: 'HEARING',
      SPEECH: 'SPEECH',
      INTELLECTUAL: 'INTELLECTUAL',
      MULTIPLE: 'MULTIPLE',
    };

    return statusMap[prismaStatus] || 'OTHER';
  }

  // Get a simplified status for Prisma storage
  get prismaStatus(): string {
    if (!this._value.hasDisability) return 'NONE';

    const details = this._value.disabilityDetails;
    if (details.length === 0) return 'NONE';

    // Check for multiple types
    const hasPhysical = details.some(
      (d) =>
        d.type === 'PHYSICAL' || d.type === 'VISUAL' || d.type === 'HEARING' || d.type === 'SPEECH',
    );

    const hasMental = details.some((d) => d.type === 'MENTAL_HEALTH' || d.type === 'INTELLECTUAL');

    if (hasPhysical && hasMental) return 'BOTH';
    if (hasPhysical) return 'PHYSICAL';
    if (hasMental) return 'MENTAL';

    // Default to first type
    return details[0].type;
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

  // Get status for mapper (computed from disability details)
  get status(): string {
    return this.prismaStatus;
  }

  toJSON() {
    return {
      hasDisability: this._value.hasDisability,
      disabilityCardNumber: this._value.disabilityCardNumber,
      registeredWithNCPWD: this._value.registeredWithNCPWD,
      ncpwdRegistrationDate: this._value.ncpwdRegistrationDate?.toISOString(),
      disabilityDetails: this._value.disabilityDetails.map((detail) => ({
        ...detail,
        onsetDate: detail.onsetDate?.toISOString(),
      })),
      functionalLimitations: this._value.functionalLimitations,
      requiresSupportedDecisionMaking: this._value.requiresSupportedDecisionMaking,
      legalCapacityAssessed: this._value.legalCapacityAssessed,
      assessmentDate: this._value.assessmentDate?.toISOString(),
      assessorName: this._value.assessorName,
      primaryDisability: this.primaryDisability
        ? {
            ...this.primaryDisability,
            onsetDate: this.primaryDisability.onsetDate?.toISOString(),
          }
        : undefined,
      hasSevereDisability: this.hasSevereDisability,
      affectsInheritanceCapacity: this.affectsInheritanceCapacity,
      qualifiesForDependantStatus: this.qualifiesForDependantStatus,
      disabilityDuration: this.disabilityDuration,
      needsMobilityAssistance: this.needsMobilityAssistance,
      status: this.status,
      prismaStatus: this.prismaStatus,
    };
  }
}
