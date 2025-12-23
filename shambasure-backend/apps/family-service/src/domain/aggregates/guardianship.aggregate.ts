// domain/aggregates/guardianship.aggregate.ts
import { GuardianType, GuardianshipStatus } from '@prisma/client';

import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import { ComplianceCheck, ComplianceCheckStatus } from '../entities/compliance-check.entity';
// Entities
import {
  GuardianAppointmentSource,
  GuardianAssignment,
} from '../entities/guardian-assignment.entity';
import { ComplianceCheckFiledEvent } from '../events/guardianship-events/compliance-check-filed.event';
import { GuardianAssignedEvent } from '../events/guardianship-events/guardian-assigned.event';
import { GuardianBondPostedEvent } from '../events/guardianship-events/guardian-bond-posted.event';
import { GuardianPowersGrantedEvent } from '../events/guardianship-events/guardian-powers-granted.event';
import { GuardianRemovedEvent } from '../events/guardianship-events/guardian-removed.event';
import { GuardianshipCreatedEvent } from '../events/guardianship-events/guardianship-created.event';
import { GuardianshipTerminatedEvent } from '../events/guardianship-events/guardianship-terminated.event';
// Exceptions
import {
  GuardianAssignmentNotFoundException,
  InvalidGuardianshipException,
  WardIneligibleException,
  WardNotFoundException,
} from '../exceptions/guardianship.exception';
// Value Objects
import { CourtOrder } from '../value-objects/legal/court-order.vo';

/**
 * Ward Information Snapshot (READ-ONLY from Family Service)
 */
export interface WardInfoSnapshot {
  wardId: string;
  fullName: string;
  dateOfBirth: Date;
  isAlive: boolean;
  isIncapacitated: boolean;
  disabilityStatus?: string;
  isMissing: boolean;
  ageAtSnapshot: number;
  snapshotDate: Date;
}

/**
 * Guardian Eligibility Check Result
 */
export interface GuardianEligibilityCheck {
  guardianId: string;
  fullName: string;
  age: number;
  isEligible: boolean;
  eligibilityReasons: string[];
  checkedAt: Date;
}

/**
 * Customary Law Details
 */
export interface CustomaryLawDetails {
  ethnicGroup: string;
  customaryAuthority: string;
  ceremonyDate?: Date;
  witnessNames?: string[];
  communityApprovalRecord?: {
    approvedBy: string;
    approvalDate: Date;
    communityPosition: string;
  };
}

/**
 * Guardianship Aggregate Props
 */
export interface GuardianshipAggregateProps {
  wardInfo: WardInfoSnapshot;
  status: GuardianshipStatus;
  establishedDate: Date;
  terminationDate?: Date;
  terminationReason?: string;
  type: GuardianType;
  courtOrder?: CourtOrder;
  customaryDetails?: CustomaryLawDetails;
  guardianAssignments: Map<string, GuardianAssignment>;
  complianceChecks: Map<string, ComplianceCheck>;
  version: number;
}

/**
 * Props for Creating Guardianship
 */
export interface CreateGuardianshipProps {
  wardId: string;
  wardFullName: string;
  wardDateOfBirth: Date;
  wardIsIncapacitated?: boolean;
  wardDisabilityStatus?: string;
  guardianId: string;
  guardianFullName: string;
  guardianEligibility: GuardianEligibilityCheck;
  type: GuardianType;
  courtOrderNumber?: string;
  courtStation?: string;
  customaryLawApplies?: boolean;
  customaryDetails?: CustomaryLawDetails;
  hasPropertyManagementPowers?: boolean;
  canConsentToMedical?: boolean;
  canConsentToMarriage?: boolean;
  restrictions?: string[];
  bondRequired?: boolean;
  annualAllowanceKES?: number;
  allowanceApprovedBy?: string;
}

/**
 * GUARDIANSHIP AGGREGATE ROOT
 */
export class GuardianshipAggregate extends AggregateRoot<GuardianshipAggregateProps> {
  private constructor(id: UniqueEntityID, props: GuardianshipAggregateProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  public static create(props: CreateGuardianshipProps): GuardianshipAggregate {
    const guardianshipId = new UniqueEntityID();
    const now = new Date();

    // Validate ward eligibility
    const wardAge = GuardianshipAggregate.calculateAge(props.wardDateOfBirth, now);
    GuardianshipAggregate.validateWardEligibility({
      isAlive: true,
      age: wardAge,
      isIncapacitated: props.wardIsIncapacitated ?? false,
      disabilityStatus: props.wardDisabilityStatus,
    });

    // Validate guardian eligibility
    if (!props.guardianEligibility.isEligible) {
      throw new InvalidGuardianshipException(
        `Guardian ${props.guardianFullName} is not eligible: ${props.guardianEligibility.eligibilityReasons.join(', ')}`,
      );
    }

    // Guardian cannot be ward
    if (props.guardianId === props.wardId) {
      throw new InvalidGuardianshipException('A person cannot be their own guardian');
    }

    // Create court order if provided
    let courtOrder: CourtOrder | undefined;
    if (props.courtOrderNumber && props.courtStation) {
      courtOrder = CourtOrder.create({
        orderNumber: props.courtOrderNumber,
        courtStation: props.courtStation,
        orderDate: now,
        orderType: 'GUARDIAN_APPOINTMENT',
      });
    }

    // Determine appointment source
    const appointmentSource = GuardianshipAggregate.determineAppointmentSource(
      props.type,
      courtOrder,
      props.customaryLawApplies,
    );

    // Create initial guardian assignment
    const guardianAssignment = GuardianAssignment.create({
      guardianId: props.guardianId,
      isPrimary: true,
      appointmentSource,
      hasPropertyManagementPowers: props.hasPropertyManagementPowers ?? false,
      canConsentToMedical: props.canConsentToMedical ?? true,
      canConsentToMarriage: props.canConsentToMarriage ?? false,
      restrictions: props.restrictions,
      bondRequired: props.bondRequired ?? false,
      annualAllowanceKES: props.annualAllowanceKES,
      allowanceApprovedBy: props.allowanceApprovedBy,
    });

    // Create compliance check if guardian manages property
    const complianceChecks = new Map<string, ComplianceCheck>();
    if (guardianAssignment.canManageProperty()) {
      const currentYear = now.getFullYear();
      const complianceCheckKey = `${currentYear}-${props.guardianId}`;
      const complianceCheck = ComplianceCheck.create({
        guardianId: props.guardianId, // FIXED: Added guardianId
        year: currentYear,
        status: ComplianceCheckStatus.PENDING,
      });
      complianceChecks.set(complianceCheckKey, complianceCheck);
    }

    // Create aggregate
    const aggregate = new GuardianshipAggregate(guardianshipId, {
      wardInfo: {
        wardId: props.wardId,
        fullName: props.wardFullName,
        dateOfBirth: props.wardDateOfBirth,
        isAlive: true,
        isIncapacitated: props.wardIsIncapacitated ?? false,
        disabilityStatus: props.wardDisabilityStatus,
        isMissing: false,
        ageAtSnapshot: wardAge,
        snapshotDate: now,
      },
      status: 'ACTIVE',
      establishedDate: now,
      type: props.type,
      courtOrder,
      customaryDetails: props.customaryDetails,
      guardianAssignments: new Map([[props.guardianId, guardianAssignment]]),
      complianceChecks,
      version: 1,
    });

    // Emit creation event
    aggregate.addDomainEvent(
      new GuardianshipCreatedEvent(
        guardianshipId.toString(),
        'GuardianshipAggregate',
        1,
        {
          guardianshipId: guardianshipId.toString(),
          wardId: props.wardId,
          wardName: props.wardFullName,
          guardianId: props.guardianId,
          guardianName: props.guardianFullName,
          type: props.type,
          establishedDate: now,
          appointmentSource,
          customaryLawApplies: props.customaryLawApplies ?? false,
        },
        now,
      ),
    );

    return aggregate;
  }

  public static fromPersistence(
    id: string,
    props: GuardianshipAggregateProps,
    createdAt: Date,
  ): GuardianshipAggregate {
    return new GuardianshipAggregate(new UniqueEntityID(id), props, createdAt);
  }

  // ============================================================================
  // DOMAIN LOGIC
  // ============================================================================

  public assignGuardian(params: {
    guardianId: string;
    guardianFullName: string;
    guardianEligibility: GuardianEligibilityCheck;
    isPrimary?: boolean;
    appointmentSource: GuardianAppointmentSource;
    hasPropertyManagementPowers?: boolean;
    canConsentToMedical?: boolean;
    canConsentToMarriage?: boolean;
    restrictions?: string[];
    bondRequired?: boolean;
    annualAllowanceKES?: number;
    allowanceApprovedBy?: string;
  }): void {
    this.ensureActive();

    // Validate guardian eligibility
    if (!params.guardianEligibility.isEligible) {
      throw new InvalidGuardianshipException(
        `Guardian ${params.guardianFullName} is not eligible: ${params.guardianEligibility.eligibilityReasons.join(', ')}`,
      );
    }

    // Check not already assigned
    if (this.props.guardianAssignments.has(params.guardianId)) {
      const existing = this.props.guardianAssignments.get(params.guardianId)!;
      if (existing.isActive) {
        throw new InvalidGuardianshipException(
          `Guardian ${params.guardianFullName} is already assigned to this ward`,
        );
      }
    }

    // If assigning as primary, demote current primary
    if (params.isPrimary) {
      this.demoteCurrentPrimary();
    }

    // Create guardian assignment
    const guardianAssignment = GuardianAssignment.create({
      guardianId: params.guardianId,
      isPrimary: params.isPrimary ?? false,
      appointmentSource: params.appointmentSource,
      hasPropertyManagementPowers: params.hasPropertyManagementPowers ?? false,
      canConsentToMedical: params.canConsentToMedical ?? true,
      canConsentToMarriage: params.canConsentToMarriage ?? false,
      restrictions: params.restrictions,
      bondRequired: params.bondRequired ?? false,
      annualAllowanceKES: params.annualAllowanceKES,
      allowanceApprovedBy: params.allowanceApprovedBy,
    });

    // Add to map
    const newAssignments = new Map(this.props.guardianAssignments);
    newAssignments.set(params.guardianId, guardianAssignment);

    // Create compliance check if needed
    const newComplianceChecks = new Map(this.props.complianceChecks);
    if (guardianAssignment.canManageProperty()) {
      const currentYear = new Date().getFullYear();
      const complianceCheckKey = `${currentYear}-${params.guardianId}`;
      if (!newComplianceChecks.has(complianceCheckKey)) {
        const complianceCheck = ComplianceCheck.create({
          guardianId: params.guardianId, // FIXED: Added guardianId
          year: currentYear,
          status: ComplianceCheckStatus.PENDING,
        });
        newComplianceChecks.set(complianceCheckKey, complianceCheck);
      }
    }

    // Update aggregate
    this.updateProps({
      guardianAssignments: newAssignments,
      complianceChecks: newComplianceChecks,
    });

    // Emit event
    this.addDomainEvent(
      new GuardianAssignedEvent(
        this._id.toString(),
        'GuardianshipAggregate',
        this._version,
        {
          guardianshipId: this._id.toString(),
          wardId: this.props.wardInfo.wardId,
          guardianId: params.guardianId,
          guardianName: params.guardianFullName,
          isPrimary: params.isPrimary ?? false,
          appointmentSource: params.appointmentSource,
          canManageProperty: guardianAssignment.canManageProperty(),
          canConsentToMedical: guardianAssignment.canConsentToMedical(),
        },
        new Date(),
      ),
    );
  }

  public removeGuardian(params: { guardianId: string; removalReason: string }): void {
    this.ensureActive();

    const guardianAssignment = this.props.guardianAssignments.get(params.guardianId);
    if (!guardianAssignment) {
      throw new GuardianAssignmentNotFoundException(params.guardianId);
    }

    // Cannot remove last active guardian
    const activeGuardians = this.getActiveGuardians();
    if (
      activeGuardians.length === 1 &&
      activeGuardians[0].guardianId.toString() === params.guardianId
    ) {
      throw new InvalidGuardianshipException(
        'Cannot remove the last active guardian. Terminate guardianship instead.',
      );
    }

    // Deactivate guardian assignment
    const deactivatedAssignment = GuardianAssignment.fromPersistence(
      guardianAssignment.id.toString(),
      { ...guardianAssignment.props, isActive: false },
      guardianAssignment.createdAt,
    );
    deactivatedAssignment.deactivate(params.removalReason);

    // Update map
    const newAssignments = new Map(this.props.guardianAssignments);
    newAssignments.set(params.guardianId, deactivatedAssignment);

    // If primary was removed, assign new primary
    if (guardianAssignment.isPrimary) {
      const newPrimary = this.findNewPrimaryCandidate(params.guardianId);
      if (newPrimary) {
        const updatedPrimary = GuardianAssignment.fromPersistence(
          newPrimary.id.toString(),
          { ...newPrimary.props, isPrimary: true },
          newPrimary.createdAt,
        );
        newAssignments.set(newPrimary.guardianId.toString(), updatedPrimary);
      }
    }

    // Update aggregate
    this.updateProps({
      guardianAssignments: newAssignments,
    });

    // Emit event
    this.addDomainEvent(
      new GuardianRemovedEvent(
        this._id.toString(),
        'GuardianshipAggregate',
        this._version,
        {
          guardianshipId: this._id.toString(),
          wardId: this.props.wardInfo.wardId,
          guardianId: params.guardianId,
          removalReason: params.removalReason,
          wasPrimary: guardianAssignment.isPrimary,
        },
        new Date(),
      ),
    );
  }

  public fileComplianceReport(params: {
    guardianId: string;
    year: number;
    filingDate: Date;
    reportDocumentId: string;
    notes?: string;
    assetsUnderManagementKES?: number;
    guardianExpensesKES?: number;
    guardianAllowanceKES?: number;
    estateIncomeKES?: number;
    estateExpensesKES?: number;
  }): void {
    this.ensureActive();

    // Validate guardian exists and is active
    const guardianAssignment = this.props.guardianAssignments.get(params.guardianId);
    if (!guardianAssignment || !guardianAssignment.isActive) {
      throw new GuardianAssignmentNotFoundException(params.guardianId);
    }

    // Validate guardian can manage property
    if (!guardianAssignment.canManageProperty()) {
      throw new InvalidGuardianshipException(
        `Guardian ${params.guardianId} does not have property management powers. S.73 reports not required.`,
      );
    }

    // Find or create compliance check
    const complianceCheckKey = `${params.year}-${params.guardianId}`;
    let complianceCheck = this.props.complianceChecks.get(complianceCheckKey);

    if (!complianceCheck) {
      complianceCheck = ComplianceCheck.create({
        guardianId: params.guardianId, // FIXED: Added guardianId
        year: params.year,
        status: ComplianceCheckStatus.PENDING,
      });
    }

    // File the report
    const updatedComplianceCheck = ComplianceCheck.fromPersistence(
      complianceCheck.id.toString(),
      { ...complianceCheck.props },
      complianceCheck.createdAt,
    );
    updatedComplianceCheck.fileReport({
      filingDate: params.filingDate,
      reportDocumentId: params.reportDocumentId,
      notes: params.notes,
      assetsUnderManagementKES: params.assetsUnderManagementKES,
      guardianExpensesKES: params.guardianExpensesKES,
      guardianAllowanceKES: params.guardianAllowanceKES,
      estateIncomeKES: params.estateIncomeKES,
      estateExpensesKES: params.estateExpensesKES,
    });

    // Update compliance checks map
    const newComplianceChecks = new Map(this.props.complianceChecks);
    newComplianceChecks.set(complianceCheckKey, updatedComplianceCheck);

    // Update aggregate
    this.updateProps({
      complianceChecks: newComplianceChecks,
    });

    // Emit event
    this.addDomainEvent(
      new ComplianceCheckFiledEvent(
        this._id.toString(),
        'GuardianshipAggregate',
        this._version,
        {
          guardianshipId: this._id.toString(),
          wardId: this.props.wardInfo.wardId,
          guardianId: params.guardianId,
          year: params.year,
          filingDate: params.filingDate,
          reportDocumentId: params.reportDocumentId,
        },
        new Date(),
      ),
    );
  }

  public terminate(params: {
    terminationReason: string;
    terminationDate: Date;
    courtOrderNumber?: string;
  }): void {
    if (this.props.status !== 'ACTIVE') {
      throw new InvalidGuardianshipException(
        `Guardianship is already ${this.props.status.toLowerCase()}`,
      );
    }

    // Deactivate all guardian assignments
    const newAssignments = new Map<string, GuardianAssignment>();
    this.props.guardianAssignments.forEach((assignment, guardianId) => {
      if (assignment.isActive) {
        const deactivatedAssignment = GuardianAssignment.fromPersistence(
          assignment.id.toString(),
          { ...assignment.props, isActive: false },
          assignment.createdAt,
        );
        deactivatedAssignment.deactivate(params.terminationReason);
        newAssignments.set(guardianId, deactivatedAssignment);
      } else {
        newAssignments.set(guardianId, assignment);
      }
    });

    // Update aggregate status
    this.updateProps({
      status: 'TERMINATED',
      terminationDate: params.terminationDate,
      terminationReason: params.terminationReason,
      guardianAssignments: newAssignments,
    });

    // Emit event
    this.addDomainEvent(
      new GuardianshipTerminatedEvent(
        this._id.toString(),
        'GuardianshipAggregate',
        this._version,
        {
          guardianshipId: this._id.toString(),
          wardId: this.props.wardInfo.wardId,
          terminationReason: params.terminationReason,
          terminationDate: params.terminationDate,
          courtOrderNumber: params.courtOrderNumber,
          activeGuardiansCount: this.getActiveGuardians().length,
        },
        new Date(),
      ),
    );
  }

  public grantPropertyManagementPowers(params: {
    guardianId: string;
    restrictions?: string[];
    courtOrderNumber?: string;
  }): void {
    this.ensureActive();

    const guardianAssignment = this.getActiveGuardianAssignment(params.guardianId);

    // Grant powers
    const updatedAssignment = GuardianAssignment.fromPersistence(
      guardianAssignment.id.toString(),
      { ...guardianAssignment.props },
      guardianAssignment.createdAt,
    );
    updatedAssignment.grantPropertyManagementPowers(params.restrictions);

    // Update assignment
    const newAssignments = new Map(this.props.guardianAssignments);
    newAssignments.set(params.guardianId, updatedAssignment);

    // Create compliance check for current year
    const currentYear = new Date().getFullYear();
    const complianceCheckKey = `${currentYear}-${params.guardianId}`;
    if (!this.props.complianceChecks.has(complianceCheckKey)) {
      const complianceCheck = ComplianceCheck.create({
        guardianId: params.guardianId, // FIXED: Added guardianId
        year: currentYear,
        status: ComplianceCheckStatus.PENDING,
      });
      const newComplianceChecks = new Map(this.props.complianceChecks);
      newComplianceChecks.set(complianceCheckKey, complianceCheck);
      this.updateProps({
        guardianAssignments: newAssignments,
        complianceChecks: newComplianceChecks,
      });
    } else {
      this.updateProps({
        guardianAssignments: newAssignments,
      });
    }

    // Emit event
    this.addDomainEvent(
      new GuardianPowersGrantedEvent(
        this._id.toString(),
        'GuardianshipAggregate',
        this._version,
        {
          guardianshipId: this._id.toString(),
          guardianId: params.guardianId,
          powerType: 'PROPERTY_MANAGEMENT',
          courtOrderNumber: params.courtOrderNumber,
          restrictions: params.restrictions,
        },
        new Date(),
      ),
    );
  }

  public postGuardianBond(params: {
    guardianId: string;
    provider: string;
    policyNumber: string;
    amountKES: number;
    expiryDate: Date;
  }): void {
    this.ensureActive();

    const guardianAssignment = this.getActiveGuardianAssignment(params.guardianId);

    try {
      guardianAssignment.postBond({
        provider: params.provider,
        policyNumber: params.policyNumber,
        amountKES: params.amountKES,
        expiryDate: params.expiryDate,
      });

      // Update the guardian in the map with new instance
      const newAssignments = new Map(this.props.guardianAssignments);
      newAssignments.set(params.guardianId, guardianAssignment);
      this.updateProps({ guardianAssignments: newAssignments });
    } catch (error) {
      throw new InvalidGuardianshipException(
        `Failed to post bond for guardian ${params.guardianId}: ${error.message}`,
      );
    }

    // Emit event
    this.addDomainEvent(
      new GuardianBondPostedEvent(
        this._id.toString(),
        'GuardianshipAggregate',
        this._version,
        {
          guardianshipId: this._id.toString(),
          guardianId: params.guardianId,
          bondAmountKES: params.amountKES,
          bondProvider: params.provider,
          bondPolicyNumber: params.policyNumber,
          expiryDate: params.expiryDate,
        },
        new Date(),
      ),
    );
  }

  // ============================================================================
  // VALIDATION - CHANGED FROM PRIVATE TO PUBLIC
  // ============================================================================

  public validate(): void {
    // 1. Active guardianship must have at least one active guardian
    if (this.props.status === 'ACTIVE') {
      const activeGuardians = this.getActiveGuardians();
      if (activeGuardians.length === 0) {
        throw new InvalidGuardianshipException(
          'Active guardianship must have at least one active guardian',
        );
      }

      // 2. Ward must be eligible (re-validate with current age)
      const currentAge = GuardianshipAggregate.calculateAge(
        this.props.wardInfo.dateOfBirth,
        new Date(),
      );

      const isMinor = currentAge < 18;
      const isEligibleAdult = currentAge >= 18 && this.props.wardInfo.isIncapacitated;

      if (!isMinor && !isEligibleAdult) {
        // Ward is no longer eligible - should be terminated
        console.warn(
          `Ward ${this.props.wardInfo.wardId} is no longer eligible for guardianship (age: ${currentAge}, incapacitated: ${this.props.wardInfo.isIncapacitated})`,
        );
      }
    }

    // 3. Court-appointed guardianships must have court order
    if (this.props.type === 'COURT_APPOINTED' && !this.props.courtOrder) {
      console.warn('Court-appointed guardianship should have court order');
    }

    // 4. Customary law guardianships must have customary details
    if (this.props.customaryDetails && !this.props.courtOrder) {
      if (
        !this.props.customaryDetails.ethnicGroup ||
        !this.props.customaryDetails.customaryAuthority
      ) {
        console.warn('Customary law guardianship missing required details');
      }
    }
  }

  // ============================================================================
  // EVENT SOURCING - applyEvent method
  // ============================================================================

  protected applyEvent(event: DomainEvent): void {
    this.incrementVersion();

    // Apply event to aggregate state
    // This is simplified - in a real implementation, you would apply the event to the state
    console.log(`Applying event: ${event.constructor.name}`, event);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private ensureActive(): void {
    if (this.props.status !== 'ACTIVE') {
      throw new InvalidGuardianshipException(
        `Guardianship is ${this.props.status.toLowerCase()} - operation not allowed`,
      );
    }
  }

  private getActiveGuardianAssignment(guardianId: string): GuardianAssignment {
    const assignment = this.props.guardianAssignments.get(guardianId);
    if (!assignment || !assignment.isActive) {
      throw new GuardianAssignmentNotFoundException(guardianId);
    }
    return assignment;
  }

  private demoteCurrentPrimary(): void {
    const currentPrimary = this.getPrimaryGuardian();
    if (currentPrimary) {
      const demotedAssignment = GuardianAssignment.fromPersistence(
        currentPrimary.id.toString(),
        { ...currentPrimary.props, isPrimary: false },
        currentPrimary.createdAt,
      );
      const newAssignments = new Map(this.props.guardianAssignments);
      newAssignments.set(currentPrimary.guardianId.toString(), demotedAssignment);
      this.updateProps({ guardianAssignments: newAssignments });
    }
  }

  private findNewPrimaryCandidate(excludedGuardianId: string): GuardianAssignment | undefined {
    for (const [guardianId, assignment] of this.props.guardianAssignments) {
      if (guardianId !== excludedGuardianId && assignment.isActive) {
        return assignment;
      }
    }
    return undefined;
  }

  private updateProps(updates: Partial<GuardianshipAggregateProps>): void {
    const newProps = {
      ...this.props,
      ...updates,
      version: this.props.version + 1,
    };
    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  // ============================================================================
  // STATIC HELPER METHODS
  // ============================================================================

  private static validateWardEligibility(params: {
    isAlive: boolean;
    age: number;
    isIncapacitated: boolean;
    disabilityStatus?: string;
  }): void {
    if (!params.isAlive) {
      throw new WardNotFoundException('Cannot appoint guardian for deceased ward');
    }

    const isMinor = params.age < 18;
    const isEligibleAdult = params.age >= 18 && params.isIncapacitated;

    if (!isMinor && !isEligibleAdult) {
      throw new WardIneligibleException(
        `Ward is ${params.age} years old and not incapacitated. Guardianship only for minors (<18) or incapacitated adults.`,
      );
    }

    if (params.disabilityStatus && params.disabilityStatus !== 'NONE') {
      console.log(`Guardianship for ward with disability: ${params.disabilityStatus}`);
    }
  }

  private static determineAppointmentSource(
    type: GuardianType,
    courtOrder?: CourtOrder,
    customaryLawApplies?: boolean,
  ): GuardianAppointmentSource {
    if (customaryLawApplies) {
      return GuardianAppointmentSource.CUSTOMARY_LAW;
    }

    switch (type) {
      case 'TESTAMENTARY':
        return GuardianAppointmentSource.WILL;
      case 'COURT_APPOINTED':
        return GuardianAppointmentSource.COURT;
      case 'NATURAL_PARENT':
        return GuardianAppointmentSource.FAMILY;
      default:
        return GuardianAppointmentSource.FAMILY;
    }
  }

  private static calculateAge(dateOfBirth: Date, referenceDate: Date): number {
    const diffMs = referenceDate.getTime() - dateOfBirth.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  get wardId(): string {
    return this.props.wardInfo.wardId;
  }

  get status(): GuardianshipStatus {
    return this.props.status;
  }

  get establishedDate(): Date {
    return this.props.establishedDate;
  }

  get terminationDate(): Date | undefined {
    return this.props.terminationDate;
  }

  get terminationReason(): string | undefined {
    return this.props.terminationReason;
  }

  public getActiveGuardians(): GuardianAssignment[] {
    return Array.from(this.props.guardianAssignments.values()).filter(
      (assignment) => assignment.isActive,
    );
  }

  public getPrimaryGuardian(): GuardianAssignment | undefined {
    return this.getActiveGuardians().find((guardian) => guardian.isPrimary);
  }

  public getGuardianById(guardianId: string): GuardianAssignment | undefined {
    return this.props.guardianAssignments.get(guardianId);
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  public toJSON(): Record<string, any> {
    const activeGuardians = this.getActiveGuardians();
    const primaryGuardian = this.getPrimaryGuardian();

    return {
      id: this._id.toString(),
      wardInfo: {
        wardId: this.props.wardInfo.wardId,
        fullName: this.props.wardInfo.fullName,
        dateOfBirth: this.props.wardInfo.dateOfBirth.toISOString(),
        isAlive: this.props.wardInfo.isAlive,
        isIncapacitated: this.props.wardInfo.isIncapacitated,
        disabilityStatus: this.props.wardInfo.disabilityStatus,
        snapshotDate: this.props.wardInfo.snapshotDate.toISOString(),
      },
      status: this.props.status,
      establishedDate: this.props.establishedDate.toISOString(),
      terminationDate: this.props.terminationDate?.toISOString(),
      terminationReason: this.props.terminationReason,
      type: this.props.type,
      courtOrder: this.props.courtOrder?.toJSON(),
      customaryDetails: this.props.customaryDetails,
      guardians: activeGuardians.map((guardian) => guardian.toJSON()),
      primaryGuardian: primaryGuardian?.toJSON(),
      complianceChecks: Array.from(this.props.complianceChecks.values()).map((check) =>
        check.toJSON(),
      ),
      activeGuardiansCount: activeGuardians.length,
      version: this._version,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      deletedAt: this._deletedAt?.toISOString(),
    };
  }
}
