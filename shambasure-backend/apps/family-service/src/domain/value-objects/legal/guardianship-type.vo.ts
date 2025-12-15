// domain/value-objects/legal/guardianship-type.vo.ts
import { ValueObject } from '../../base/value-object';
import { KenyanLawSection } from './kenyan-law-section.vo';

export type GuardianshipType = 'TESTAMENTARY' | 'COURT_APPOINTED' | 'NATURAL_PARENT' | 'DE_FACTO';

export type GuardianshipAppointmentSource = 'FAMILY' | 'COURT' | 'WILL' | 'CUSTOMARY_LAW';
type GuardianshipPower =
  | 'manage property'
  | 'medical consent'
  | 'education consent'
  | 'marriage consent';

type ComplianceRequirement = 'bond posting' | 'court approval' | 'annual reporting';
export interface GuardianshipTypeProps {
  type: GuardianshipType;
  appointmentSource: GuardianshipAppointmentSource;
  description: string;
  applicableSections: KenyanLawSection[];
  requiresBond: boolean;
  bondAmountKES?: number;
  requiresCourtApproval: boolean;
  courtApprovalObtained: boolean;
  courtOrderNumber?: string;
  courtOrderDate?: Date;
  hasAnnualReporting: boolean;
  reportingFrequencyMonths: number;
  nextReportDue?: Date;
  canManageProperty: boolean;
  canConsentToMedical: boolean;
  canConsentToMarriage: boolean;
  canConsentToEducation: boolean;
  hasLimitations: boolean;
  limitations?: string[];
  isTemporary: boolean;
  validUntil?: Date;
  canBeTerminatedBy: string[];
}

export class GuardianshipTypeVO extends ValueObject<GuardianshipTypeProps> {
  private constructor(props: GuardianshipTypeProps) {
    super(props);
    this.validate();
  }

  static create(type: GuardianshipType): GuardianshipTypeVO {
    const details = this.getGuardianshipDetails(type);

    return new GuardianshipTypeVO({
      type,
      appointmentSource: details.appointmentSource,
      description: details.description,
      applicableSections: details.applicableSections,
      requiresBond: details.requiresBond,
      requiresCourtApproval: details.requiresCourtApproval,
      courtApprovalObtained: false,
      hasAnnualReporting: details.hasAnnualReporting,
      reportingFrequencyMonths: details.reportingFrequencyMonths,
      canManageProperty: details.canManageProperty,
      canConsentToMedical: details.canConsentToMedical,
      canConsentToMarriage: details.canConsentToMarriage,
      canConsentToEducation: details.canConsentToEducation,
      hasLimitations: details.hasLimitations,
      limitations: details.limitations,
      isTemporary: details.isTemporary,
      canBeTerminatedBy: details.canBeTerminatedBy,
    });
  }

  static createFromProps(props: GuardianshipTypeProps): GuardianshipTypeVO {
    return new GuardianshipTypeVO(props);
  }

  private static getGuardianshipDetails(type: GuardianshipType): {
    appointmentSource: GuardianshipAppointmentSource;
    description: string;
    applicableSections: KenyanLawSection[];
    requiresBond: boolean;
    requiresCourtApproval: boolean;
    hasAnnualReporting: boolean;
    reportingFrequencyMonths: number;
    canManageProperty: boolean;
    canConsentToMedical: boolean;
    canConsentToMarriage: boolean;
    canConsentToEducation: boolean;
    hasLimitations: boolean;
    limitations: string[];
    isTemporary: boolean;
    canBeTerminatedBy: string[];
  } {
    const details: Record<GuardianshipType, ReturnType<typeof this.getGuardianshipDetails>> = {
      TESTAMENTARY: {
        appointmentSource: 'WILL',
        description: 'Appointed by will of deceased parent (S.70 LSA)',
        applicableSections: [KenyanLawSection.create('S70_TESTAMENTARY_GUARDIAN')],
        requiresBond: true,
        requiresCourtApproval: true,
        hasAnnualReporting: true,
        reportingFrequencyMonths: 12,
        canManageProperty: true,
        canConsentToMedical: true,
        canConsentToMarriage: false,
        canConsentToEducation: true,
        hasLimitations: true,
        limitations: ['Must act in best interest of child', 'Subject to court supervision'],
        isTemporary: false,
        canBeTerminatedBy: ['COURT', 'WARD_TURNING_18'],
      },
      COURT_APPOINTED: {
        appointmentSource: 'COURT',
        description: 'Appointed by court order (S.71 LSA)',
        applicableSections: [
          KenyanLawSection.create('S71_COURT_GUARDIAN'),
          KenyanLawSection.create('S72_GUARDIAN_BOND'),
          KenyanLawSection.create('S73_GUARDIAN_ACCOUNTS'),
        ],
        requiresBond: true,
        requiresCourtApproval: true,
        hasAnnualReporting: true,
        reportingFrequencyMonths: 12,
        canManageProperty: true,
        canConsentToMedical: true,
        canConsentToMarriage: false,
        canConsentToEducation: true,
        hasLimitations: true,
        limitations: ['Subject to court orders', 'Must file annual accounts'],
        isTemporary: false,
        canBeTerminatedBy: ['COURT', 'WARD_TURNING_18'],
      },
      NATURAL_PARENT: {
        appointmentSource: 'FAMILY',
        description: 'Natural parent with custody rights',
        applicableSections: [],
        requiresBond: false,
        requiresCourtApproval: false,
        hasAnnualReporting: false,
        reportingFrequencyMonths: 0,
        canManageProperty: true,
        canConsentToMedical: true,
        canConsentToMarriage: false,
        canConsentToEducation: true,
        hasLimitations: false,
        limitations: [],
        isTemporary: false,
        canBeTerminatedBy: ['COURT', 'WARD_TURNING_18', 'OTHER_PARENT'],
      },
      DE_FACTO: {
        appointmentSource: 'FAMILY',
        description: 'Acting guardian pending formal appointment',
        applicableSections: [],
        requiresBond: false,
        requiresCourtApproval: false,
        hasAnnualReporting: false,
        reportingFrequencyMonths: 0,
        canManageProperty: false,
        canConsentToMedical: true,
        canConsentToMarriage: false,
        canConsentToEducation: true,
        hasLimitations: true,
        limitations: ['Cannot manage property', 'Temporary arrangement'],
        isTemporary: true,
        canBeTerminatedBy: ['COURT', 'FORMAL_GUARDIAN_APPOINTED'],
      },
    };

    return details[type];
  }

  validate(): void {
    if (!this._value.type) {
      throw new Error('Guardianship type is required');
    }

    if (!this._value.appointmentSource) {
      throw new Error('Appointment source is required');
    }

    if (!this._value.description || this._value.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    // Bond validation
    if (this._value.requiresBond && !this._value.bondAmountKES) {
      throw new Error('Bond amount is required when bond is required');
    }

    if (this._value.bondAmountKES && this._value.bondAmountKES <= 0) {
      throw new Error('Bond amount must be positive');
    }

    // Court approval validation
    if (this._value.requiresCourtApproval && this._value.courtApprovalObtained) {
      if (!this._value.courtOrderNumber) {
        throw new Error('Court order number is required when court approval is obtained');
      }
      if (!this._value.courtOrderDate) {
        throw new Error('Court order date is required when court approval is obtained');
      }
    }

    // Reporting validation
    if (this._value.hasAnnualReporting) {
      if (this._value.reportingFrequencyMonths <= 0) {
        throw new Error('Reporting frequency must be positive when reporting is required');
      }
      if (!this._value.nextReportDue) {
        console.warn('Next report due date should be set for guardianships with reporting');
      }
    }

    // Limitations validation
    if (
      this._value.hasLimitations &&
      (!this._value.limitations || this._value.limitations.length === 0)
    ) {
      throw new Error('Limitations are required when guardianship has limitations');
    }

    // Temporary guardianship validation
    if (this._value.isTemporary && !this._value.validUntil) {
      throw new Error('Valid until date is required for temporary guardianships');
    }

    if (this._value.validUntil && this._value.validUntil <= new Date()) {
      throw new Error('Valid until date must be in the future');
    }

    // Termination validation
    if (!this._value.canBeTerminatedBy || this._value.canBeTerminatedBy.length === 0) {
      throw new Error('Termination conditions are required');
    }
  }

  setBondAmount(amountKES: number): GuardianshipTypeVO {
    if (amountKES <= 0) {
      throw new Error('Bond amount must be positive');
    }

    return new GuardianshipTypeVO({
      ...this._value,
      requiresBond: true,
      bondAmountKES: amountKES,
    });
  }

  grantCourtApproval(courtOrderNumber: string, courtOrderDate: Date): GuardianshipTypeVO {
    if (!this._value.requiresCourtApproval) {
      throw new Error('Court approval is not required for this guardianship type');
    }

    return new GuardianshipTypeVO({
      ...this._value,
      courtApprovalObtained: true,
      courtOrderNumber,
      courtOrderDate,
    });
  }

  setReportingSchedule(frequencyMonths: number, nextReportDue: Date): GuardianshipTypeVO {
    if (frequencyMonths <= 0) {
      throw new Error('Reporting frequency must be positive');
    }

    if (nextReportDue <= new Date()) {
      throw new Error('Next report due date must be in the future');
    }

    return new GuardianshipTypeVO({
      ...this._value,
      hasAnnualReporting: true,
      reportingFrequencyMonths: frequencyMonths,
      nextReportDue,
    });
  }

  addLimitation(limitation: string): GuardianshipTypeVO {
    const limitations = [...(this._value.limitations || []), limitation];

    return new GuardianshipTypeVO({
      ...this._value,
      hasLimitations: true,
      limitations,
    });
  }

  removeLimitation(limitation: string): GuardianshipTypeVO {
    const limitations = (this._value.limitations || []).filter((l) => l !== limitation);

    return new GuardianshipTypeVO({
      ...this._value,
      limitations,
      hasLimitations: limitations.length > 0,
    });
  }

  makeTemporary(validUntil: Date): GuardianshipTypeVO {
    if (validUntil <= new Date()) {
      throw new Error('Valid until date must be in the future');
    }

    return new GuardianshipTypeVO({
      ...this._value,
      isTemporary: true,
      validUntil,
    });
  }

  makePermanent(): GuardianshipTypeVO {
    return new GuardianshipTypeVO({
      ...this._value,
      isTemporary: false,
      validUntil: undefined,
    });
  }

  addTerminationCondition(condition: string): GuardianshipTypeVO {
    const canBeTerminatedBy = [...this._value.canBeTerminatedBy, condition];

    return new GuardianshipTypeVO({
      ...this._value,
      canBeTerminatedBy,
    });
  }

  updatePowers(
    canManageProperty: boolean,
    canConsentToMedical: boolean,
    canConsentToMarriage: boolean,
    canConsentToEducation: boolean,
  ): GuardianshipTypeVO {
    return new GuardianshipTypeVO({
      ...this._value,
      canManageProperty,
      canConsentToMedical,
      canConsentToMarriage,
      canConsentToEducation,
    });
  }

  get type(): GuardianshipType {
    return this._value.type;
  }

  get appointmentSource(): GuardianshipAppointmentSource {
    return this._value.appointmentSource;
  }

  get description(): string {
    return this._value.description;
  }

  get applicableSections(): KenyanLawSection[] {
    return [...this._value.applicableSections];
  }

  get requiresBond(): boolean {
    return this._value.requiresBond;
  }

  get bondAmountKES(): number | undefined {
    return this._value.bondAmountKES;
  }

  get requiresCourtApproval(): boolean {
    return this._value.requiresCourtApproval;
  }

  get courtApprovalObtained(): boolean {
    return this._value.courtApprovalObtained;
  }

  get courtOrderNumber(): string | undefined {
    return this._value.courtOrderNumber;
  }

  get courtOrderDate(): Date | undefined {
    return this._value.courtOrderDate;
  }

  get hasAnnualReporting(): boolean {
    return this._value.hasAnnualReporting;
  }

  get reportingFrequencyMonths(): number {
    return this._value.reportingFrequencyMonths;
  }

  get nextReportDue(): Date | undefined {
    return this._value.nextReportDue;
  }

  get canManageProperty(): boolean {
    return this._value.canManageProperty;
  }

  get canConsentToMedical(): boolean {
    return this._value.canConsentToMedical;
  }

  get canConsentToMarriage(): boolean {
    return this._value.canConsentToMarriage;
  }

  get canConsentToEducation(): boolean {
    return this._value.canConsentToEducation;
  }

  get hasLimitations(): boolean {
    return this._value.hasLimitations;
  }

  get limitations(): string[] | undefined {
    return this._value.limitations;
  }

  get isTemporary(): boolean {
    return this._value.isTemporary;
  }

  get validUntil(): Date | undefined {
    return this._value.validUntil;
  }

  get canBeTerminatedBy(): string[] {
    return [...this._value.canBeTerminatedBy];
  }

  // Check if guardianship is currently valid
  get isValid(): boolean {
    if (this._value.isTemporary && this._value.validUntil && this._value.validUntil <= new Date()) {
      return false;
    }

    if (this._value.requiresCourtApproval && !this._value.courtApprovalObtained) {
      return false;
    }

    return true;
  }

  // Check if report is overdue
  get isReportOverdue(): boolean {
    if (!this._value.hasAnnualReporting || !this._value.nextReportDue) {
      return false;
    }

    return new Date() > this._value.nextReportDue;
  }

  // Get days until next report
  get daysUntilNextReport(): number | null {
    if (!this._value.nextReportDue) return null;

    const now = new Date();
    const diffTime = this._value.nextReportDue.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if guardian can be terminated by court
  get canBeTerminatedByCourt(): boolean {
    return this._value.canBeTerminatedBy.includes('COURT');
  }

  // Check if guardianship ends when ward turns 18
  get endsAtWardMajority(): boolean {
    return this._value.canBeTerminatedBy.includes('WARD_TURNING_18');
  }

  // Get guardianship powers summary
  get powersSummary(): string {
    const powers: GuardianshipPower[] = [];

    if (this._value.canManageProperty) powers.push('manage property');
    if (this._value.canConsentToMedical) powers.push('medical consent');
    if (this._value.canConsentToEducation) powers.push('education consent');
    if (this._value.canConsentToMarriage) powers.push('marriage consent');

    return powers.length > 0 ? powers.join(', ') : 'no powers';
  }

  // Get compliance requirements
  get complianceRequirements(): string[] {
    const requirements: ComplianceRequirement[] = [];

    if (this._value.requiresBond) requirements.push('bond posting');
    if (this._value.requiresCourtApproval) requirements.push('court approval');
    if (this._value.hasAnnualReporting) requirements.push('annual reporting');

    return requirements;
  }

  toJSON() {
    return {
      type: this._value.type,
      appointmentSource: this._value.appointmentSource,
      description: this._value.description,
      applicableSections: this._value.applicableSections.map((s) => s.toJSON()),
      requiresBond: this._value.requiresBond,
      bondAmountKES: this._value.bondAmountKES,
      requiresCourtApproval: this._value.requiresCourtApproval,
      courtApprovalObtained: this._value.courtApprovalObtained,
      courtOrderNumber: this._value.courtOrderNumber,
      courtOrderDate: this._value.courtOrderDate?.toISOString(),
      hasAnnualReporting: this._value.hasAnnualReporting,
      reportingFrequencyMonths: this._value.reportingFrequencyMonths,
      nextReportDue: this._value.nextReportDue?.toISOString(),
      canManageProperty: this._value.canManageProperty,
      canConsentToMedical: this._value.canConsentToMedical,
      canConsentToMarriage: this._value.canConsentToMarriage,
      canConsentToEducation: this._value.canConsentToEducation,
      hasLimitations: this._value.hasLimitations,
      limitations: this._value.limitations,
      isTemporary: this._value.isTemporary,
      validUntil: this._value.validUntil?.toISOString(),
      canBeTerminatedBy: this._value.canBeTerminatedBy,
      isValid: this.isValid,
      isReportOverdue: this.isReportOverdue,
      daysUntilNextReport: this.daysUntilNextReport,
      canBeTerminatedByCourt: this.canBeTerminatedByCourt,
      endsAtWardMajority: this.endsAtWardMajority,
      powersSummary: this.powersSummary,
      complianceRequirements: this.complianceRequirements,
    };
  }
}
