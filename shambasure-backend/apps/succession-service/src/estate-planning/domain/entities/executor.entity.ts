import { AggregateRoot } from '@nestjs/cqrs';
import {
  ExecutorAppointmentType,
  ExecutorCompensationType,
  ExecutorEligibilityStatus,
  ExecutorStatus,
} from '@prisma/client';

import { ExecutorAcceptedEvent } from '../events/executor-accepted.event';
import { ExecutorDeclinedEvent } from '../events/executor-declined.event';
import { ExecutorEligibilityVerifiedEvent } from '../events/executor-eligibility-verified.event';
import { ExecutorNominatedEvent } from '../events/executor-nominated.event';
import { ExecutorRemovedEvent } from '../events/executor-removed.event';

/**
 * Properties required for entity reconstitution from persistence
 * Strictly aligned with Prisma Schema.
 */
export interface ExecutorReconstituteProps {
  id: string;
  willId: string;

  // Identity
  executorId: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  idNumber: string | null;
  kraPin: string | null;

  // Professional executor details
  isProfessional: boolean;
  professionalQualification: string | null;
  practicingCertificateNumber: string | null;

  // Relationship context
  relationship: string | null;
  relationshipDuration: string | null;

  // Address Information
  physicalAddress: Record<string, any> | null;
  postalAddress: Record<string, any> | null;

  // Role Configuration
  isPrimary: boolean;
  orderOfPriority: number;
  appointmentType: ExecutorAppointmentType;

  // Legal Eligibility (Kenyan Law of Succession Act)
  eligibilityStatus: ExecutorEligibilityStatus;
  eligibilityVerifiedAt: Date | string | null;
  eligibilityVerifiedBy: string | null;
  ineligibilityReason: string | null;

  // Appointment & Service Timeline
  status: ExecutorStatus;
  nominatedAt: Date | string | null;
  appointedAt: Date | string | null;
  acceptedAt: Date | string | null;
  declinedAt: Date | string | null;
  declineReason: string | null;
  removedAt: Date | string | null;
  removalReason: string | null;
  completedAt: Date | string | null;

  // Compensation (Kenyan Law of Succession Act Section 83)
  isCompensated: boolean;
  compensationType: ExecutorCompensationType;
  compensationAmount: number | null;
  compensationPercentage: number | null;
  hourlyRate: number | null;
  estimatedHours: number | null;
  courtApprovedCompensation: boolean;

  // Bond & Security (Kenyan Probate Practice)
  requiresBond: boolean;
  bondAmount: number | null;
  bondProvided: boolean;
  bondProvider: string | null;
  bondExpiryDate: Date | string | null;

  // Duties & Responsibilities
  specificDuties: string | null;
  limitations: string | null;
  specialPowers: string | null;

  // Communication Preferences
  preferredContactMethod: string | null;
  languagePreference: string;

  // Audit Trail
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Executor Entity
 *
 * Represents the person appointed to administer the estate of a deceased person.
 *
 * Legal Context:
 * - Governed by Law of Succession Act (Cap 160).
 * - Section 6: Jurisdiction.
 * - Section 83: Duties of Personal Representatives.
 * - Probate & Administration Rules (Section 80A for bonds).
 */
export class Executor extends AggregateRoot {
  // Core Identity
  private readonly _id: string;
  private readonly _willId: string;

  // Identity
  private _executorId: string | null; // Linked User
  private _fullName: string | null;
  private _email: string | null;
  private _phone: string | null;
  private _idNumber: string | null;
  private _kraPin: string | null;

  // Professional Details
  private _isProfessional: boolean;
  private _professionalQualification: string | null;
  private _practicingCertificateNumber: string | null;

  // Relationship
  private _relationship: string | null;
  private _relationshipDuration: string | null;

  // Address
  private _physicalAddress: Record<string, any> | null;
  private _postalAddress: Record<string, any> | null;

  // Role Configuration
  private _isPrimary: boolean;
  private _orderOfPriority: number;
  private _appointmentType: ExecutorAppointmentType;

  // Eligibility
  private _eligibilityStatus: ExecutorEligibilityStatus;
  private _eligibilityVerifiedAt: Date | null;
  private _eligibilityVerifiedBy: string | null;
  private _ineligibilityReason: string | null;

  // Timeline
  private _status: ExecutorStatus;
  private _nominatedAt: Date | null;
  private _appointedAt: Date | null;
  private _acceptedAt: Date | null;
  private _declinedAt: Date | null;
  private _declineReason: string | null;
  private _removedAt: Date | null;
  private _removalReason: string | null;
  private _completedAt: Date | null;

  // Compensation (Section 83)
  private _isCompensated: boolean;
  private _compensationType: ExecutorCompensationType;
  private _compensationAmount: number | null;
  private _compensationPercentage: number | null;
  private _hourlyRate: number | null;
  private _estimatedHours: number | null;
  private _courtApprovedCompensation: boolean;

  // Bond (Probate Rules)
  private _requiresBond: boolean;
  private _bondAmount: number | null;
  private _bondProvided: boolean;
  private _bondProvider: string | null;
  private _bondExpiryDate: Date | null;

  // Duties
  private _specificDuties: string | null;
  private _limitations: string | null;
  private _specialPowers: string | null;

  // Preferences
  private _preferredContactMethod: string | null;
  private _languagePreference: string;

  // Timestamps
  private _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    willId: string,
    appointmentType: ExecutorAppointmentType = ExecutorAppointmentType.TESTAMENTARY,
    languagePreference: string = 'English',
  ) {
    super();

    if (!id?.trim()) throw new Error('Executor ID is required');
    if (!willId?.trim()) throw new Error('Will ID is required');

    this._id = id;
    this._willId = willId;
    this._appointmentType = appointmentType;
    this._languagePreference = languagePreference;

    // Defaults
    this._executorId = null;
    this._fullName = null;
    this._email = null;
    this._phone = null;
    this._idNumber = null;
    this._kraPin = null;
    this._isProfessional = false;
    this._professionalQualification = null;
    this._practicingCertificateNumber = null;
    this._relationship = null;
    this._relationshipDuration = null;
    this._physicalAddress = null;
    this._postalAddress = null;
    this._isPrimary = false;
    this._orderOfPriority = 1;
    this._eligibilityStatus = ExecutorEligibilityStatus.PENDING_VERIFICATION;
    this._eligibilityVerifiedAt = null;
    this._eligibilityVerifiedBy = null;
    this._ineligibilityReason = null;
    this._status = ExecutorStatus.NOMINATED;
    this._nominatedAt = new Date();
    this._appointedAt = null;
    this._acceptedAt = null;
    this._declinedAt = null;
    this._declineReason = null;
    this._removedAt = null;
    this._removalReason = null;
    this._completedAt = null;
    this._isCompensated = false;
    this._compensationType = ExecutorCompensationType.NONE;
    this._compensationAmount = null;
    this._compensationPercentage = null;
    this._hourlyRate = null;
    this._estimatedHours = null;
    this._courtApprovedCompensation = false;
    this._requiresBond = false;
    this._bondAmount = null;
    this._bondProvided = false;
    this._bondProvider = null;
    this._bondExpiryDate = null;
    this._specificDuties = null;
    this._limitations = null;
    this._specialPowers = null;
    this._preferredContactMethod = null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static createForUser(
    id: string,
    willId: string,
    executorId: string,
    relationship?: string,
    isPrimary: boolean = false,
    priority: number = 1,
  ): Executor {
    if (!executorId?.trim()) throw new Error('Executor user ID is required');

    const executor = new Executor(id, willId);
    executor._executorId = executorId;
    executor._relationship = relationship || null;
    executor._isPrimary = isPrimary;
    executor._orderOfPriority = priority;

    executor.apply(
      new ExecutorNominatedEvent(
        executor._id,
        executor._willId,
        executor._executorId,
        null, // No external name for registered user
        'USER',
        executor._isPrimary,
        executor._orderOfPriority,
      ),
    );
    return executor;
  }

  static createForExternal(
    id: string,
    willId: string,
    fullName: string,
    email: string,
    phone: string,
    relationship?: string,
    idNumber?: string,
    kraPin?: string,
    isPrimary: boolean = false,
    priority: number = 1,
  ): Executor {
    if (!fullName?.trim()) throw new Error('Full name required');
    if (!email?.trim()) throw new Error('Email required');

    const executor = new Executor(id, willId);
    executor._fullName = fullName;
    executor._email = email;
    executor._phone = phone;
    executor._relationship = relationship || null;
    executor._idNumber = idNumber || null;
    executor._kraPin = kraPin || null;
    executor._isPrimary = isPrimary;
    executor._orderOfPriority = priority;

    executor.apply(
      new ExecutorNominatedEvent(
        executor._id,
        executor._willId,
        null,
        executor._fullName,
        'EXTERNAL',
        executor._isPrimary,
        executor._orderOfPriority,
      ),
    );
    return executor;
  }

  static createForProfessional(
    id: string,
    willId: string,
    fullName: string,
    email: string,
    phone: string,
    qualification: string,
    certificateNumber: string,
    relationship: string = 'Professional Advisor',
    isPrimary: boolean = false,
    priority: number = 1,
  ): Executor {
    if (!qualification?.trim()) throw new Error('Professional qualification required');
    if (!certificateNumber?.trim()) throw new Error('Practicing certificate required');

    const executor = new Executor(id, willId);
    executor._fullName = fullName;
    executor._email = email;
    executor._phone = phone;
    executor._relationship = relationship;
    executor._isProfessional = true;
    executor._professionalQualification = qualification;
    executor._practicingCertificateNumber = certificateNumber;
    executor._isPrimary = isPrimary;
    executor._orderOfPriority = priority;
    executor._requiresBond = true; // Kenyan courts usually require bonds for administration

    executor.apply(
      new ExecutorNominatedEvent(
        executor._id,
        executor._willId,
        null,
        executor._fullName,
        'PROFESSIONAL',
        executor._isPrimary,
        executor._orderOfPriority,
      ),
    );
    return executor;
  }

  static reconstitute(props: ExecutorReconstituteProps): Executor {
    const executor = new Executor(
      props.id,
      props.willId,
      props.appointmentType,
      props.languagePreference,
    );

    executor._executorId = props.executorId;
    executor._fullName = props.fullName;
    executor._email = props.email;
    executor._phone = props.phone;
    executor._idNumber = props.idNumber;
    executor._kraPin = props.kraPin;
    executor._isProfessional = props.isProfessional;
    executor._professionalQualification = props.professionalQualification;
    executor._practicingCertificateNumber = props.practicingCertificateNumber;
    executor._relationship = props.relationship;
    executor._relationshipDuration = props.relationshipDuration;
    executor._physicalAddress = props.physicalAddress;
    executor._postalAddress = props.postalAddress;
    executor._isPrimary = props.isPrimary;
    executor._orderOfPriority = props.orderOfPriority;
    executor._eligibilityStatus = props.eligibilityStatus;
    executor._ineligibilityReason = props.ineligibilityReason;
    executor._status = props.status;
    executor._declineReason = props.declineReason;
    executor._removalReason = props.removalReason;
    executor._isCompensated = props.isCompensated;
    executor._compensationType = props.compensationType;
    executor._compensationAmount = props.compensationAmount;
    executor._compensationPercentage = props.compensationPercentage;
    executor._hourlyRate = props.hourlyRate;
    executor._estimatedHours = props.estimatedHours;
    executor._courtApprovedCompensation = props.courtApprovedCompensation;
    executor._requiresBond = props.requiresBond;
    executor._bondAmount = props.bondAmount;
    executor._bondProvided = props.bondProvided;
    executor._bondProvider = props.bondProvider;
    executor._specificDuties = props.specificDuties;
    executor._limitations = props.limitations;
    executor._specialPowers = props.specialPowers;
    executor._preferredContactMethod = props.preferredContactMethod;

    executor._eligibilityVerifiedAt = props.eligibilityVerifiedAt
      ? new Date(props.eligibilityVerifiedAt)
      : null;
    executor._nominatedAt = props.nominatedAt ? new Date(props.nominatedAt) : null;
    executor._appointedAt = props.appointedAt ? new Date(props.appointedAt) : null;
    executor._acceptedAt = props.acceptedAt ? new Date(props.acceptedAt) : null;
    executor._declinedAt = props.declinedAt ? new Date(props.declinedAt) : null;
    executor._removedAt = props.removedAt ? new Date(props.removedAt) : null;
    executor._completedAt = props.completedAt ? new Date(props.completedAt) : null;
    executor._bondExpiryDate = props.bondExpiryDate ? new Date(props.bondExpiryDate) : null;
    executor._createdAt = new Date(props.createdAt);
    executor._updatedAt = new Date(props.updatedAt);

    if (props.eligibilityVerifiedBy) {
      executor._eligibilityVerifiedBy = props.eligibilityVerifiedBy;
    }

    return executor;
  }

  // --------------------------------------------------------------------------
  // DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  public verifyEligibility(
    verifiedBy: string,
    status: ExecutorEligibilityStatus,
    reason?: string,
  ): void {
    if (this._status !== ExecutorStatus.NOMINATED) {
      // In Kenyan law, eligibility can be challenged even after appointment, but usually, checks happen before.
      // We allow re-verification but logs might be needed.
    }
    this._eligibilityStatus = status;
    this._eligibilityVerifiedAt = new Date();
    this._eligibilityVerifiedBy = verifiedBy;
    this._ineligibilityReason =
      status !== ExecutorEligibilityStatus.ELIGIBLE ? reason || null : null;
    this._updatedAt = new Date();

    this.apply(
      new ExecutorEligibilityVerifiedEvent(
        this._id,
        this._willId,
        status,
        verifiedBy,
        this._eligibilityVerifiedAt,
      ),
    );

    if (status !== ExecutorEligibilityStatus.ELIGIBLE) {
      this._status = ExecutorStatus.DECLINED;
      this._declineReason = `Automatically declined due to ineligibility: ${reason}`;
      this._declinedAt = new Date();
      this.apply(new ExecutorDeclinedEvent(this._id, this._willId, this._declineReason));
    }
  }

  public appoint(
    appointmentType: ExecutorAppointmentType = ExecutorAppointmentType.COURT_APPOINTED,
  ): void {
    if (this._status !== ExecutorStatus.NOMINATED && this._status !== ExecutorStatus.ACTIVE) {
      // Allow idempotency if already ACTIVE, but ensure correct transitions
    }
    if (this._eligibilityStatus !== ExecutorEligibilityStatus.ELIGIBLE) {
      throw new Error('Cannot appoint ineligible executor');
    }
    this._status = ExecutorStatus.ACTIVE;
    this._appointmentType = appointmentType;
    this._appointedAt = new Date();
    this._updatedAt = new Date();
  }

  public accept(): void {
    if (this._status !== ExecutorStatus.NOMINATED) {
      throw new Error('Only nominated executors can accept');
    }
    if (this._requiresBond && !this._bondProvided) {
      throw new Error('Bond must be provided before acceptance (Probate & Administration Rules)');
    }
    this._status = ExecutorStatus.ACTIVE;
    this._acceptedAt = new Date();
    this._updatedAt = new Date();
    this.apply(new ExecutorAcceptedEvent(this._id, this._willId, this._acceptedAt));
  }

  public decline(reason: string): void {
    if (this._status === ExecutorStatus.COMPLETED) throw new Error('Cannot decline completed role');
    if (!reason?.trim()) throw new Error('Decline reason required');

    this._status = ExecutorStatus.DECLINED;
    this._declinedAt = new Date();
    this._declineReason = reason.trim();
    this._updatedAt = new Date();
    this.apply(new ExecutorDeclinedEvent(this._id, this._willId, this._declineReason));
  }

  public remove(reason: string, removedBy?: string): void {
    if (!reason?.trim()) throw new Error('Removal reason required');
    // Section 76 of Law of Succession Act: Revocation of Grant.
    // A grant can be revoked by court. The "removedBy" here implies a system user recording that court order.
    this._status = ExecutorStatus.REMOVED;
    this._removedAt = new Date();
    this._removalReason = reason.trim();
    this._updatedAt = new Date();
    this.apply(new ExecutorRemovedEvent(this._id, this._willId, this._removalReason, removedBy));
  }

  public markAsCompleted(): void {
    if (this._status !== ExecutorStatus.ACTIVE) throw new Error('Executor not active');
    // Ensure accounts are filed? This entity doesn't know about accounts.
    this._status = ExecutorStatus.COMPLETED;
    this._completedAt = new Date();
    this._updatedAt = new Date();
  }

  public setCompensation(
    type: ExecutorCompensationType,
    amount?: number,
    percentage?: number,
    hourlyRate?: number,
    estimatedHours?: number,
  ): void {
    if (!this.canBeCompensated()) throw new Error('Executor status prevents compensation setup');
    this._compensationType = type;
    this._isCompensated = true;

    // Reset others
    this._compensationAmount = null;
    this._compensationPercentage = null;
    this._hourlyRate = null;
    this._estimatedHours = null;

    if (type === ExecutorCompensationType.FIXED_AMOUNT) {
      if (!amount || amount <= 0) throw new Error('Positive fixed amount required');
      this._compensationAmount = amount;
    } else if (type === ExecutorCompensationType.PERCENTAGE_OF_ESTATE) {
      if (!percentage || percentage <= 0) throw new Error('Valid percentage required');
      this._compensationPercentage = percentage;
    } else if (type === ExecutorCompensationType.HOURLY_RATE) {
      if (!hourlyRate || hourlyRate <= 0) throw new Error('Valid hourly rate required');
      this._hourlyRate = hourlyRate;
      this._estimatedHours = estimatedHours || null;
    } else if (type === ExecutorCompensationType.NONE) {
      this._isCompensated = false;
    }
    this._updatedAt = new Date();
  }

  public obtainCourtApprovalForCompensation(): void {
    if (!this._isCompensated) throw new Error('No compensation set');
    this._courtApprovedCompensation = true;
    this._updatedAt = new Date();
  }

  public setBondRequirement(amount: number, provider?: string, expiryDate?: Date): void {
    this._requiresBond = true;
    this._bondAmount = amount;
    this._bondProvider = provider || null;
    this._bondExpiryDate = expiryDate || null;
    this._updatedAt = new Date();
  }

  public provideBond(): void {
    if (!this._requiresBond) throw new Error('Bond not required');
    this._bondProvided = true;
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS & HELPERS
  // --------------------------------------------------------------------------

  public canBeCompensated(): boolean {
    return (
      this._status === ExecutorStatus.ACTIVE ||
      this._status === ExecutorStatus.COMPLETED ||
      this._status === ExecutorStatus.NOMINATED
    );
  }

  private calculateStatutoryCompensation(estateValue?: number): number | null {
    // Basic logic for Law of Succession Act Statutory Scale (illustrative)
    if (!estateValue) return null;
    if (estateValue <= 1000000) return estateValue * 0.05;
    return 50000 + (estateValue - 1000000) * 0.03;
  }

  // Getters
  get id(): string {
    return this._id;
  }
  get willId(): string {
    return this._willId;
  }
  get executorId(): string | null {
    return this._executorId;
  }
  get fullName(): string | null {
    return this._fullName;
  }
  get email(): string | null {
    return this._email;
  }
  get phone(): string | null {
    return this._phone;
  }
  get idNumber(): string | null {
    return this._idNumber;
  }
  get kraPin(): string | null {
    return this._kraPin;
  }
  get isProfessional(): boolean {
    return this._isProfessional;
  }
  get professionalQualification(): string | null {
    return this._professionalQualification;
  }
  get practicingCertificateNumber(): string | null {
    return this._practicingCertificateNumber;
  }
  get relationship(): string | null {
    return this._relationship;
  }
  get relationshipDuration(): string | null {
    return this._relationshipDuration;
  }
  get physicalAddress(): Record<string, any> | null {
    return this._physicalAddress ? { ...this._physicalAddress } : null;
  }
  get postalAddress(): Record<string, any> | null {
    return this._postalAddress ? { ...this._postalAddress } : null;
  }
  get isPrimary(): boolean {
    return this._isPrimary;
  }
  get orderOfPriority(): number {
    return this._orderOfPriority;
  }
  get appointmentType(): ExecutorAppointmentType {
    return this._appointmentType;
  }
  get eligibilityStatus(): ExecutorEligibilityStatus {
    return this._eligibilityStatus;
  }
  get eligibilityVerifiedAt(): Date | null {
    return this._eligibilityVerifiedAt;
  }
  get eligibilityVerifiedBy(): string | null {
    return this._eligibilityVerifiedBy;
  }
  get ineligibilityReason(): string | null {
    return this._ineligibilityReason;
  }
  get status(): ExecutorStatus {
    return this._status;
  }
  get nominatedAt(): Date | null {
    return this._nominatedAt;
  }
  get appointedAt(): Date | null {
    return this._appointedAt;
  }
  get acceptedAt(): Date | null {
    return this._acceptedAt;
  }
  get declinedAt(): Date | null {
    return this._declinedAt;
  }
  get declineReason(): string | null {
    return this._declineReason;
  }
  get removedAt(): Date | null {
    return this._removedAt;
  }
  get removalReason(): string | null {
    return this._removalReason;
  }
  get completedAt(): Date | null {
    return this._completedAt;
  }
  get isCompensated(): boolean {
    return this._isCompensated;
  }
  get compensationType(): ExecutorCompensationType {
    return this._compensationType;
  }
  get compensationAmount(): number | null {
    return this._compensationAmount;
  }
  get compensationPercentage(): number | null {
    return this._compensationPercentage;
  }
  get hourlyRate(): number | null {
    return this._hourlyRate;
  }
  get estimatedHours(): number | null {
    return this._estimatedHours;
  }
  get courtApprovedCompensation(): boolean {
    return this._courtApprovedCompensation;
  }
  get requiresBond(): boolean {
    return this._requiresBond;
  }
  get bondAmount(): number | null {
    return this._bondAmount;
  }
  get bondProvided(): boolean {
    return this._bondProvided;
  }
  get bondProvider(): string | null {
    return this._bondProvider;
  }
  get bondExpiryDate(): Date | null {
    return this._bondExpiryDate;
  }
  get specificDuties(): string | null {
    return this._specificDuties;
  }
  get limitations(): string | null {
    return this._limitations;
  }
  get specialPowers(): string | null {
    return this._specialPowers;
  }
  get preferredContactMethod(): string | null {
    return this._preferredContactMethod;
  }
  get languagePreference(): string {
    return this._languagePreference;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
}
