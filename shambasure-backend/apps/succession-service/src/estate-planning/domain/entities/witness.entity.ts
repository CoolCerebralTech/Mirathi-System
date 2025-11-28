import { AggregateRoot } from '@nestjs/cqrs';
import {
  SignatureType,
  WitnessEligibilityStatus,
  WitnessStatus,
  WitnessType,
  WitnessVerificationMethod,
} from '@prisma/client';

import { WitnessAddedEvent } from '../events/witness-added.event';
import { WitnessRejectedEvent } from '../events/witness-rejected.event';
import { WitnessSignedEvent } from '../events/witness-signed.event';
import { WitnessVerifiedEvent } from '../events/witness-verified.event';

/**
 * Properties required for entity reconstitution from persistence
 * Strictly aligned with Prisma Schema.
 */
export interface WitnessReconstituteProps {
  id: string;
  willId: string;

  // Witness Type and Identity
  witnessType: WitnessType;
  witnessId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;

  // Kenyan Identification
  idNumber: string | null;
  idType: WitnessVerificationMethod | null;
  idDocumentId: string | null;
  idVerified: boolean;

  // Professional witness details
  isProfessionalWitness: boolean;
  professionalCapacity: string | null;
  professionalLicense: string | null;

  // Relationship Context
  relationship: string | null;
  relationshipDuration: string | null;
  knowsTestatorWell: boolean;

  // Address Information
  physicalAddress: Record<string, any> | null;
  residentialCounty: string | null;

  // Legal Eligibility (Kenyan Law of Succession Act)
  eligibilityStatus: WitnessEligibilityStatus;
  eligibilityVerifiedAt: Date | string | null;
  eligibilityVerifiedBy: string | null;
  ineligibilityReason: string | null;

  // Witnessing Process
  status: WitnessStatus;
  signedAt: Date | string | null;
  signatureType: SignatureType | null;
  signatureData: string | null;
  signatureLocation: string | null;
  witnessingMethod: string | null;

  // Verification
  verifiedAt: Date | string | null;
  verifiedBy: string | null;
  verificationMethod: WitnessVerificationMethod | null;
  verificationNotes: string | null;

  // Legal Requirements Tracking
  isEligible: boolean;
  hasConflictOfInterest: boolean;
  conflictDetails: string | null;
  understandsObligation: boolean;
  obligationAcknowledgedAt: Date | string | null;

  // Communication & Notifications
  invitationSentAt: Date | string | null;
  invitationMethod: string | null;
  reminderSentAt: Date | string | null;
  responseReceivedAt: Date | string | null;

  // Audit Trail
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Witness Entity
 *
 * Represents a witness to the execution of a Will.
 *
 * Legal Context:
 * - Law of Succession Act (Cap 160), Section 11 (Capacity of Witnesses).
 * - Section 13 (Execution of Wills) - requires 2+ witnesses present at same time.
 * - Section 13(c): Witnesses must attest and sign the will in the presence of the testator.
 */
export class Witness extends AggregateRoot {
  // Core Identity
  private readonly _id: string;
  private readonly _willId: string;

  // Identity
  private _witnessType: WitnessType;
  private _witnessId: string | null;
  private _fullName: string;
  private _email: string | null;
  private _phone: string | null;

  // ID
  private _idNumber: string | null;
  private _idType: WitnessVerificationMethod | null;
  private _idDocumentId: string | null;
  private _idVerified: boolean;

  // Professional
  private _isProfessionalWitness: boolean;
  private _professionalCapacity: string | null;
  private _professionalLicense: string | null;

  // Context
  private _relationship: string | null;
  private _relationshipDuration: string | null;
  private _knowsTestatorWell: boolean;

  // Address
  private _physicalAddress: Record<string, any> | null;
  private _residentialCounty: string | null;

  // Eligibility
  private _eligibilityStatus: WitnessEligibilityStatus;
  private _eligibilityVerifiedAt: Date | null;
  private _eligibilityVerifiedBy: string | null;
  private _ineligibilityReason: string | null;

  // Status
  private _status: WitnessStatus;
  private _signedAt: Date | null;
  private _signatureType: SignatureType | null;
  private _signatureData: string | null;
  private _signatureLocation: string | null;
  private _witnessingMethod: string | null;

  // Verification
  private _verifiedAt: Date | null;
  private _verifiedBy: string | null;
  private _verificationMethod: WitnessVerificationMethod | null;
  private _verificationNotes: string | null;

  // Legal Compliance
  private _isEligible: boolean;
  private _hasConflictOfInterest: boolean;
  private _conflictDetails: string | null;
  private _understandsObligation: boolean;
  private _obligationAcknowledgedAt: Date | null;

  // Comms
  private _invitationSentAt: Date | null;
  private _invitationMethod: string | null;
  private _reminderSentAt: Date | null;
  private _responseReceivedAt: Date | null;

  // Timestamps
  private _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(id: string, willId: string, witnessType: WitnessType, fullName: string) {
    super();

    if (!id?.trim()) throw new Error('Witness ID is required');
    if (!willId?.trim()) throw new Error('Will ID is required');
    if (!fullName?.trim()) throw new Error('Witness full name is required');

    this._id = id;
    this._willId = willId;
    this._witnessType = witnessType;
    this._fullName = fullName.trim();

    // Defaults
    this._witnessId = null;
    this._email = null;
    this._phone = null;
    this._idNumber = null;
    this._idType = null;
    this._idDocumentId = null;
    this._idVerified = false;
    this._isProfessionalWitness = false;
    this._professionalCapacity = null;
    this._professionalLicense = null;
    this._relationship = null;
    this._relationshipDuration = null;
    this._knowsTestatorWell = true;
    this._physicalAddress = null;
    this._residentialCounty = null;
    this._eligibilityStatus = WitnessEligibilityStatus.PENDING_ELIGIBILITY_CHECK;
    this._eligibilityVerifiedAt = null;
    this._eligibilityVerifiedBy = null;
    this._ineligibilityReason = null;
    this._status = WitnessStatus.PENDING;
    this._signedAt = null;
    this._signatureType = null;
    this._signatureData = null;
    this._signatureLocation = null;
    this._witnessingMethod = null;
    this._verifiedAt = null;
    this._verifiedBy = null;
    this._verificationMethod = null;
    this._verificationNotes = null;
    this._isEligible = true;
    this._hasConflictOfInterest = false;
    this._conflictDetails = null;
    this._understandsObligation = false;
    this._obligationAcknowledgedAt = null;
    this._invitationSentAt = null;
    this._invitationMethod = null;
    this._reminderSentAt = null;
    this._responseReceivedAt = null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static createForRegisteredUser(
    id: string,
    willId: string,
    witnessId: string,
    fullName: string,
    relationship?: string,
  ): Witness {
    if (!witnessId?.trim()) throw new Error('Witness user ID is required');

    const witness = new Witness(id, willId, WitnessType.REGISTERED_USER, fullName);
    witness._witnessId = witnessId;
    witness._relationship = relationship || null;
    witness._knowsTestatorWell = true;

    witness.apply(
      new WitnessAddedEvent(
        witness._id,
        witness._willId,
        witness._witnessType,
        witness._witnessId,
        witness._fullName,
      ),
    );
    return witness;
  }

  static createForExternalIndividual(
    id: string,
    willId: string,
    fullName: string,
    email: string,
    phone: string,
    relationship?: string,
    idNumber?: string,
    idType?: WitnessVerificationMethod,
  ): Witness {
    // Note: Email/Phone logic moved to updateContactInfo or validation, as minimal creation might not always have them
    // But keeping validation here if business rule requires it on creation.
    if (!email?.trim() && !phone?.trim()) throw new Error('At least one contact method required');

    const witness = new Witness(id, willId, WitnessType.EXTERNAL_INDIVIDUAL, fullName);
    witness._email = email || null;
    witness._phone = phone || null;
    witness._relationship = relationship || null;
    witness._idNumber = idNumber || null;
    witness._idType = idType || null;

    witness.apply(
      new WitnessAddedEvent(
        witness._id,
        witness._willId,
        witness._witnessType,
        null,
        witness._fullName,
      ),
    );
    return witness;
  }

  static createForProfessional(
    id: string,
    willId: string,
    fullName: string,
    email: string,
    phone: string,
    professionalCapacity: string,
    professionalLicense?: string,
    relationship: string = 'Professional Witness',
  ): Witness {
    if (!professionalCapacity?.trim()) throw new Error('Professional capacity required');

    const witness = new Witness(id, willId, WitnessType.PROFESSIONAL_WITNESS, fullName);
    witness._email = email;
    witness._phone = phone;
    witness._relationship = relationship;
    witness._isProfessionalWitness = true;
    witness._professionalCapacity = professionalCapacity;
    witness._professionalLicense = professionalLicense || null;
    witness._knowsTestatorWell = false;

    witness.apply(
      new WitnessAddedEvent(
        witness._id,
        witness._willId,
        witness._witnessType,
        null,
        witness._fullName,
      ),
    );
    return witness;
  }

  static createForCourtOfficer(
    id: string,
    willId: string,
    fullName: string,
    courtStation: string,
    badgeNumber?: string,
  ): Witness {
    const witness = new Witness(id, willId, WitnessType.COURT_OFFICER, fullName);
    witness._professionalCapacity = `Court Officer - ${courtStation}`;
    witness._professionalLicense = badgeNumber || null;
    witness._knowsTestatorWell = false;

    witness.apply(
      new WitnessAddedEvent(
        witness._id,
        witness._willId,
        witness._witnessType,
        null,
        witness._fullName,
      ),
    );
    return witness;
  }

  static reconstitute(props: WitnessReconstituteProps): Witness {
    const witness = new Witness(props.id, props.willId, props.witnessType, props.fullName);

    witness._witnessId = props.witnessId;
    witness._email = props.email;
    witness._phone = props.phone;
    witness._idNumber = props.idNumber;
    witness._idType = props.idType;
    witness._idDocumentId = props.idDocumentId;
    witness._idVerified = props.idVerified;
    witness._isProfessionalWitness = props.isProfessionalWitness;
    witness._professionalCapacity = props.professionalCapacity;
    witness._professionalLicense = props.professionalLicense;
    witness._relationship = props.relationship;
    witness._relationshipDuration = props.relationshipDuration;
    witness._knowsTestatorWell = props.knowsTestatorWell;
    witness._physicalAddress = props.physicalAddress;
    witness._residentialCounty = props.residentialCounty;
    witness._eligibilityStatus = props.eligibilityStatus;
    witness._ineligibilityReason = props.ineligibilityReason;
    witness._status = props.status;
    witness._signatureType = props.signatureType;
    witness._signatureData = props.signatureData;
    witness._signatureLocation = props.signatureLocation;
    witness._witnessingMethod = props.witnessingMethod;
    witness._verifiedBy = props.verifiedBy;
    witness._verificationMethod = props.verificationMethod;
    witness._verificationNotes = props.verificationNotes;
    witness._isEligible = props.isEligible;
    witness._hasConflictOfInterest = props.hasConflictOfInterest;
    witness._conflictDetails = props.conflictDetails;
    witness._understandsObligation = props.understandsObligation;
    witness._invitationMethod = props.invitationMethod;

    witness._eligibilityVerifiedAt = props.eligibilityVerifiedAt
      ? new Date(props.eligibilityVerifiedAt)
      : null;
    witness._signedAt = props.signedAt ? new Date(props.signedAt) : null;
    witness._verifiedAt = props.verifiedAt ? new Date(props.verifiedAt) : null;
    witness._obligationAcknowledgedAt = props.obligationAcknowledgedAt
      ? new Date(props.obligationAcknowledgedAt)
      : null;
    witness._invitationSentAt = props.invitationSentAt ? new Date(props.invitationSentAt) : null;
    witness._reminderSentAt = props.reminderSentAt ? new Date(props.reminderSentAt) : null;
    witness._responseReceivedAt = props.responseReceivedAt
      ? new Date(props.responseReceivedAt)
      : null;
    witness._createdAt = new Date(props.createdAt);
    witness._updatedAt = new Date(props.updatedAt);

    if (props.eligibilityVerifiedBy) {
      witness._eligibilityVerifiedBy = props.eligibilityVerifiedBy;
    }

    return witness;
  }

  // --------------------------------------------------------------------------
  // DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  public verifyEligibility(
    verifiedBy: string,
    status: WitnessEligibilityStatus,
    reason?: string,
  ): void {
    if (this._status === WitnessStatus.REJECTED || this._status === WitnessStatus.SIGNED) {
      // Eligibility checks usually happen before signing.
    }

    this._eligibilityStatus = status;
    this._eligibilityVerifiedAt = new Date();
    this._eligibilityVerifiedBy = verifiedBy;
    this._isEligible = status === WitnessEligibilityStatus.ELIGIBLE;
    this._ineligibilityReason = !this._isEligible ? reason || null : null;
    this._updatedAt = new Date();

    if (!this._isEligible) {
      this._status = WitnessStatus.REJECTED;
      this.apply(
        new WitnessRejectedEvent(this._id, this._willId, this._ineligibilityReason || 'Ineligible'),
      );
    }
  }

  public sign(
    signatureType: SignatureType,
    signatureData: string,
    signatureLocation: string,
    witnessingMethod: string,
  ): void {
    if (this._status !== WitnessStatus.PENDING) throw new Error('Witness status prevents signing');
    if (!this._isEligible) throw new Error('Ineligible witness cannot sign');
    if (!this._understandsObligation) throw new Error('Must acknowledge obligation before signing');

    // Section 13(2) - Beneficiary cannot witness
    if (this._hasConflictOfInterest) throw new Error('Witness has conflict of interest');
    if (!signatureData?.trim()) throw new Error('Signature data required');

    this._status = WitnessStatus.SIGNED;
    this._signedAt = new Date();
    this._signatureType = signatureType;
    this._signatureData = signatureData.trim();
    this._signatureLocation = signatureLocation;
    this._witnessingMethod = witnessingMethod;
    this._updatedAt = new Date();

    this.apply(new WitnessSignedEvent(this._id, this._willId, this._signedAt, signatureType));
  }

  public verify(
    verifiedBy: string,
    verificationMethod: WitnessVerificationMethod,
    notes?: string,
  ): void {
    if (this._status !== WitnessStatus.SIGNED)
      throw new Error('Witness must sign before verification');
    if (!verifiedBy?.trim()) throw new Error('Verifier ID required');

    // Section 11 - Capacity must be verified
    if (!this._idNumber && !this._isProfessionalWitness) {
      // While external witnesses might not have uploaded ID yet, they must at least have an ID Number record
      throw new Error('ID Number missing for verification');
    }

    this._status = WitnessStatus.VERIFIED;
    this._verifiedAt = new Date();
    this._verifiedBy = verifiedBy.trim();
    this._verificationMethod = verificationMethod;
    this._verificationNotes = notes?.trim() || null;
    this._idVerified = true;
    this._updatedAt = new Date();

    this.apply(
      new WitnessVerifiedEvent(
        this._id,
        this._willId,
        this._verifiedBy,
        this._verifiedAt,
        verificationMethod,
      ),
    );
  }

  public acknowledgeObligation(): void {
    this._understandsObligation = true;
    this._obligationAcknowledgedAt = new Date();
    this._updatedAt = new Date();
  }

  public recordConflictOfInterest(details: string): void {
    if (!details?.trim()) throw new Error('Conflict details required');
    this._hasConflictOfInterest = true;
    this._conflictDetails = details.trim();
    this._isEligible = false;
    this._eligibilityStatus = WitnessEligibilityStatus.INELIGIBLE_RELATIONSHIP;
    this._updatedAt = new Date();
    // Section 13(2): A gift to an attesting witness is void.
    // This doesn't invalidate the Will, but invalidates the gift to this witness.
    // Ideally, we should warn, not necessarily reject, but blocking helps user avoid mistakes.
  }

  public reject(reason: string): void {
    if (!reason?.trim()) throw new Error('Rejection reason required');
    this._status = WitnessStatus.REJECTED;
    this._isEligible = false;
    this._ineligibilityReason = reason.trim();
    this._updatedAt = new Date();
    this.apply(new WitnessRejectedEvent(this._id, this._willId, this._ineligibilityReason));
  }

  public updateIdentification(
    idNumber?: string,
    idType?: WitnessVerificationMethod,
    idDocumentId?: string,
  ): void {
    // Note: removed `KenyanId.isValid` usage as it's a value object not present in this file scope
    // and validation should happen in the Application Service or via a dedicated method.
    this._idNumber = idNumber || this._idNumber;
    this._idType = idType || this._idType;
    this._idDocumentId = idDocumentId || this._idDocumentId;
    this._idVerified = false;
    this._updatedAt = new Date();
  }

  public updateContactInfo(email?: string, phone?: string, residentialCounty?: string): void {
    this._email = email || this._email;
    this._phone = phone || this._phone;
    this._residentialCounty = residentialCounty || this._residentialCounty;
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }
  get willId(): string {
    return this._willId;
  }
  get witnessType(): WitnessType {
    return this._witnessType;
  }
  get witnessId(): string | null {
    return this._witnessId;
  }
  get fullName(): string {
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
  get idType(): WitnessVerificationMethod | null {
    return this._idType;
  }
  get idDocumentId(): string | null {
    return this._idDocumentId;
  }
  get idVerified(): boolean {
    return this._idVerified;
  }
  get isProfessionalWitness(): boolean {
    return this._isProfessionalWitness;
  }
  get professionalCapacity(): string | null {
    return this._professionalCapacity;
  }
  get professionalLicense(): string | null {
    return this._professionalLicense;
  }
  get relationship(): string | null {
    return this._relationship;
  }
  get relationshipDuration(): string | null {
    return this._relationshipDuration;
  }
  get knowsTestatorWell(): boolean {
    return this._knowsTestatorWell;
  }
  get physicalAddress(): Record<string, any> | null {
    return this._physicalAddress ? { ...this._physicalAddress } : null;
  }
  get residentialCounty(): string | null {
    return this._residentialCounty;
  }
  get eligibilityStatus(): WitnessEligibilityStatus {
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
  get status(): WitnessStatus {
    return this._status;
  }
  get signedAt(): Date | null {
    return this._signedAt;
  }
  get signatureType(): SignatureType | null {
    return this._signatureType;
  }
  get signatureData(): string | null {
    return this._signatureData;
  }
  get signatureLocation(): string | null {
    return this._signatureLocation;
  }
  get witnessingMethod(): string | null {
    return this._witnessingMethod;
  }
  get verifiedAt(): Date | null {
    return this._verifiedAt;
  }
  get verifiedBy(): string | null {
    return this._verifiedBy;
  }
  get verificationMethod(): WitnessVerificationMethod | null {
    return this._verificationMethod;
  }
  get verificationNotes(): string | null {
    return this._verificationNotes;
  }
  get isEligible(): boolean {
    return this._isEligible;
  }
  get hasConflictOfInterest(): boolean {
    return this._hasConflictOfInterest;
  }
  get conflictDetails(): string | null {
    return this._conflictDetails;
  }
  get understandsObligation(): boolean {
    return this._understandsObligation;
  }
  get obligationAcknowledgedAt(): Date | null {
    return this._obligationAcknowledgedAt;
  }
  get invitationSentAt(): Date | null {
    return this._invitationSentAt;
  }
  get invitationMethod(): string | null {
    return this._invitationMethod;
  }
  get reminderSentAt(): Date | null {
    return this._reminderSentAt;
  }
  get responseReceivedAt(): Date | null {
    return this._responseReceivedAt;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
}
