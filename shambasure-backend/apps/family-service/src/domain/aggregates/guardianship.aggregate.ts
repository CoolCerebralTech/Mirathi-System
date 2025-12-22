// domain/aggregates/guardianship.aggregate.ts
import { GuardianType } from '@prisma/client';

import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
// Entities
import { Guardian, TerminationReason } from '../entities/guardian.entity';
// Events
import { AnnualReportFiledEvent } from '../events/guardianship-events/annual-report-filed.event';
import { GuardianAppointedEvent } from '../events/guardianship-events/guardian-appointed.event';
import { GuardianBondPostedEvent } from '../events/guardianship-events/guardian-bond-posted.event';
import { GuardianReplacedEvent } from '../events/guardianship-events/guardian-replaced.event';
import { GuardianshipCreatedEvent } from '../events/guardianship-events/guardianship-created.event';
import { GuardianshipDissolvedEvent } from '../events/guardianship-events/guardianship-dissolved.event';
import { MultipleGuardiansAssignedEvent } from '../events/guardianship-events/multiple-guardians-assigned.event';
import { WardMajorityReachedEvent } from '../events/guardianship-events/ward-majority-reached.event';
// Exceptions
import {
  GuardianIneligibleException,
  GuardianNotFoundException,
  InvalidGuardianshipException,
  MultipleGuardiansException,
  WardNotFoundException,
  WardNotMinorException,
} from '../exceptions/guardianship.exception';
// Value Objects
import { CourtOrder } from '../value-objects/legal/court-order.vo';

/**
 * Ward Information (Snapshot from Family Service)
 */
export interface WardInfo {
  wardId: string;
  dateOfBirth: Date;
  isDeceased: boolean;
  isIncapacitated: boolean;
  currentAge: number;
  updatedAt: Date; // Track when this info was last updated
}

/**
 * Guardian Eligibility Information
 */
export interface GuardianEligibilityInfo {
  guardianId: string;
  age: number;
  isBankrupt: boolean;
  hasCriminalRecord: boolean;
  isIncapacitated: boolean;
  criminalRecordDetails?: string; // Type of criminal record
  bankruptcyDate?: Date; // When declared bankrupt
}

/**
 * Customary Law Details
 */
export interface CustomaryLawDetails {
  ethnicGroup: string; // e.g., "KIKUYU", "LUO", "KALENJIN"
  customaryAuthority: string; // e.g., "Council of Elders", "Clan Head"
  ceremonyDate?: Date;
  witnessNames?: string[];
  elderApprovalRecords: {
    elderName: string;
    approvalDate: Date;
    role: string; // e.g., "Chief", "Elder", "Family Head"
  }[];
  specialConditions?: Record<string, any>;
}

/**
 * Guardianship Aggregate Props
 */
export interface GuardianshipAggregateProps {
  // Ward Information (immutable snapshot)
  wardInfo: WardInfo;

  // Guardians (can have multiple for co-guardianship)
  guardians: Map<string, Guardian>; // guardianId -> Guardian
  primaryGuardianId?: string;

  // Guardianship Metadata
  establishedDate: Date;

  // Customary Law Context
  customaryLawApplies: boolean;
  customaryDetails?: CustomaryLawDetails;

  // Court Context
  courtOrder?: CourtOrder;

  // Status
  isActive: boolean;
  dissolvedDate?: Date;
  dissolutionReason?: string;

  // S.73 Reporting Compliance
  lastComplianceCheck?: Date;
  complianceWarnings: string[]; // Track compliance issues
}

/**
 * Props for Creating Guardianship
 */
export interface CreateGuardianshipProps {
  // Ward info (from Family Service)
  wardInfo: WardInfo;

  // Primary guardian
  guardianId: string;
  guardianEligibility: GuardianEligibilityInfo;
  type: GuardianType;
  appointmentDate: Date;

  // Legal details
  courtOrderNumber?: string;
  courtStation?: string;
  validUntil?: Date;

  // Powers
  hasPropertyManagementPowers?: boolean;
  canConsentToMedical?: boolean;
  canConsentToMarriage?: boolean;
  restrictions?: string[];
  specialInstructions?: string;

  // S.72 Bond
  bondRequired?: boolean;
  bondAmountKES?: number;

  // Allowance
  annualAllowanceKES?: number;

  // Customary law
  customaryLawApplies?: boolean;
  customaryDetails?: CustomaryLawDetails;
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

  /**
   * Create new Guardianship
   */
  public static create(props: CreateGuardianshipProps): GuardianshipAggregate {
    const guardianshipId = new UniqueEntityID();

    // Validate ward eligibility
    GuardianshipAggregate.validateWardEligibility(props.wardInfo);

    // Validate guardian eligibility
    GuardianshipAggregate.validateGuardianEligibility(props.guardianEligibility);

    // Validate customary law if applicable
    if (props.customaryLawApplies && props.customaryDetails) {
      GuardianshipAggregate.validateCustomaryLawDetails(props.customaryDetails);
    }

    // Guardian cannot be ward
    if (props.guardianId === props.wardInfo.wardId) {
      throw new InvalidGuardianshipException('A person cannot be their own guardian');
    }

    // Create primary guardian entity
    const guardian = Guardian.create({
      wardId: props.wardInfo.wardId,
      guardianId: props.guardianId,
      guardianshipId: guardianshipId.toString(),
      type: props.type,
      appointmentDate: props.appointmentDate,
      courtOrderNumber: props.courtOrderNumber,
      courtStation: props.courtStation,
      validUntil: props.validUntil,
      hasPropertyManagementPowers: props.hasPropertyManagementPowers,
      canConsentToMedical: props.canConsentToMedical,
      canConsentToMarriage: props.canConsentToMarriage,
      restrictions: props.restrictions,
      specialInstructions: props.specialInstructions,
      bondRequired: props.bondRequired,
      bondAmountKES: props.bondAmountKES,
      annualAllowanceKES: props.annualAllowanceKES,
      customaryLawApplies: props.customaryLawApplies,
      customaryDetails: props.customaryDetails,
    });

    // Build guardians map
    const guardians = new Map<string, Guardian>();
    guardians.set(props.guardianId, guardian);

    // Build court order if provided
    let courtOrder: CourtOrder | undefined;
    if (props.courtOrderNumber && props.courtStation) {
      courtOrder = CourtOrder.create({
        orderNumber: props.courtOrderNumber,
        courtStation: props.courtStation,
        orderDate: props.appointmentDate,
        orderType: 'GUARDIAN_APPOINTMENT',
      });
    }

    const aggregate = new GuardianshipAggregate(guardianshipId, {
      wardInfo: {
        ...props.wardInfo,
        updatedAt: new Date(), // Set initial update time
      },
      guardians,
      primaryGuardianId: props.guardianId,
      establishedDate: props.appointmentDate,
      customaryLawApplies: props.customaryLawApplies ?? false,
      customaryDetails: props.customaryDetails,
      courtOrder,
      isActive: true,
      complianceWarnings: [],
    });

    // Emit creation event with proper version (0 -> 1)
    aggregate.incrementVersion();
    aggregate.addDomainEvent(
      new GuardianshipCreatedEvent(
        guardianshipId.toString(),
        'GuardianshipAggregate',
        aggregate._version,
        {
          guardianshipId: guardianshipId.toString(),
          wardId: props.wardInfo.wardId,
          primaryGuardianId: props.guardianId,
          guardianType: props.type,
          appointmentDate: props.appointmentDate,
          customaryLawApplies: props.customaryLawApplies ?? false,
        },
      ),
    );

    return aggregate;
  }

  /**
   * Reconstitute from persistence
   */
  public static fromPersistence(
    id: string,
    props: GuardianshipAggregateProps,
    createdAt: Date,
  ): GuardianshipAggregate {
    return new GuardianshipAggregate(new UniqueEntityID(id), props, createdAt);
  }

  /**
   * Helper method to safely update immutable props
   */
  private updateProps(updates: Partial<GuardianshipAggregateProps>): void {
    const newProps = {
      ...this.props,
      ...updates,
    };
    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  /**
   * Clone guardian with updated properties (immutable pattern)
   */
  private cloneGuardianWithUpdates(
    guardian: Guardian,
    updates: Partial<Guardian['props']>,
  ): Guardian {
    return Guardian.fromPersistence(
      guardian.id.toString(),
      {
        ...guardian.props,
        ...updates,
      },
      guardian.createdAt,
    );
  }

  // ============================================================================
  // AGGREGATE COMMANDS - GUARDIAN MANAGEMENT
  // ============================================================================

  /**
   * Add Co-Guardian
   */
  public addCoGuardian(params: {
    guardianId: string;
    guardianEligibility: GuardianEligibilityInfo;
    type: GuardianType;
    appointmentDate: Date;
    courtOrderNumber?: string;
    hasPropertyManagementPowers?: boolean;
    canConsentToMedical?: boolean;
    canConsentToMarriage?: boolean;
    restrictions?: string[];
    bondRequired?: boolean;
    bondAmountKES?: number;
  }): void {
    this.ensureNotDeleted();
    this.ensureActive();

    // Validate guardian eligibility
    GuardianshipAggregate.validateGuardianEligibility(params.guardianEligibility);

    // Cannot add same guardian twice
    if (this.props.guardians.has(params.guardianId)) {
      throw new MultipleGuardiansException(
        `Guardian ${params.guardianId} is already assigned to this ward`,
      );
    }

    // Guardian cannot be ward
    if (params.guardianId === this.props.wardInfo.wardId) {
      throw new InvalidGuardianshipException('A person cannot be their own guardian');
    }

    // Validate co-guardian compatibility
    this.validateCoGuardianCompatibility(params);

    // Create co-guardian entity
    const coGuardian = Guardian.create({
      wardId: this.props.wardInfo.wardId,
      guardianId: params.guardianId,
      guardianshipId: this._id.toString(),
      type: params.type,
      appointmentDate: params.appointmentDate,
      courtOrderNumber: params.courtOrderNumber,
      hasPropertyManagementPowers: params.hasPropertyManagementPowers,
      canConsentToMedical: params.canConsentToMedical,
      canConsentToMarriage: params.canConsentToMarriage,
      restrictions: params.restrictions,
      bondRequired: params.bondRequired,
      bondAmountKES: params.bondAmountKES,
      customaryLawApplies: this.props.customaryLawApplies,
      customaryDetails: this.props.customaryDetails,
    });

    // Create new guardians map with new guardian
    const newGuardians = new Map(this.props.guardians);
    newGuardians.set(params.guardianId, coGuardian);

    // Update props
    this.updateProps({
      guardians: newGuardians,
    });

    this.addDomainEvent(
      new MultipleGuardiansAssignedEvent(
        this._id.toString(),
        'GuardianshipAggregate',
        this._version,
        {
          guardianshipId: this._id.toString(),
          wardId: this.props.wardInfo.wardId,
          newGuardianId: params.guardianId,
          guardianType: params.type,
          appointmentDate: params.appointmentDate,
          totalGuardians: newGuardians.size,
        },
      ),
    );
  }

  /**
   * Replace Guardian with proper bond handling
   */
  public replaceGuardian(params: {
    outgoingGuardianId: string;
    replacementGuardianId: string;
    replacementEligibility: GuardianEligibilityInfo;
    reason: TerminationReason;
    appointmentDate: Date;
    courtOrderNumber?: string;
  }): void {
    this.ensureNotDeleted();
    this.ensureActive();

    // Find outgoing guardian
    const outgoingGuardian = this.props.guardians.get(params.outgoingGuardianId);
    if (!outgoingGuardian) {
      throw new GuardianNotFoundException(params.outgoingGuardianId);
    }

    // Validate replacement eligibility
    GuardianshipAggregate.validateGuardianEligibility(params.replacementEligibility);

    // Replacement cannot be ward
    if (params.replacementGuardianId === this.props.wardInfo.wardId) {
      throw new InvalidGuardianshipException('A person cannot be their own guardian');
    }

    // Terminate outgoing guardian (create new instance)
    const terminatedOutgoingGuardian = this.cloneGuardianWithUpdates(outgoingGuardian, {
      isActive: false,
      terminationDate: new Date(),
      terminationReason: params.reason,
    });

    // Create replacement guardian with same powers
    const powers = outgoingGuardian.getPowers();
    const replacementGuardian = Guardian.create({
      wardId: this.props.wardInfo.wardId,
      guardianId: params.replacementGuardianId,
      guardianshipId: this._id.toString(),
      type: outgoingGuardian.type,
      appointmentDate: params.appointmentDate,
      courtOrderNumber: params.courtOrderNumber,
      hasPropertyManagementPowers: powers.hasPropertyManagementPowers,
      canConsentToMedical: powers.canConsentToMedical,
      canConsentToMarriage: powers.canConsentToMarriage,
      restrictions: [...powers.restrictions],
      bondRequired: outgoingGuardian.requiresBond(),
      bondAmountKES: outgoingGuardian.getBond()?.amount.getAmount(),
      annualAllowanceKES: outgoingGuardian.props.annualAllowance?.getAmount(),
      customaryLawApplies: this.props.customaryLawApplies,
      customaryDetails: this.props.customaryDetails,
    });

    // If outgoing guardian had bond, post bond for replacement
    if (outgoingGuardian.isBondPosted() && replacementGuardian.requiresBond()) {
      const oldBond = outgoingGuardian.getBond()!;
      const newExpiryDate = new Date();
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1); // 1 year from now

      try {
        // Create a new instance with bond posted
        const guardianWithBond = Guardian.fromPersistence(
          replacementGuardian.id.toString(),
          {
            ...replacementGuardian.props,
            bond: replacementGuardian.getBond(), // Should be undefined initially
          },
          replacementGuardian.createdAt,
        );

        (guardianWithBond as any).postBond({
          provider: oldBond.provider,
          policyNumber: `RENEWAL-${oldBond.policyNumber}`,
          amountKES: oldBond.amount.getAmount(),
          expiryDate: newExpiryDate,
        });

        // Replace with guardian who has bond
        Object.assign(replacementGuardian, guardianWithBond);
      } catch (error) {
        // If bond posting fails, still continue but add warning
        this.addComplianceWarning(`Failed to post bond for replacement guardian: ${error.message}`);
      }
    }

    // Create new guardians map
    const newGuardians = new Map(this.props.guardians);
    newGuardians.set(params.outgoingGuardianId, terminatedOutgoingGuardian);
    newGuardians.set(params.replacementGuardianId, replacementGuardian);

    // Determine new primary guardian ID
    let newPrimaryGuardianId = this.props.primaryGuardianId;
    if (this.props.primaryGuardianId === params.outgoingGuardianId) {
      newPrimaryGuardianId = params.replacementGuardianId;
    }

    // Update props
    this.updateProps({
      guardians: newGuardians,
      primaryGuardianId: newPrimaryGuardianId,
    });

    this.addDomainEvent(
      new GuardianReplacedEvent(this._id.toString(), 'GuardianshipAggregate', this._version, {
        guardianshipId: this._id.toString(),
        wardId: this.props.wardInfo.wardId,
        outgoingGuardianId: params.outgoingGuardianId,
        replacementGuardianId: params.replacementGuardianId,
        reason: params.reason,
        appointmentDate: params.appointmentDate,
      }),
    );
  }

  /**
   * Remove Guardian (without replacement)
   */
  public removeGuardian(params: {
    guardianId: string;
    reason: TerminationReason;
    terminationDate: Date;
  }): void {
    this.ensureNotDeleted();
    this.ensureActive();

    const guardian = this.props.guardians.get(params.guardianId);
    if (!guardian) {
      throw new GuardianNotFoundException(params.guardianId);
    }

    // Cannot remove last guardian (must dissolve instead)
    if (this.props.guardians.size === 1) {
      throw new InvalidGuardianshipException(
        'Cannot remove last guardian. Use dissolveGuardianship() instead.',
      );
    }

    // Terminate guardian (create new instance)
    const terminatedGuardian = this.cloneGuardianWithUpdates(guardian, {
      isActive: false,
      terminationDate: params.terminationDate,
      terminationReason: params.reason,
    });

    // Create new guardians map
    const newGuardians = new Map(this.props.guardians);
    newGuardians.set(params.guardianId, terminatedGuardian);

    // Determine new primary guardian ID
    let newPrimaryGuardianId = this.props.primaryGuardianId;
    if (this.props.primaryGuardianId === params.guardianId) {
      // Set first remaining ACTIVE guardian as primary
      const remainingGuardianIds = Array.from(newGuardians.keys())
        .filter((id) => id !== params.guardianId)
        .filter((id) => newGuardians.get(id)?.isActive);

      if (remainingGuardianIds.length > 0) {
        newPrimaryGuardianId = remainingGuardianIds[0];
      } else {
        newPrimaryGuardianId = undefined;
      }
    }

    // Update props
    this.updateProps({
      guardians: newGuardians,
      primaryGuardianId: newPrimaryGuardianId,
    });
  }

  // ============================================================================
  // AGGREGATE COMMANDS - LIFECYCLE MANAGEMENT
  // ============================================================================

  /**
   * Update Ward Information (called when ward status changes)
   */
  public updateWardInfo(updatedWardInfo: Partial<WardInfo>): void {
    this.ensureNotDeleted();

    const newWardInfo = {
      ...this.props.wardInfo,
      ...updatedWardInfo,
      updatedAt: new Date(),
    };

    // If guardianship is active, validate ward eligibility
    if (this.props.isActive) {
      try {
        GuardianshipAggregate.validateWardEligibility(newWardInfo);
      } catch (error) {
        // Ward is no longer eligible - automatically dissolve
        this.handleAutomaticDissolution(
          error instanceof WardNotMinorException
            ? 'WARD_REACHED_MAJORITY'
            : error instanceof WardNotFoundException
              ? 'WARD_DECEASED'
              : 'INELIGIBLE_WARD',
          new Date(),
        );
        return;
      }

      // Check if ward reached majority (18 years)
      if (newWardInfo.currentAge >= 18 && this.props.wardInfo.currentAge < 18) {
        this.handleWardReachedMajority(new Date());
        return;
      }
    }

    // Update ward info
    this.updateProps({
      wardInfo: newWardInfo,
    });
  }

  /**
   * Handle Ward Reaching Majority
   */
  public handleWardReachedMajority(majorityDate: Date): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      return;
    }

    // Create new guardians map with terminated guardians
    const newGuardians = new Map<string, Guardian>();
    this.props.guardians.forEach((guardian, guardianId) => {
      if (guardian.isActive) {
        const terminatedGuardian = this.cloneGuardianWithUpdates(guardian, {
          isActive: false,
          terminationDate: majorityDate,
          terminationReason: TerminationReason.WARD_REACHED_MAJORITY,
        });
        newGuardians.set(guardianId, terminatedGuardian);
      } else {
        newGuardians.set(guardianId, guardian);
      }
    });

    // Update props
    this.updateProps({
      isActive: false,
      dissolvedDate: majorityDate,
      dissolutionReason: 'WARD_REACHED_MAJORITY',
      guardians: newGuardians,
    });

    this.addDomainEvent(
      new WardMajorityReachedEvent(this._id.toString(), 'GuardianshipAggregate', this._version, {
        guardianshipId: this._id.toString(),
        wardId: this.props.wardInfo.wardId,
        majorityDate,
      }),
    );

    this.addDomainEvent(
      new GuardianshipDissolvedEvent(this._id.toString(), 'GuardianshipAggregate', this._version, {
        guardianshipId: this._id.toString(),
        wardId: this.props.wardInfo.wardId,
        reason: 'WARD_REACHED_MAJORITY',
        dissolvedDate: majorityDate,
      }),
    );
  }

  /**
   * Handle Ward Death
   */
  public handleWardDeath(deathDate: Date): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      return;
    }

    // Update ward info first
    this.updateProps({
      wardInfo: {
        ...this.props.wardInfo,
        isDeceased: true,
        updatedAt: new Date(),
      },
    });

    // Create new guardians map with terminated guardians
    const newGuardians = new Map<string, Guardian>();
    this.props.guardians.forEach((guardian, guardianId) => {
      if (guardian.isActive) {
        const terminatedGuardian = this.cloneGuardianWithUpdates(guardian, {
          isActive: false,
          terminationDate: deathDate,
          terminationReason: TerminationReason.WARD_DECEASED,
        });
        newGuardians.set(guardianId, terminatedGuardian);
      } else {
        newGuardians.set(guardianId, guardian);
      }
    });

    // Update props
    this.updateProps({
      isActive: false,
      dissolvedDate: deathDate,
      dissolutionReason: 'WARD_DECEASED',
      guardians: newGuardians,
    });

    this.addDomainEvent(
      new GuardianshipDissolvedEvent(this._id.toString(), 'GuardianshipAggregate', this._version, {
        guardianshipId: this._id.toString(),
        wardId: this.props.wardInfo.wardId,
        reason: 'WARD_DECEASED',
        dissolvedDate: deathDate,
      }),
    );
  }

  /**
   * Handle Ward Regaining Capacity
   */
  public handleWardRegainedCapacity(recoveryDate: Date): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      return;
    }

    // Only dissolve if ward is not a minor
    if (this.props.wardInfo.currentAge >= 18) {
      // Update ward info
      this.updateProps({
        wardInfo: {
          ...this.props.wardInfo,
          isIncapacitated: false,
          updatedAt: new Date(),
        },
      });

      // Create new guardians map with terminated guardians
      const newGuardians = new Map<string, Guardian>();
      this.props.guardians.forEach((guardian, guardianId) => {
        if (guardian.isActive) {
          const terminatedGuardian = this.cloneGuardianWithUpdates(guardian, {
            isActive: false,
            terminationDate: recoveryDate,
            terminationReason: TerminationReason.WARD_REGAINED_CAPACITY,
          });
          newGuardians.set(guardianId, terminatedGuardian);
        } else {
          newGuardians.set(guardianId, guardian);
        }
      });

      // Update props
      this.updateProps({
        isActive: false,
        dissolvedDate: recoveryDate,
        dissolutionReason: 'WARD_REGAINED_CAPACITY',
        guardians: newGuardians,
      });

      this.addDomainEvent(
        new GuardianshipDissolvedEvent(
          this._id.toString(),
          'GuardianshipAggregate',
          this._version,
          {
            guardianshipId: this._id.toString(),
            wardId: this.props.wardInfo.wardId,
            reason: 'WARD_REGAINED_CAPACITY',
            dissolvedDate: recoveryDate,
          },
        ),
      );
    }
  }

  /**
   * Dissolve Guardianship (Manual)
   */
  public dissolveGuardianship(params: {
    reason: string;
    dissolvedDate: Date;
    courtOrderNumber?: string;
  }): void {
    this.ensureNotDeleted();
    this.ensureActive();

    // Create new guardians map with terminated guardians
    const newGuardians = new Map<string, Guardian>();
    this.props.guardians.forEach((guardian, guardianId) => {
      if (guardian.isActive) {
        const terminatedGuardian = this.cloneGuardianWithUpdates(guardian, {
          isActive: false,
          terminationDate: params.dissolvedDate,
          terminationReason: TerminationReason.COURT_REMOVAL,
        });
        newGuardians.set(guardianId, terminatedGuardian);
      } else {
        newGuardians.set(guardianId, guardian);
      }
    });

    // Update props
    this.updateProps({
      isActive: false,
      dissolvedDate: params.dissolvedDate,
      dissolutionReason: params.reason,
      guardians: newGuardians,
    });

    this.addDomainEvent(
      new GuardianshipDissolvedEvent(this._id.toString(), 'GuardianshipAggregate', this._version, {
        guardianshipId: this._id.toString(),
        wardId: this.props.wardInfo.wardId,
        reason: params.reason,
        dissolvedDate: params.dissolvedDate,
        courtOrderNumber: params.courtOrderNumber,
      }),
    );
  }

  /**
   * Automatic dissolution handler
   */
  private handleAutomaticDissolution(reason: string, date: Date): void {
    const newGuardians = new Map<string, Guardian>();
    this.props.guardians.forEach((guardian, guardianId) => {
      if (guardian.isActive) {
        const terminatedGuardian = this.cloneGuardianWithUpdates(guardian, {
          isActive: false,
          terminationDate: date,
          terminationReason: TerminationReason.COURT_REMOVAL,
        });
        newGuardians.set(guardianId, terminatedGuardian);
      } else {
        newGuardians.set(guardianId, guardian);
      }
    });

    this.updateProps({
      isActive: false,
      dissolvedDate: date,
      dissolutionReason: reason,
      guardians: newGuardians,
    });

    this.addDomainEvent(
      new GuardianshipDissolvedEvent(this._id.toString(), 'GuardianshipAggregate', this._version, {
        guardianshipId: this._id.toString(),
        wardId: this.props.wardInfo.wardId,
        reason,
        dissolvedDate: date,
      }),
    );
  }

  // ============================================================================
  // AGGREGATE COMMANDS - DELEGATION TO GUARDIANS
  // ============================================================================

  /**
   * Post Bond for Specific Guardian (S.72 LSA)
   */
  public postGuardianBond(params: {
    guardianId: string;
    provider: string;
    policyNumber: string;
    amountKES: number;
    expiryDate: Date;
  }): void {
    this.ensureNotDeleted();
    this.ensureActive();

    const guardian = this.getGuardian(params.guardianId);

    try {
      guardian.postBond({
        provider: params.provider,
        policyNumber: params.policyNumber,
        amountKES: params.amountKES,
        expiryDate: params.expiryDate,
      });

      // Update the guardian in the map with new instance
      const newGuardians = new Map(this.props.guardians);
      newGuardians.set(params.guardianId, guardian);
      this.updateProps({ guardians: newGuardians });
    } catch (error) {
      this.addComplianceWarning(
        `Failed to post bond for guardian ${params.guardianId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * File Annual Report for Specific Guardian (S.73 LSA)
   */
  public fileAnnualReport(params: {
    guardianId: string;
    reportDate: Date;
    summary: string;
    financialStatement?: Record<string, any>;
    approvedBy?: string;
  }): void {
    this.ensureNotDeleted();
    this.ensureActive();

    const guardian = this.getGuardian(params.guardianId);

    try {
      guardian.fileAnnualReport({
        reportDate: params.reportDate,
        summary: params.summary,
        financialStatement: params.financialStatement,
        approvedBy: params.approvedBy,
      });

      // Update the guardian in the map with new instance
      const newGuardians = new Map(this.props.guardians);
      newGuardians.set(params.guardianId, guardian);
      this.updateProps({ guardians: newGuardians });
    } catch (error) {
      this.addComplianceWarning(
        `Failed to file annual report for guardian ${params.guardianId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Grant Property Management Powers to Guardian
   */
  public grantPropertyPowers(params: {
    guardianId: string;
    courtOrderNumber?: string;
    restrictions?: string[];
  }): void {
    this.ensureNotDeleted();
    this.ensureActive();

    const guardian = this.getGuardian(params.guardianId);

    try {
      guardian.grantPropertyManagementPowers({
        courtOrderNumber: params.courtOrderNumber,
        restrictions: params.restrictions,
      });

      // Update the guardian in the map with new instance
      const newGuardians = new Map(this.props.guardians);
      newGuardians.set(params.guardianId, guardian);
      this.updateProps({ guardians: newGuardians });
    } catch (error) {
      this.addComplianceWarning(
        `Failed to grant property powers to guardian ${params.guardianId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update Guardian Allowance
   */
  public updateGuardianAllowance(params: {
    guardianId: string;
    amountKES: number;
    approvedBy: string;
  }): void {
    this.ensureNotDeleted();
    this.ensureActive();

    const guardian = this.getGuardian(params.guardianId);

    try {
      guardian.updateAllowance(params.amountKES, params.approvedBy);

      // Update the guardian in the map with new instance
      const newGuardians = new Map(this.props.guardians);
      newGuardians.set(params.guardianId, guardian);
      this.updateProps({ guardians: newGuardians });
    } catch (error) {
      this.addComplianceWarning(
        `Failed to update allowance for guardian ${params.guardianId}: ${error.message}`,
      );
      throw error;
    }
  }

  // ============================================================================
  // VALIDATION & INVARIANTS
  // ============================================================================

  /**
   * Validate Ward Eligibility
   */
  private static validateWardEligibility(wardInfo: WardInfo): void {
    if (wardInfo.isDeceased) {
      throw new WardNotFoundException(
        `Ward ${wardInfo.wardId} is deceased - cannot appoint guardian`,
      );
    }

    const isMinor = wardInfo.currentAge < 18;
    const isIncapacitated = wardInfo.isIncapacitated;

    if (!isMinor && !isIncapacitated) {
      throw new WardNotMinorException(wardInfo.currentAge);
    }
  }

  /**
   * Validate Guardian Eligibility
   */
  private static validateGuardianEligibility(eligibility: GuardianEligibilityInfo): void {
    if (eligibility.age < 18) {
      throw new GuardianIneligibleException('Guardian must be at least 18 years old');
    }

    if (eligibility.isBankrupt) {
      throw new GuardianIneligibleException('Guardian cannot be bankrupt');
    }

    if (eligibility.isIncapacitated) {
      throw new GuardianIneligibleException('Guardian cannot be incapacitated');
    }

    // Criminal record doesn't automatically disqualify, but requires court review
    if (eligibility.hasCriminalRecord && !eligibility.criminalRecordDetails) {
      throw new GuardianIneligibleException('Criminal record details required for court review');
    }
  }

  /**
   * Validate Customary Law Details
   */
  private static validateCustomaryLawDetails(details: CustomaryLawDetails): void {
    if (!details.ethnicGroup) {
      throw new InvalidGuardianshipException(
        'Ethnic group is required for customary law guardianship',
      );
    }

    if (!details.customaryAuthority) {
      throw new InvalidGuardianshipException(
        'Customary authority is required for customary law guardianship',
      );
    }

    if (!details.elderApprovalRecords || details.elderApprovalRecords.length === 0) {
      throw new InvalidGuardianshipException(
        'At least one elder approval record is required for customary law guardianship',
      );
    }

    // Validate specific ethnic group requirements
    switch (details.ethnicGroup.toUpperCase()) {
      case 'KIKUYU':
        if (!details.elderApprovalRecords.some((record) => record.role.includes('Elder'))) {
          throw new InvalidGuardianshipException(
            'Kikuyu customary guardianship requires elder approval',
          );
        }
        break;
      case 'LUO':
        if (!details.elderApprovalRecords.some((record) => record.role.includes('Clan'))) {
          throw new InvalidGuardianshipException(
            'Luo customary guardianship requires clan head approval',
          );
        }
        break;
      // Add other ethnic groups as needed
    }
  }

  /**
   * Validate Co-Guardian Compatibility
   */
  private validateCoGuardianCompatibility(params: {
    hasPropertyManagementPowers?: boolean;
    canConsentToMedical?: boolean;
    canConsentToMarriage?: boolean;
  }): void {
    const existingGuardians = Array.from(this.props.guardians.values());

    // Check for conflicting marriage consent powers
    const hasExistingMarriageConsent = existingGuardians.some(
      (g) => g.getPowers().canConsentToMarriage,
    );

    if (hasExistingMarriageConsent && params.canConsentToMarriage) {
      throw new MultipleGuardiansException('Only one guardian can have marriage consent powers');
    }

    // Check property management powers consistency
    if (params.hasPropertyManagementPowers) {
      const guardiansWithPropertyPowers = existingGuardians.filter(
        (g) => g.getPowers().hasPropertyManagementPowers,
      );

      if (guardiansWithPropertyPowers.length > 0) {
        // All guardians with property powers must have co-management agreement
        // This would require additional documentation
        this.addComplianceWarning(
          'Multiple guardians with property management powers require co-management agreement',
        );
      }
    }
  }

  /**
   * Aggregate-level validation
   */
  public validate(): void {
    // Must have ward info
    if (!this.props.wardInfo) {
      throw new InvalidGuardianshipException('Ward information is required');
    }

    // Active guardianship must have at least one active guardian
    if (this.props.isActive) {
      const activeGuardians = this.getActiveGuardians();
      if (activeGuardians.length === 0) {
        throw new InvalidGuardianshipException(
          'Active guardianship must have at least one active guardian',
        );
      }

      // Ward must be eligible
      try {
        GuardianshipAggregate.validateWardEligibility(this.props.wardInfo);
      } catch (error) {
        // If ward is ineligible, guardianship should be dissolved
        this.addComplianceWarning(`Ward is no longer eligible: ${error.message}`);
      }

      // All guardians with property powers must have bonds (S.72)
      this.props.guardians.forEach((guardian) => {
        if (guardian.isActive && guardian.requiresBond() && !guardian.isBondPosted()) {
          this.addComplianceWarning(
            `Guardian ${guardian.guardianId.toString()} requires S.72 bond but hasn't posted it`,
          );
        }
      });
    }

    // Validate customary law if applicable
    if (this.props.customaryLawApplies && this.props.customaryDetails) {
      try {
        GuardianshipAggregate.validateCustomaryLawDetails(this.props.customaryDetails);
      } catch (error) {
        this.addComplianceWarning(`Customary law validation failed: ${error.message}`);
      }
    }
  }

  /**
   * Check compliance and update warnings
   */
  public checkCompliance(): void {
    if (!this.props.isActive) return;

    const complianceWarnings: string[] = [];

    // Check S.72 compliance
    const s72Violators = this.getActiveGuardians().filter(
      (g) => g.requiresBond() && (!g.isBondPosted() || g.isBondExpired()),
    );
    if (s72Violators.length > 0) {
      complianceWarnings.push(
        `S.72 LSA Violation: ${s72Violators.length} guardian(s) without valid bond`,
      );
    }

    // Check S.73 compliance
    const overdueReports = this.getActiveGuardians().filter((g) => g.isReportOverdue());
    if (overdueReports.length > 0) {
      complianceWarnings.push(
        `S.73 LSA Violation: ${overdueReports.length} guardian(s) with overdue annual reports`,
      );
    }

    // Check ward eligibility
    if (this.props.wardInfo.currentAge >= 18 && !this.props.wardInfo.isIncapacitated) {
      complianceWarnings.push('Ward has reached majority - guardianship should be dissolved');
    }

    // Check bond expiry warnings
    this.props.guardians.forEach((guardian) => {
      if (guardian.isActive && guardian.isBondPosted()) {
        const bond = guardian.getBond()!;
        const daysUntilExpiry = Math.ceil(
          (bond.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        if (daysUntilExpiry <= 30) {
          complianceWarnings.push(
            `Guardian ${guardian.guardianId.toString()}'s bond expires in ${daysUntilExpiry} days`,
          );
        }
      }
    });

    this.updateProps({
      complianceWarnings,
      lastComplianceCheck: new Date(),
    });
  }

  /**
   * Apply event for event sourcing
   */
  protected applyEvent(event: DomainEvent): void {
    // Increment version for each applied event
    this.incrementVersion();

    switch (event.constructor.name) {
      case 'GuardianshipCreatedEvent':
        this.applyGuardianshipCreated(event as any);
        break;
      case 'GuardianAppointedEvent':
        this.applyGuardianAppointed(event as any);
        break;
      case 'GuardianBondPostedEvent':
        this.applyGuardianBondPosted(event as any);
        break;
      case 'AnnualReportFiledEvent':
        this.applyAnnualReportFiled(event as any);
        break;
      case 'GuardianshipDissolvedEvent':
        this.applyGuardianshipDissolved(event as any);
        break;
      // Add other event handlers as needed
      default:
        console.warn(`Unhandled event type: ${event.constructor.name}`);
    }
  }

  private applyGuardianshipCreated(event: GuardianshipCreatedEvent): void {
    const { payload } = event;
    // State would be reconstructed from event payload
    // This is a simplified implementation
    console.log('Applying GuardianshipCreatedEvent', payload);
  }

  private applyGuardianAppointed(event: GuardianAppointedEvent): void {
    const { payload } = event;
    console.log('Applying GuardianAppointedEvent', payload);
  }

  private applyGuardianBondPosted(event: GuardianBondPostedEvent): void {
    const { payload } = event;
    console.log('Applying GuardianBondPostedEvent', payload);
  }

  private applyAnnualReportFiled(event: AnnualReportFiledEvent): void {
    const { payload } = event;
    console.log('Applying AnnualReportFiledEvent', payload);
  }

  private applyGuardianshipDissolved(event: GuardianshipDissolvedEvent): void {
    const { payload } = event;
    this.updateProps({
      isActive: false,
      dissolvedDate: new Date(payload.dissolvedDate),
      dissolutionReason: payload.reason,
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private ensureActive(): void {
    if (!this.props.isActive) {
      throw new InvalidGuardianshipException(
        'Guardianship is not active - cannot perform this operation',
      );
    }
  }

  private getGuardian(guardianId: string): Guardian {
    const guardian = this.props.guardians.get(guardianId);
    if (!guardian) {
      throw new GuardianNotFoundException(guardianId);
    }
    return guardian;
  }

  private addComplianceWarning(warning: string): void {
    const warnings = [...this.props.complianceWarnings, warning];
    this.updateProps({ complianceWarnings: warnings });
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  get wardId(): string {
    return this.props.wardInfo.wardId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get establishedDate(): Date {
    return this.props.establishedDate;
  }

  get dissolvedDate(): Date | undefined {
    return this.props.dissolvedDate;
  }

  /**
   * Get all active guardians
   */
  public getActiveGuardians(): Guardian[] {
    return Array.from(this.props.guardians.values()).filter((g) => g.isActive);
  }

  /**
   * Get primary guardian
   */
  public getPrimaryGuardian(): Guardian | undefined {
    if (!this.props.primaryGuardianId) return undefined;
    const guardian = this.props.guardians.get(this.props.primaryGuardianId);
    return guardian?.isActive ? guardian : undefined;
  }

  /**
   * Get specific guardian
   */
  public getGuardianById(guardianId: string): Guardian | undefined {
    return this.props.guardians.get(guardianId);
  }

  /**
   * Check if has multiple guardians
   */
  public hasMultipleGuardians(): boolean {
    return this.getActiveGuardians().length > 1;
  }

  /**
   * Check overall S.72 compliance
   */
  public isS72Compliant(): boolean {
    const guardiansWithPowers = this.getActiveGuardians().filter((g) => g.requiresBond());

    if (guardiansWithPowers.length === 0) return true;

    return guardiansWithPowers.every((g) => g.isBondPosted() && !g.isBondExpired());
  }

  /**
   * Check overall S.73 compliance
   */
  public isS73Compliant(): boolean {
    const guardiansRequiringReports = this.getActiveGuardians().filter((g) =>
      g.requiresAnnualReport(),
    );

    if (guardiansRequiringReports.length === 0) return true;

    return guardiansRequiringReports.every((g) => !g.isReportOverdue());
  }

  /**
   * Get overall compliance status
   */
  public getComplianceStatus(): {
    s72Compliant: boolean;
    s73Compliant: boolean;
    isFullyCompliant: boolean;
    warnings: string[];
    lastCheck?: Date;
  } {
    const s72 = this.isS72Compliant();
    const s73 = this.isS73Compliant();

    return {
      s72Compliant: s72,
      s73Compliant: s73,
      isFullyCompliant: s72 && s73,
      warnings: this.props.complianceWarnings,
      lastCheck: this.props.lastComplianceCheck,
    };
  }

  /**
   * Get customary law details
   */
  public getCustomaryLawDetails(): CustomaryLawDetails | undefined {
    return this.props.customaryDetails;
  }

  /**
   * Check if guardianship is under customary law
   */
  public isCustomaryLawGuardianship(): boolean {
    return this.props.customaryLawApplies;
  }

  /**
   * Check if ward is a minor
   */
  public isWardMinor(): boolean {
    return this.props.wardInfo.currentAge < 18;
  }

  /**
   * Serialize to JSON
   */
  public toJSON(): Record<string, any> {
    return {
      id: this._id.toString(),
      wardId: this.props.wardInfo.wardId,
      wardInfo: {
        dateOfBirth: this.props.wardInfo.dateOfBirth.toISOString(),
        currentAge: this.props.wardInfo.currentAge,
        isDeceased: this.props.wardInfo.isDeceased,
        isIncapacitated: this.props.wardInfo.isIncapacitated,
        infoUpdatedAt: this.props.wardInfo.updatedAt.toISOString(),
      },
      guardians: Array.from(this.props.guardians.values()).map((g) => g.toJSON()),
      primaryGuardianId: this.props.primaryGuardianId,
      establishedDate: this.props.establishedDate.toISOString(),
      customaryLawApplies: this.props.customaryLawApplies,
      customaryDetails: this.props.customaryDetails,
      courtOrder: this.props.courtOrder?.toJSON(),
      isActive: this.props.isActive,
      dissolvedDate: this.props.dissolvedDate?.toISOString(),
      dissolutionReason: this.props.dissolutionReason,
      complianceWarnings: this.props.complianceWarnings,
      lastComplianceCheck: this.props.lastComplianceCheck?.toISOString(),

      // Computed properties
      activeGuardiansCount: this.getActiveGuardians().length,
      hasMultipleGuardians: this.hasMultipleGuardians(),
      complianceStatus: this.getComplianceStatus(),
      isWardMinor: this.isWardMinor(),
      isCustomaryLaw: this.isCustomaryLawGuardianship(),

      // Metadata
      version: this._version,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      deletedAt: this._deletedAt?.toISOString(),
    };
  }
}
