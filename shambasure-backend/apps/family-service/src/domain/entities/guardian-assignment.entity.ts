// src/domain/entities/guardian-assignment.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { GuardianContactVO } from '../value-objects/guardian-contact.vo';
import { GuardianshipBondVO } from '../value-objects/guardianship-bond.vo';
import { GuardianshipPowersVO } from '../value-objects/guardianship-powers.vo';

export interface GuardianAssignmentProps {
  // Core Identity
  guardianId: string; // FamilyMember ID
  guardianUserId?: string; // User ID if guardian has account
  guardianName: string; // Denormalized for performance

  // Role Configuration
  role: GuardianRole;
  isPrimary: boolean;
  isAlternate: boolean;
  appointmentDate: Date;
  appointmentSource: GuardianAppointmentSource;

  // Legal Framework
  powers: GuardianshipPowersVO;
  bond?: GuardianshipBondVO;

  // Contact & Communication
  contactInfo: GuardianContactVO;

  // Status & Compliance
  status: GuardianAssignmentStatus;
  activationDate?: Date; // When they become active
  deactivationDate?: Date; // When role ends
  deactivationReason?: string;

  // Performance & Tracking
  lastActivityDate?: Date;
  tasksCompleted: number;
  complianceScore: number; // 0-100

  // 🎯 INNOVATIVE: Conflict of Interest Detection
  conflictOfInterestFlags: ConflictOfInterest[];
  conflictResolution?: string;

  // 🎯 INNOVATIVE: Digital Verification
  digitalSignatureUrl?: string;
  verificationMethod?: 'OTP' | 'BIO' | 'LEGAL' | 'CUSTOMARY';

  // Metadata
  notes?: string;
  specialInstructions?: string;
  courtOrderReference?: string;
}

export enum GuardianRole {
  CARETAKER = 'CARETAKER', // Daily care responsibilities
  PROPERTY_MANAGER = 'PROPERTY_MANAGER', // Manages ward's assets
  EDUCATIONAL_GUARDIAN = 'EDUCATIONAL_GUARDIAN', // School decisions
  MEDICAL_CONSENT = 'MEDICAL_CONSENT', // Healthcare decisions
  LEGAL_REPRESENTATIVE = 'LEGAL_REPRESENTATIVE', // Court representation
  EMERGENCY = 'EMERGENCY', // Temporary emergency authority
  CUSTOMARY = 'CUSTOMARY', // Clan/customary role
}

export enum GuardianAssignmentStatus {
  PENDING = 'PENDING', // Appointed but not yet active
  ACTIVE = 'ACTIVE', // Currently fulfilling role
  SUSPENDED = 'SUSPENDED', // Temporarily inactive
  TERMINATED = 'TERMINATED', // Role ended
  REVOKED = 'REVOKED', // Removed by court/authority
  DECEASED = 'DECEASED', // Guardian passed away
  RESIGNED = 'RESIGNED', // Voluntary resignation
}

export enum GuardianAppointmentSource {
  WILL = 'WILL', // Testamentary appointment
  COURT = 'COURT', // Court order
  FAMILY_AGREEMENT = 'FAMILY_AGREEMENT', // Family consensus
  CUSTOMARY_COUNCIL = 'CUSTOMARY_COUNCIL', // Clan elders
  EMERGENCY = 'EMERGENCY', // Emergency situation
  MUTUAL = 'MUTUAL', // Mutual agreement
}

export interface ConflictOfInterest {
  type: ConflictType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  mitigationPlan?: string;
}

export enum ConflictType {
  FINANCIAL_INTEREST = 'FINANCIAL_INTEREST', // Guardian benefits financially
  RELATIONSHIP_CONFLICT = 'RELATIONSHIP_CONFLICT', // Personal relationship affects judgment
  COMPETING_GUARDIANSHIP = 'COMPETING_GUARDIANSHIP', // Multiple conflicting roles
  ASSET_CONFLICT = 'ASSET_CONFLICT', // Guardian has interest in ward's assets
  LEGAL_CONFLICT = 'LEGAL_CONFLICT', // Conflicting legal obligations
  FAMILY_CONFLICT = 'FAMILY_CONFLICT', // Family disputes affecting role
}

export class GuardianAssignmentEntity extends Entity<GuardianAssignmentProps> {
  constructor(id: UniqueEntityID, props: GuardianAssignmentProps) {
    super(id, props);
    this.validate();
  }

  private validate(): void {
    this.ensureNotDeleted();

    // Validate appointment date
    if (this.props.appointmentDate > new Date()) {
      throw new Error('Appointment date cannot be in the future');
    }

    // Validate deactivation date
    if (this.props.deactivationDate && this.props.deactivationDate <= this.props.appointmentDate) {
      throw new Error('Deactivation date must be after appointment date');
    }

    // Validate activation date if set
    if (this.props.activationDate && this.props.activationDate < this.props.appointmentDate) {
      throw new Error('Activation date cannot be before appointment date');
    }

    // Validate role configuration
    if (this.props.isPrimary && this.props.isAlternate) {
      throw new Error('Guardian cannot be both primary and alternate');
    }

    // Validate compliance score
    if (this.props.complianceScore < 0 || this.props.complianceScore > 100) {
      throw new Error('Compliance score must be between 0 and 100');
    }
  }

  // 🎯 INNOVATIVE: Smart activation system
  public activate(activationDate: Date = new Date()): void {
    if (this.props.status === GuardianAssignmentStatus.ACTIVE) {
      throw new Error('Guardian assignment is already active');
    }

    if (
      this.props.status === GuardianAssignmentStatus.TERMINATED ||
      this.props.status === GuardianAssignmentStatus.REVOKED ||
      this.props.status === GuardianAssignmentStatus.DECEASED
    ) {
      throw new Error('Cannot activate a terminated, revoked, or deceased guardian');
    }

    // Check for unresolved critical conflicts
    const criticalConflicts = this.props.conflictOfInterestFlags.filter(
      (conflict) => conflict.severity === 'CRITICAL' && !conflict.resolvedAt,
    );

    if (criticalConflicts.length > 0) {
      throw new Error('Cannot activate guardian with unresolved critical conflicts');
    }

    this.props.activationDate = activationDate;
    this.props.status = GuardianAssignmentStatus.ACTIVE;
    this.props.lastActivityDate = activationDate;

    this.incrementVersion();
    this.addDomainEvent({
      type: 'GUARDIAN_ASSIGNMENT_ACTIVATED',
      payload: {
        assignmentId: this.id.toString(),
        guardianId: this.props.guardianId,
        activationDate,
      },
    });
  }

  // 🎯 INNOVATIVE: Smart deactivation with reason tracking
  public deactivate(reason: string, effectiveDate: Date = new Date()): void {
    if (
      this.props.status !== GuardianAssignmentStatus.ACTIVE &&
      this.props.status !== GuardianAssignmentStatus.PENDING
    ) {
      throw new Error('Can only deactivate active or pending assignments');
    }

    if (effectiveDate < this.props.appointmentDate) {
      throw new Error('Deactivation date cannot be before appointment date');
    }

    // Check if this is the primary guardian
    if (this.props.isPrimary && this.props.status === GuardianAssignmentStatus.ACTIVE) {
      // Log a warning but allow - aggregate root will handle primary guardian replacement
      console.warn('Deactivating primary guardian. Ensure replacement is appointed.');
    }

    this.props.deactivationDate = effectiveDate;
    this.props.deactivationReason = reason;
    this.props.status = GuardianAssignmentStatus.TERMINATED;
    this.props.lastActivityDate = effectiveDate;

    this.incrementVersion();
    this.addDomainEvent({
      type: 'GUARDIAN_ASSIGNMENT_DEACTIVATED',
      payload: {
        assignmentId: this.id.toString(),
        guardianId: this.props.guardianId,
        reason,
        effectiveDate,
        wasPrimary: this.props.isPrimary,
      },
    });
  }

  // 🎯 INNOVATIVE: Conflict of interest detection and management
  public addConflictOfInterest(
    type: ConflictType,
    description: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
  ): ConflictOfInterest {
    const conflict: ConflictOfInterest = {
      type,
      severity,
      description,
      detectedAt: new Date(),
    };

    this.props.conflictOfInterestFlags.push(conflict);
    this.props.complianceScore = Math.max(
      0,
      this.props.complianceScore - this.getConflictPenalty(severity),
    );

    this.incrementVersion();
    this.addDomainEvent({
      type: 'CONFLICT_OF_INTEREST_DETECTED',
      payload: {
        assignmentId: this.id.toString(),
        conflictType: type,
        severity,
        description,
      },
    });

    // Auto-suspend for critical conflicts
    if (severity === 'CRITICAL' && this.props.status === GuardianAssignmentStatus.ACTIVE) {
      this.suspend('Critical conflict of interest detected');
    }

    return conflict;
  }

  public resolveConflict(index: number, resolution: string, mitigationPlan?: string): void {
    if (index < 0 || index >= this.props.conflictOfInterestFlags.length) {
      throw new Error('Invalid conflict index');
    }

    const conflict = this.props.conflictOfInterestFlags[index];
    if (conflict.resolvedAt) {
      throw new Error('Conflict already resolved');
    }

    conflict.resolvedAt = new Date();
    conflict.mitigationPlan = mitigationPlan;
    conflict.resolution = resolution;

    // Restore compliance score
    this.props.complianceScore = Math.min(
      100,
      this.props.complianceScore + this.getConflictPenalty(conflict.severity),
    );

    this.incrementVersion();
    this.addDomainEvent({
      type: 'CONFLICT_OF_INTEREST_RESOLVED',
      payload: {
        assignmentId: this.id.toString(),
        conflictType: conflict.type,
        resolution,
      },
    });

    // Auto-reactivate if was suspended due to critical conflict
    if (
      conflict.severity === 'CRITICAL' &&
      this.props.status === GuardianAssignmentStatus.SUSPENDED
    ) {
      this.reactivate();
    }
  }

  private getConflictPenalty(severity: string): number {
    const penalties = {
      LOW: 5,
      MEDIUM: 15,
      HIGH: 30,
      CRITICAL: 50,
    };
    return penalties[severity] || 10;
  }

  // 🎯 INNOVATIVE: Smart suspension system
  public suspend(reason: string): void {
    if (this.props.status !== GuardianAssignmentStatus.ACTIVE) {
      throw new Error('Can only suspend active guardians');
    }

    this.props.status = GuardianAssignmentStatus.SUSPENDED;
    this.props.lastActivityDate = new Date();

    this.incrementVersion();
    this.addDomainEvent({
      type: 'GUARDIAN_ASSIGNMENT_SUSPENDED',
      payload: {
        assignmentId: this.id.toString(),
        reason,
        suspensionDate: new Date(),
      },
    });
  }

  public reactivate(): void {
    if (this.props.status !== GuardianAssignmentStatus.SUSPENDED) {
      throw new Error('Can only reactivate suspended guardians');
    }

    this.props.status = GuardianAssignmentStatus.ACTIVE;
    this.props.lastActivityDate = new Date();

    this.incrementVersion();
    this.addDomainEvent({
      type: 'GUARDIAN_ASSIGNMENT_REACTIVATED',
      payload: {
        assignmentId: this.id.toString(),
        reactivationDate: new Date(),
      },
    });
  }

  // 🎯 INNOVATIVE: Task tracking and performance metrics
  public recordTaskCompletion(
    taskType: string,
    complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX' = 'MEDIUM',
  ): void {
    this.props.tasksCompleted++;
    this.props.lastActivityDate = new Date();

    // Update compliance score based on task completion
    const scoreIncrement = complexity === 'COMPLEX' ? 2 : complexity === 'MEDIUM' ? 1 : 0.5;
    this.props.complianceScore = Math.min(100, this.props.complianceScore + scoreIncrement);

    this.incrementVersion();
    this.addDomainEvent({
      type: 'GUARDIAN_TASK_COMPLETED',
      payload: {
        assignmentId: this.id.toString(),
        taskType,
        complexity,
        newScore: this.props.complianceScore,
      },
    });
  }

  // 🎯 INNOVATIVE: Power modification with validation
  public updatePowers(newPowers: GuardianshipPowersVO): void {
    if (
      this.props.status !== GuardianAssignmentStatus.ACTIVE &&
      this.props.status !== GuardianAssignmentStatus.PENDING
    ) {
      throw new Error('Can only update powers for active or pending assignments');
    }

    // Validate power reduction doesn't violate existing responsibilities
    if (this.props.powers.canManageProperty && !newPowers.getValue().canManageProperty) {
      throw new Error('Cannot remove property management powers without court order');
    }

    this.props.powers = newPowers;
    this.props.lastActivityDate = new Date();

    this.incrementVersion();
    this.addDomainEvent({
      type: 'GUARDIAN_POWERS_UPDATED',
      payload: {
        assignmentId: this.id.toString(),
        oldPowers: this.props.powers.toJSON(),
        newPowers: newPowers.toJSON(),
      },
    });
  }

  // 🎯 INNOVATIVE: Bond management
  public updateBond(bond: GuardianshipBondVO): void {
    this.props.bond = bond;
    this.props.lastActivityDate = new Date();

    this.incrementVersion();
    this.addDomainEvent({
      type: 'GUARDIAN_BOND_UPDATED',
      payload: {
        assignmentId: this.id.toString(),
        bondStatus: bond.getValue().status,
        amount: bond.getValue().amount,
      },
    });
  }

  // 🎯 INNOVATIVE: Emergency contact update with verification
  public updateContactInfo(contactInfo: GuardianContactVO, verifiedBy?: string): void {
    this.props.contactInfo = contactInfo;
    this.props.lastActivityDate = new Date();

    this.incrementVersion();
    this.addDomainEvent({
      type: 'GUARDIAN_CONTACT_UPDATED',
      payload: {
        assignmentId: this.id.toString(),
        verifiedBy,
        newPhone: contactInfo.getValue().primaryPhone,
      },
    });
  }

  // 🎯 INNOVATIVE: Status check with health indicators
  public getHealthIndicator(): {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    reasons: string[];
    recommendations: string[];
  } {
    const reasons: string[] = [];
    const recommendations: string[] = [];

    // Check compliance score
    if (this.props.complianceScore < 60) {
      reasons.push(`Low compliance score: ${this.props.complianceScore}`);
      recommendations.push('Complete pending tasks and address conflicts');
    }

    // Check for unresolved conflicts
    const unresolvedConflicts = this.props.conflictOfInterestFlags.filter((c) => !c.resolvedAt);
    if (unresolvedConflicts.length > 0) {
      reasons.push(`${unresolvedConflicts.length} unresolved conflicts`);
      recommendations.push('Resolve conflicts of interest immediately');
    }

    // Check activity
    if (this.props.status === GuardianAssignmentStatus.ACTIVE) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (!this.props.lastActivityDate || this.props.lastActivityDate < thirtyDaysAgo) {
        reasons.push('No activity in last 30 days');
        recommendations.push('Update activity or review guardian engagement');
      }
    }

    // Check bond status if required
    if (this.props.powers.requiresPropertyBond() && this.props.bond) {
      const bondStatus = this.props.bond.getValue().status;
      if (bondStatus === 'REQUIRED' || bondStatus === 'FORFEITED') {
        reasons.push(`Bond status: ${bondStatus}`);
        recommendations.push('Post or renew guardian bond');
      }
    }

    // Determine overall status
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

    if (reasons.length > 0) {
      const hasCritical = unresolvedConflicts.some((c) => c.severity === 'CRITICAL');
      const hasHigh = unresolvedConflicts.some((c) => c.severity === 'HIGH');

      if (hasCritical || this.props.complianceScore < 40) {
        status = 'CRITICAL';
      } else if (hasHigh || this.props.complianceScore < 60) {
        status = 'WARNING';
      } else {
        status = 'WARNING';
      }
    }

    return { status, reasons, recommendations };
  }

  // 🎯 INNOVATIVE: Generate guardian report
  public generateReport(): {
    summary: Record<string, any>;
    activities: Array<{ date: Date; type: string; details: string }>;
    conflicts: ConflictOfInterest[];
    recommendations: string[];
  } {
    const health = this.getHealthIndicator();

    return {
      summary: {
        guardianName: this.props.guardianName,
        role: this.props.role,
        status: this.props.status,
        appointmentDate: this.props.appointmentDate,
        tasksCompleted: this.props.tasksCompleted,
        complianceScore: this.props.complianceScore,
        healthStatus: health.status,
      },
      activities: this.generateActivityLog(),
      conflicts: this.props.conflictOfInterestFlags,
      recommendations: health.recommendations,
    };
  }

  private generateActivityLog(): Array<{ date: Date; type: string; details: string }> {
    // This would be populated from domain events in a real implementation
    return [
      {
        date: this.props.appointmentDate,
        type: 'APPOINTMENT',
        details: `Appointed as ${this.props.role} by ${this.props.appointmentSource}`,
      },
      ...(this.props.activationDate
        ? [
            {
              date: this.props.activationDate,
              type: 'ACTIVATION',
              details: 'Guardian assignment activated',
            },
          ]
        : []),
      ...(this.props.lastActivityDate
        ? [
            {
              date: this.props.lastActivityDate,
              type: 'LAST_ACTIVITY',
              details: 'Last recorded activity',
            },
          ]
        : []),
    ];
  }

  // Getters for easy access
  get guardianId(): string {
    return this.props.guardianId;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get status(): GuardianAssignmentStatus {
    return this.props.status;
  }

  get powers(): GuardianshipPowersVO {
    return this.props.powers;
  }

  get complianceScore(): number {
    return this.props.complianceScore;
  }

  get hasActiveConflicts(): boolean {
    return this.props.conflictOfInterestFlags.some((conflict) => !conflict.resolvedAt);
  }

  // 🎯 INNOVATIVE: Factory method for creating assignments
  public static create(
    props: Omit<
      GuardianAssignmentProps,
      'status' | 'tasksCompleted' | 'complianceScore' | 'conflictOfInterestFlags'
    > & {
      id?: string;
    },
  ): GuardianAssignmentEntity {
    const defaultProps: Partial<GuardianAssignmentProps> = {
      status: GuardianAssignmentStatus.PENDING,
      tasksCompleted: 0,
      complianceScore: 100, // Start with perfect score
      conflictOfInterestFlags: [],
    };

    const entityProps: GuardianAssignmentProps = {
      ...props,
      ...defaultProps,
    } as GuardianAssignmentProps;

    return new GuardianAssignmentEntity(new UniqueEntityID(props.id), entityProps);
  }

  // 🎯 INNOVATIVE: Clone for alternate guardian creation
  public cloneForAlternate(
    alternateGuardianId: string,
    alternateGuardianName: string,
  ): GuardianAssignmentEntity {
    const alternateProps: GuardianAssignmentProps = {
      ...this.props,
      guardianId: alternateGuardianId,
      guardianName: alternateGuardianName,
      isPrimary: false,
      isAlternate: true,
      status: GuardianAssignmentStatus.PENDING,
      activationDate: undefined,
      deactivationDate: undefined,
      deactivationReason: undefined,
      tasksCompleted: 0,
      complianceScore: 100,
      conflictOfInterestFlags: [],
    };

    return new GuardianAssignmentEntity(new UniqueEntityID(), alternateProps);
  }
}
