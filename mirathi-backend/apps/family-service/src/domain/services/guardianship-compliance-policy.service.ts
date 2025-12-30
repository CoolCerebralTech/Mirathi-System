// src/family-service/src/domain/services/guardianship-compliance-policy.service.ts
import { BondOverallStatus, GuardianshipAggregate } from '../aggregates/guardianship.aggregate';
import { GuardianAssignmentStatus } from '../entities/guardian-assignment.entity';
import { LegalGuardianshipType } from '../value-objects/guardianship-type.vo';

export class MissingBondError extends Error {
  constructor() {
    super('Guardianship requires a bond when managing property');
    this.name = 'MissingBondError';
  }
}

export class MissingCourtApprovalError extends Error {
  constructor() {
    super('Guardianship requires court approval for this type');
    this.name = 'MissingCourtApprovalError';
  }
}

export class ComplianceDeadlineError extends Error {
  constructor(deadline: Date) {
    super(`Compliance report deadline passed: ${deadline.toLocaleDateString()}`);
    this.name = 'ComplianceDeadlineError';
  }
}

export class JurisdictionConflictError extends Error {
  constructor(jurisdiction1: string, jurisdiction2: string) {
    super(`Jurisdiction conflict: ${jurisdiction1} vs ${jurisdiction2}`);
    this.name = 'JurisdictionConflictError';
  }
}

export class GuardianshipCompliancePolicyService {
  /**
   * Check if guardianship can be activated
   */
  static canActivateGuardianship(guardianship: GuardianshipAggregate): void {
    // 1. Bond requirement for property management
    if (
      guardianship.props.requiresPropertyManagement &&
      guardianship.props.bondStatus === BondOverallStatus.REQUIRED_PENDING
    ) {
      throw new MissingBondError();
    }

    // 2. Court approval for statutory guardianship
    // FIX: Access .value for SimpleValueObject and use Enum
    if (
      guardianship.props.guardianshipType.value === LegalGuardianshipType.COURT_APPOINTED &&
      !guardianship.props.courtOrder
    ) {
      throw new MissingCourtApprovalError();
    }

    // 3. Must have at least one primary guardian
    const hasPrimaryGuardian = guardianship.props.guardianAssignments.some(
      (ga) => ga.props.isPrimary && ga.props.status === GuardianAssignmentStatus.ACTIVE,
    );

    if (!hasPrimaryGuardian) {
      throw new Error('Must have at least one active primary guardian');
    }

    // 4. Check jurisdiction-specific requirements
    this.checkJurisdictionRequirements(guardianship);
  }

  /**
   * Check jurisdiction-specific requirements
   */
  private static checkJurisdictionRequirements(guardianship: GuardianshipAggregate): void {
    switch (guardianship.props.jurisdiction) {
      case 'STATUTORY':
        // Children Act requirements
        if (!guardianship.props.courtOrder) {
          throw new MissingCourtApprovalError();
        }
        break;

      case 'ISLAMIC':
        // Islamic law requirements (Kadhi's court)
        if (
          !guardianship.props.courtOrder &&
          // FIX: Access .value and use Enum
          guardianship.props.guardianshipType.value === LegalGuardianshipType.TESTAMENTARY
        ) {
          throw new MissingCourtApprovalError();
        }
        break;

      case 'CUSTOMARY':
        // Customary law requirements
        if (!guardianship.props.courtOrder && guardianship.props.requiresPropertyManagement) {
          throw new MissingCourtApprovalError();
        }
        break;

      case 'INTERNATIONAL':
        // Hague Convention requirements
        if (!guardianship.props.courtOrder) {
          throw new MissingCourtApprovalError();
        }
        break;
    }
  }

  /**
   * Check if compliance report can be submitted
   */
  static canSubmitComplianceReport(
    guardianship: GuardianshipAggregate,
    reportType: string,
    submissionDate: Date,
  ): void {
    // Get next compliance check
    const nextCheck = guardianship.getNextComplianceDue();

    if (!nextCheck) {
      throw new Error('No compliance check scheduled');
    }

    // Check if submission is too early (before due date - 30 days buffer)
    const earliestSubmission = new Date(nextCheck);
    earliestSubmission.setDate(earliestSubmission.getDate() - 30);

    if (submissionDate < earliestSubmission) {
      throw new Error('Cannot submit report more than 30 days before due date');
    }

    // Check if submission is too late
    const deadline = new Date(nextCheck);

    // Different deadlines based on report type
    switch (reportType) {
      case 'ANNUAL_WELFARE':
        deadline.setDate(deadline.getDate() + 30); // 30-day grace period
        break;
      case 'QUARTERLY_FINANCIAL':
        deadline.setDate(deadline.getDate() + 15); // 15-day grace period
        break;
      case 'MEDICAL_UPDATE':
        deadline.setDate(deadline.getDate() + 7); // 7-day grace period
        break;
      default:
        deadline.setDate(deadline.getDate() + 30);
    }

    if (submissionDate > deadline) {
      throw new ComplianceDeadlineError(deadline);
    }

    // Check report completeness
    this.checkReportCompleteness(guardianship, reportType);
  }

  /**
   * Check report completeness requirements
   */
  private static checkReportCompleteness(
    _guardianship: GuardianshipAggregate,
    reportType: string,
  ): void {
    // This would check if all required sections are complete
    // Based on report type and guardianship type

    const requiredSections: Record<string, string[]> = {
      ANNUAL_WELFARE: ['ward-status', 'educational-progress', 'health-updates'],
      QUARTERLY_FINANCIAL: ['financial-statement', 'bank-reconciliation'],
      MEDICAL_UPDATE: ['health-updates', 'medical-appointments'],
      PROPERTY_MANAGEMENT: ['financial-statement', 'property-inventory'],
    };

    const sections = requiredSections[reportType] || [];
    if (sections.length === 0) {
      throw new Error(`Invalid report type: ${reportType}`);
    }
  }

  /**
   * Check if guardianship can be terminated
   */
  static canTerminateGuardianship(
    guardianship: GuardianshipAggregate,
    terminationReason: string,
  ): void {
    // 1. Check if ward has reached majority
    const wardAge = this.calculateWardAge(guardianship);

    // FIX: Removed check for isMentallyIncapacitated/hasDisability as they don't exist on FamilyMemberReferenceVO
    // Relying on Age + Special Circumstances note if needed
    const isAdultIncapacitated = this.isWardIncapacitated(guardianship);

    if (wardAge >= 18 && !isAdultIncapacitated) {
      // Automatic eligibility when ward becomes adult and capable
      return;
    }

    // 2. For incapacitated adults, detailed reason required
    if (isAdultIncapacitated && (!terminationReason || terminationReason.length < 50)) {
      throw new Error(
        'Detailed termination reason required (minimum 50 characters) for incapacitated ward',
      );
    }

    // 3. Check for pending compliance reports
    const complianceSummary = guardianship.getComplianceSummary();
    if (complianceSummary.overdueChecks > 0) {
      throw new Error('Cannot terminate guardianship with overdue compliance reports');
    }

    // 4. Check bond release eligibility
    if (
      guardianship.props.requiresPropertyManagement &&
      guardianship.props.bondStatus === BondOverallStatus.POSTED
    ) {
      this.checkBondReleaseEligibility(guardianship);
    }

    // 5. Check successor guardian arrangements
    this.checkSuccessorArrangements(guardianship);
  }

  /**
   * Helper to detect incapacity since the Property is missing on VO.
   * Checks metadata or special circumstances.
   */
  private static isWardIncapacitated(guardianship: GuardianshipAggregate): boolean {
    const notes =
      (guardianship.props.legalNotes || '') + (guardianship.props.specialCircumstances || '');
    return notes.toLowerCase().includes('incapacity') || notes.toLowerCase().includes('disability');
  }

  private static calculateWardAge(guardianship: GuardianshipAggregate): number {
    const birthDate = guardianship.props.wardDateOfBirth;
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private static checkBondReleaseEligibility(_guardianship: GuardianshipAggregate): void {
    // Check if all property has been properly transferred/accounted for
    // Check if there are no pending claims against the bond
    // This would require access to estate/asset records

    // Simplified check
    const hasOutstandingPropertyIssues = false; // Would query estate service

    if (hasOutstandingPropertyIssues) {
      throw new Error('Cannot terminate guardianship with outstanding property issues');
    }
  }

  private static checkSuccessorArrangements(guardianship: GuardianshipAggregate): void {
    // Check if incapacitated adult has successor guardian
    if (this.isWardIncapacitated(guardianship)) {
      const activeGuardians = guardianship.props.guardianAssignments.filter(
        (ga) => ga.props.status === GuardianAssignmentStatus.ACTIVE,
      );

      if (activeGuardians.length === 1) {
        // Only one active guardian - need successor
        throw new Error('Must appoint successor guardian for incapacitated ward');
      }
    }
  }

  /**
   * Check if emergency guardianship can be converted to regular guardianship
   */
  static canConvertEmergencyGuardianship(
    guardianship: GuardianshipAggregate,
    conversionDate: Date,
  ): void {
    // Emergency guardianship typically limited to 30-90 days
    const emergencyPeriodDays = 90;
    const establishedDate = guardianship.props.establishedDate;

    const daysSinceEstablishment = Math.floor(
      (conversionDate.getTime() - establishedDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceEstablishment > emergencyPeriodDays) {
      throw new Error(`Emergency guardianship cannot exceed ${emergencyPeriodDays} days`);
    }

    // Must have court approval for conversion
    if (!guardianship.props.courtOrder) {
      throw new MissingCourtApprovalError();
    }

    // Must have completed initial assessment
    const hasInitialAssessment = false; // Would check if initial assessment report exists

    if (!hasInitialAssessment) {
      throw new Error('Initial ward assessment required before conversion');
    }
  }

  /**
   * Calculate compliance schedule based on guardianship type
   */
  static calculateComplianceSchedule(
    guardianshipType: string,
    requiresPropertyManagement: boolean,
  ): { frequency: string; reminderDays: number[] } {
    switch (guardianshipType) {
      case 'STATUTORY':
        return {
          frequency: requiresPropertyManagement ? 'QUARTERLY' : 'ANNUAL',
          reminderDays: [30, 14, 7],
        };

      case 'TESTAMENTARY':
        return {
          frequency: 'ANNUAL',
          reminderDays: [60, 30, 14],
        };

      case 'CUSTOMARY':
        return {
          frequency: 'BIANNUAL',
          reminderDays: [30, 14],
        };

      case 'EMERGENCY':
        return {
          frequency: 'MONTHLY',
          reminderDays: [7, 3, 1],
        };

      case 'INTERNATIONAL':
        return {
          frequency: requiresPropertyManagement ? 'QUARTERLY' : 'ANNUAL',
          reminderDays: [90, 60, 30, 14],
        };

      default:
        return {
          frequency: 'ANNUAL',
          reminderDays: [30, 14, 7],
        };
    }
  }

  /**
   * Check for jurisdiction conflicts
   */
  static checkJurisdictionConflict(jurisdiction1: string, jurisdiction2: string): void {
    const conflictMatrix: Record<string, string[]> = {
      STATUTORY: ['ISLAMIC', 'CUSTOMARY'], // Statutory law supersedes
      ISLAMIC: ['STATUTORY'], // Islamic law conflicts with statutory
      CUSTOMARY: ['STATUTORY'], // Customary law conflicts with statutory
      INTERNATIONAL: [], // International law typically has precedence
    };

    const conflictsWith1 = conflictMatrix[jurisdiction1] || [];
    const conflictsWith2 = conflictMatrix[jurisdiction2] || [];

    if (conflictsWith1.includes(jurisdiction2) || conflictsWith2.includes(jurisdiction1)) {
      throw new JurisdictionConflictError(jurisdiction1, jurisdiction2);
    }
  }

  /**
   * Validate bond amount based on estate value
   */
  static validateBondAmount(estateValue: number, bondAmount: number): void {
    // Kenyan law: Bond should be at least 50% of estate value for property guardianship
    const minimumBondPercentage = 0.5;
    const requiredBond = estateValue * minimumBondPercentage;

    if (bondAmount < requiredBond) {
      throw new Error(
        `Bond amount (${bondAmount}) is less than required minimum (${requiredBond})`,
      );
    }

    // Maximum bond (usually court-determined, but we can set a sanity check)
    const maximumBond = estateValue * 2; // 200% of estate value as maximum
    if (bondAmount > maximumBond) {
      throw new Error(`Bond amount (${bondAmount}) exceeds reasonable maximum (${maximumBond})`);
    }
  }
}
