import { AggregateRoot } from '@nestjs/cqrs';
import {
  LegalCapacityStatus,
  RevocationMethod,
  WillStatus,
  WillStorageLocation,
  WillType,
} from '@prisma/client';

import { WILL_STATUS } from '../../../common/constants/will-status.constants';
import { WillActivatedEvent } from '../events/will-activated.event';
import { WillContestedEvent } from '../events/will-contested.event';
import { WillCreatedEvent } from '../events/will-created.event';
import { WillRevokedEvent } from '../events/will-revoked.event';
import { WillSupersededEvent } from '../events/will-superseded.event';
import { WillWitnessedEvent } from '../events/will-witnessed.event';

/**
 * Funeral and burial wishes for the testator under Kenyan customs
 */
export interface FuneralWishes {
  burialLocation?: string;
  funeralType?: string;
  specificInstructions?: string;
  preferredOfficiant?: string;
  traditionalRites?: string[];
  clanInvolvement?: string;
}

/**
 * Legal capacity assessment data under Kenyan Law of Succession Act Section 7
 */
export interface LegalCapacityAssessment {
  isOfAge: boolean;
  isSoundMind: boolean;
  understandsWillNature: boolean;
  understandsAssetExtent: boolean;
  understandsBeneficiaryClaims: boolean;
  freeFromUndueInfluence: boolean;
  assessmentDate: Date | string;
  assessedBy?: string;
  medicalCertificationId?: string;
  assessmentNotes?: string;
}

/**
 * Properties required for entity reconstitution from persistence
 * Strictly aligned with Prisma Schema.
 */
export interface WillReconstituteProps {
  id: string;
  title: string;
  testatorId: string;

  // Will Classification
  type: WillType;
  status: WillStatus;

  // Legal Capacity (Section 7 Law of Succession Act)
  legalCapacityStatus: LegalCapacityStatus;
  legalCapacityAssessment: Record<string, any> | null;
  legalCapacityAssessedBy: string | null;
  legalCapacityAssessedAt: Date | string | null;
  medicalCertificationId: string | null;

  // Will Dates & Versioning
  willDate: Date | string;
  lastModified: Date | string;
  versionNumber: number;
  supersedes: string | null;

  // Activation & Execution
  activatedAt: Date | string | null;
  activatedBy: string | null;
  executedAt: Date | string | null;
  executedBy: string | null;

  // Revocation (Section 16)
  isRevoked: boolean;
  revokedAt: Date | string | null;
  revokedBy: string | null;
  revocationMethod: RevocationMethod | null;
  revocationReason: string | null;

  // Kenyan-Specific Content
  funeralWishes: Record<string, any> | null;
  burialLocation: string | null;
  cremationInstructions: string | null;
  organDonation: boolean;
  organDonationDetails: string | null;

  // Estate Distribution
  residuaryClause: string | null;
  digitalAssetInstructions: Record<string, any> | null;
  specialInstructions: string | null;

  // Witness Management (Kenyan Legal Requirements)
  requiresWitnesses: boolean;
  witnessCount: number;
  hasAllWitnesses: boolean;
  minimumWitnessesRequired: number;

  // Legal Formalities (Kenyan Law Compliance)
  isHolographic: boolean;
  isWrittenInTestatorsHand: boolean;
  hasTestatorSignature: boolean;
  signatureWitnessed: boolean;
  meetsKenyanFormalities: boolean;

  // Storage & Security
  storageLocation: WillStorageLocation | null;
  storageDetails: string | null;
  isEncrypted: boolean;
  encryptionKeyId: string | null;

  // Court & Probate Information
  probateCaseNumber: string | null;
  courtRegistry: string | null;
  grantOfProbateIssued: boolean;
  grantOfProbateDate: Date | string | null;

  // Dependant Provision (Kenyan Law Section 26)
  hasDependantProvision: boolean;
  dependantProvisionDetails: string | null;
  courtApprovedProvision: boolean;

  // Record Management
  isActiveRecord: boolean;

  // Audit Trail
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;

  // Domain Relationships (Aggregates IDs)
  // In DDD, aggregate roots shouldn't typically hold lists of IDs for child entities if they are large,
  // but for a Will's structure (finite lists), this is acceptable for reconstitution.
  _assetIds?: string[];
  _beneficiaryIds?: string[];
  _witnessIds?: string[];
  _executorIds?: string[];
}

/**
 * Will Aggregate Root
 *
 * Represents the primary testamentary document.
 *
 * Legal Context:
 * - Governed by Law of Succession Act (Cap 160).
 * - Section 5: Capacity to make a will.
 * - Section 8-10: Oral wills (support handled via WillType but focusing on Written here).
 * - Section 11: Signing and witnessing formalities.
 * - Section 16: Revocation.
 */
export class Will extends AggregateRoot {
  // Core Identity
  private readonly _id: string;
  private _title: string;
  private readonly _testatorId: string;

  // Classification
  private _type: WillType;
  private _status: WillStatus;

  // Capacity
  private _legalCapacityStatus: LegalCapacityStatus;
  private _legalCapacityAssessment: Record<string, any> | null;
  private _legalCapacityAssessedBy: string | null;
  private _legalCapacityAssessedAt: Date | null;
  private _medicalCertificationId: string | null;

  // Versioning
  private _willDate: Date;
  private _lastModified: Date;
  private _versionNumber: number;
  private _supersedes: string | null;

  // Lifecycle
  private _activatedAt: Date | null;
  private _activatedBy: string | null;
  private _executedAt: Date | null;
  private _executedBy: string | null;

  // Revocation
  private _isRevoked: boolean;
  private _revokedAt: Date | null;
  private _revokedBy: string | null;
  private _revocationMethod: RevocationMethod | null;
  private _revocationReason: string | null;

  // Content
  private _funeralWishes: Record<string, any> | null;
  private _burialLocation: string | null;
  private _cremationInstructions: string | null;
  private _organDonation: boolean;
  private _organDonationDetails: string | null;

  // Distribution
  private _residuaryClause: string | null;
  private _digitalAssetInstructions: Record<string, any> | null;
  private _specialInstructions: string | null;

  // Witnesses
  private _requiresWitnesses: boolean;
  private _witnessCount: number;
  private _hasAllWitnesses: boolean;
  private _minimumWitnessesRequired: number;

  // Formalities
  private _isHolographic: boolean;
  private _isWrittenInTestatorsHand: boolean;
  private _hasTestatorSignature: boolean;
  private _signatureWitnessed: boolean;
  private _meetsKenyanFormalities: boolean;

  // Storage
  private _storageLocation: WillStorageLocation | null;
  private _storageDetails: string | null;
  private _isEncrypted: boolean;
  private _encryptionKeyId: string | null;

  // Probate
  private _probateCaseNumber: string | null;
  private _courtRegistry: string | null;
  private _grantOfProbateIssued: boolean;
  private _grantOfProbateDate: Date | null;

  // Dependants
  private _hasDependantProvision: boolean;
  private _dependantProvisionDetails: string | null;
  private _courtApprovedProvision: boolean;

  // System
  private _isActiveRecord: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // Relationships (Internal state tracking)
  private _assetIds: string[] = [];
  private _beneficiaryIds: string[] = [];
  private _witnessIds: string[] = [];
  private _executorIds: string[] = [];

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    title: string,
    testatorId: string,
    type: WillType = WillType.STANDARD,
  ) {
    super();

    if (!id?.trim()) throw new Error('Will ID is required');
    if (!title?.trim()) throw new Error('Will title is required');
    if (!testatorId?.trim()) throw new Error('Testator ID is required');

    this._id = id;
    this._title = title.trim();
    this._testatorId = testatorId;
    this._type = type;

    // Defaults
    this._status = WillStatus.DRAFT;
    this._legalCapacityStatus = LegalCapacityStatus.PENDING_ASSESSMENT;
    this._legalCapacityAssessment = null;
    this._legalCapacityAssessedBy = null;
    this._legalCapacityAssessedAt = null;
    this._medicalCertificationId = null;
    this._willDate = new Date();
    this._lastModified = new Date();
    this._versionNumber = 1;
    this._supersedes = null;
    this._activatedAt = null;
    this._activatedBy = null;
    this._executedAt = null;
    this._executedBy = null;
    this._isRevoked = false;
    this._revokedAt = null;
    this._revokedBy = null;
    this._revocationMethod = null;
    this._revocationReason = null;
    this._funeralWishes = null;
    this._burialLocation = null;
    this._cremationInstructions = null;
    this._organDonation = false;
    this._organDonationDetails = null;
    this._residuaryClause = null;
    this._digitalAssetInstructions = null;
    this._specialInstructions = null;
    this._requiresWitnesses = true;
    this._witnessCount = 0;
    this._hasAllWitnesses = false;
    this._minimumWitnessesRequired = 2; // Kenyan Law minimum
    this._isHolographic = false;
    this._isWrittenInTestatorsHand = false;
    this._hasTestatorSignature = false;
    this._signatureWitnessed = false;
    this._meetsKenyanFormalities = false;
    this._storageLocation = null;
    this._storageDetails = null;
    this._isEncrypted = false;
    this._encryptionKeyId = null;
    this._probateCaseNumber = null;
    this._courtRegistry = null;
    this._grantOfProbateIssued = false;
    this._grantOfProbateDate = null;
    this._hasDependantProvision = false;
    this._dependantProvisionDetails = null;
    this._courtApprovedProvision = false;
    this._isActiveRecord = true;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._deletedAt = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    title: string,
    testatorId: string,
    type: WillType = WillType.STANDARD,
  ): Will {
    const will = new Will(id, title, testatorId, type);
    will.apply(new WillCreatedEvent(will._id, will._testatorId, will._title, will._type));
    return will;
  }

  static reconstitute(props: WillReconstituteProps): Will {
    const will = new Will(props.id, props.title, props.testatorId, props.type);

    will._status = props.status;
    will._legalCapacityStatus = props.legalCapacityStatus;
    will._legalCapacityAssessment = props.legalCapacityAssessment;
    will._legalCapacityAssessedBy = props.legalCapacityAssessedBy;
    will._medicalCertificationId = props.medicalCertificationId;
    will._versionNumber = props.versionNumber;
    will._supersedes = props.supersedes;
    will._activatedBy = props.activatedBy;
    will._executedBy = props.executedBy;
    will._isRevoked = props.isRevoked;
    will._revokedBy = props.revokedBy;
    will._revocationMethod = props.revocationMethod;
    will._revocationReason = props.revocationReason;
    will._funeralWishes = props.funeralWishes;
    will._burialLocation = props.burialLocation;
    will._cremationInstructions = props.cremationInstructions;
    will._organDonation = props.organDonation;
    will._organDonationDetails = props.organDonationDetails;
    will._residuaryClause = props.residuaryClause;
    will._digitalAssetInstructions = props.digitalAssetInstructions;
    will._specialInstructions = props.specialInstructions;
    will._requiresWitnesses = props.requiresWitnesses;
    will._witnessCount = props.witnessCount;
    will._hasAllWitnesses = props.hasAllWitnesses;
    will._minimumWitnessesRequired = props.minimumWitnessesRequired;
    will._isHolographic = props.isHolographic;
    will._isWrittenInTestatorsHand = props.isWrittenInTestatorsHand;
    will._hasTestatorSignature = props.hasTestatorSignature;
    will._signatureWitnessed = props.signatureWitnessed;
    will._meetsKenyanFormalities = props.meetsKenyanFormalities;
    will._storageLocation = props.storageLocation;
    will._storageDetails = props.storageDetails;
    will._isEncrypted = props.isEncrypted;
    will._encryptionKeyId = props.encryptionKeyId;
    will._probateCaseNumber = props.probateCaseNumber;
    will._courtRegistry = props.courtRegistry;
    will._grantOfProbateIssued = props.grantOfProbateIssued;
    will._hasDependantProvision = props.hasDependantProvision;
    will._dependantProvisionDetails = props.dependantProvisionDetails;
    will._courtApprovedProvision = props.courtApprovedProvision;
    will._isActiveRecord = props.isActiveRecord;

    will._legalCapacityAssessedAt = props.legalCapacityAssessedAt
      ? new Date(props.legalCapacityAssessedAt)
      : null;
    will._willDate = new Date(props.willDate);
    will._lastModified = new Date(props.lastModified);
    will._activatedAt = props.activatedAt ? new Date(props.activatedAt) : null;
    will._executedAt = props.executedAt ? new Date(props.executedAt) : null;
    will._revokedAt = props.revokedAt ? new Date(props.revokedAt) : null;
    will._grantOfProbateDate = props.grantOfProbateDate ? new Date(props.grantOfProbateDate) : null;
    will._createdAt = new Date(props.createdAt);
    will._updatedAt = new Date(props.updatedAt);
    will._deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;

    will._assetIds = props._assetIds ? [...props._assetIds] : [];
    will._beneficiaryIds = props._beneficiaryIds ? [...props._beneficiaryIds] : [];
    will._witnessIds = props._witnessIds ? [...props._witnessIds] : [];
    will._executorIds = props._executorIds ? [...props._executorIds] : [];

    return will;
  }

  // --------------------------------------------------------------------------
  // DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  public assessLegalCapacity(
    assessment: LegalCapacityAssessment,
    assessedBy: string,
    status: LegalCapacityStatus,
  ): void {
    if (!this.isEditable()) throw new Error('Cannot modify will in current status');

    this._legalCapacityAssessment = { ...assessment };
    this._legalCapacityAssessedBy = assessedBy;
    this._legalCapacityAssessedAt = new Date();
    this._legalCapacityStatus = status;
    if (assessment.medicalCertificationId) {
      this._medicalCertificationId = assessment.medicalCertificationId;
    }
    this.markAsModified();
  }

  public updateType(type: WillType): void {
    this.validateModificationAllowed();
    if (type === WillType.HOLOGRAPHIC) {
      this._isHolographic = true;
      this._isWrittenInTestatorsHand = true;
    }
    this._type = type;
    this.markAsModified();
  }

  public updateDetails(
    funeralWishes?: Record<string, any>,
    burialLocation?: string,
    cremationInstructions?: string,
    organDonation?: boolean,
    organDonationDetails?: string,
    residuaryClause?: string,
    digitalAssetInstructions?: Record<string, any>,
    specialInstructions?: string,
  ): void {
    this.validateModificationAllowed();
    if (funeralWishes) this._funeralWishes = { ...funeralWishes };
    if (burialLocation) this._burialLocation = burialLocation;
    if (cremationInstructions) this._cremationInstructions = cremationInstructions;
    if (organDonation !== undefined) this._organDonation = organDonation;
    if (organDonationDetails) this._organDonationDetails = organDonationDetails;
    if (residuaryClause) this._residuaryClause = residuaryClause;
    if (digitalAssetInstructions) this._digitalAssetInstructions = { ...digitalAssetInstructions };
    if (specialInstructions) this._specialInstructions = specialInstructions;
    this.markAsModified();
  }

  public recordTestatorSignature(): void {
    this.validateModificationAllowed();
    this._hasTestatorSignature = true;
    this.markAsModified();
  }

  public setStorageLocation(location: WillStorageLocation, details?: string): void {
    this._storageLocation = location;
    this._storageDetails = details || null;
    this.markAsModified();
  }

  public enableEncryption(keyId: string): void {
    this._isEncrypted = true;
    this._encryptionKeyId = keyId;
    this.markAsModified();
  }

  public addDependantProvision(details: string): void {
    this.validateModificationAllowed();
    this._hasDependantProvision = true;
    this._dependantProvisionDetails = details;
    this.markAsModified();
  }

  public obtainCourtApprovalForProvision(): void {
    if (!this._hasDependantProvision) throw new Error('No dependant provision to approve');
    this._courtApprovedProvision = true;
    this.markAsModified();
  }

  public addWitness(witnessId: string): void {
    this.validateModificationAllowed();
    if (!witnessId?.trim()) throw new Error('Witness ID required');
    if (!this.canAddWitnesses()) throw new Error('Status prevents adding witnesses');

    if (!this._witnessIds.includes(witnessId)) {
      this._witnessIds.push(witnessId);
      this._witnessCount = this._witnessIds.length;
      this.checkWitnessCompletion();
      this.markAsModified();
    }
  }

  public recordWitnessSignatures(): void {
    if (this._status !== WillStatus.PENDING_WITNESS)
      throw new Error('Status must be PENDING_WITNESS');
    if (!this.hasMinimumWitnesses())
      throw new Error(`Minimum ${this._minimumWitnessesRequired} witnesses required`);

    this._signatureWitnessed = true;
    this._meetsKenyanFormalities = this.validateKenyanFormalities();
    this.markAsModified();
  }

  public markAsWitnessed(): void {
    this.validateTransition(WillStatus.WITNESSED);
    // Strict compliance check for Kenyan Law
    if (!this._meetsKenyanFormalities) {
      throw new Error('Will does not meet Kenyan legal formalities (Section 11)');
    }
    this._status = WillStatus.WITNESSED;
    this.markAsModified();
    this.apply(new WillWitnessedEvent(this._id, this._testatorId));
  }

  public activate(activatedBy: string): void {
    this.validateTransition(WillStatus.ACTIVE);

    if (!activatedBy?.trim()) {
      throw new Error('Activator ID required');
    }

    if (this._legalCapacityStatus !== LegalCapacityStatus.ASSESSED_COMPETENT) {
      // Kenyan courts invalidate wills made without capacity (Section 5(2))
      throw new Error('Testator capacity not competent');
    }

    this._status = WillStatus.ACTIVE;
    this._activatedAt = new Date();
    this._activatedBy = activatedBy;

    this.markAsModified();

    this.apply(
      new WillActivatedEvent(
        this._id,
        this._testatorId,
        activatedBy,
        this._activatedAt, // ensures consistent timestamp across domain + event
      ),
    );
  }

  public revoke(revokedBy: string, reason: string, method: RevocationMethod): void {
    this.validateTransition(WillStatus.REVOKED);
    if (!revokedBy?.trim()) throw new Error('Revoker ID required');
    if (!reason?.trim()) throw new Error('Reason required');

    this._status = WillStatus.REVOKED;
    this._isRevoked = true;
    this._revokedAt = new Date();
    this._revokedBy = revokedBy;
    this._revocationMethod = method;
    this._revocationReason = reason;
    this.markAsModified();

    this.apply(
      new WillRevokedEvent(
        this._id,
        this._testatorId,
        this._revocationReason,
        this._revokedBy,
        method,
      ),
    );
  }

  public supersede(newWillId: string): void {
    this.validateTransition(WillStatus.SUPERSEDED);
    if (!newWillId?.trim()) throw new Error('New will ID required');

    this._status = WillStatus.SUPERSEDED;
    this._supersedes = newWillId;
    this.markAsModified();
    this.apply(new WillSupersededEvent(this._id, newWillId, this._testatorId));
  }

  public contest(disputeId: string, reason: string): void {
    this.validateTransition(WillStatus.CONTESTED);
    if (!disputeId?.trim()) throw new Error('Dispute ID required');
    if (!reason?.trim()) throw new Error('Reason required');

    this._status = WillStatus.CONTESTED;
    this.markAsModified();
    this.apply(new WillContestedEvent(this._id, disputeId, reason));
  }

  public markAsExecuted(executedBy: string): void {
    this.validateTransition(WillStatus.EXECUTED);
    if (!executedBy?.trim()) throw new Error('Executor ID required');

    this._status = WillStatus.EXECUTED;
    this._executedAt = new Date();
    this._executedBy = executedBy;
    this.markAsModified();
  }

  public issueGrantOfProbate(caseNumber: string, courtRegistry: string): void {
    this._probateCaseNumber = caseNumber;
    this._courtRegistry = courtRegistry;
    this._grantOfProbateIssued = true;
    this._grantOfProbateDate = new Date();
    this.markAsModified();
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private validateKenyanFormalities(): boolean {
    return (
      this._hasTestatorSignature &&
      this._signatureWitnessed &&
      this._witnessCount >= this._minimumWitnessesRequired &&
      // Section 5: Capacity check
      this._legalCapacityStatus === LegalCapacityStatus.ASSESSED_COMPETENT
    );
  }

  private validateModificationAllowed(): void {
    const definition = WILL_STATUS[this._status];
    if (!definition || !definition.editable)
      throw new Error(`Cannot modify will in status ${this._status}`);
  }

  private validateTransition(targetStatus: WillStatus): void {
    const definition = WILL_STATUS[this._status];
    if (!definition) throw new Error(`Invalid status ${this._status}`);
    const allowed = definition.nextStatus as readonly WillStatus[];
    if (!allowed.includes(targetStatus)) {
      throw new Error(`Invalid transition ${this._status} -> ${targetStatus}`);
    }
  }

  private markAsModified(): void {
    this._lastModified = new Date();
    this._updatedAt = new Date();
  }

  private checkWitnessCompletion(): void {
    this._hasAllWitnesses = this._witnessCount >= this._minimumWitnessesRequired;
  }

  public isEditable(): boolean {
    return WILL_STATUS[this._status]?.editable || false;
  }
  public canAddWitnesses(): boolean {
    return this._status === WillStatus.DRAFT || this._status === WillStatus.PENDING_WITNESS;
  }
  public hasMinimumWitnesses(): boolean {
    return this._witnessCount >= this._minimumWitnessesRequired;
  }
  public hasLegalCapacity(): boolean {
    return this._legalCapacityStatus === LegalCapacityStatus.ASSESSED_COMPETENT;
  }
  public meetsKenyanLegalRequirements(): boolean {
    return (
      this._meetsKenyanFormalities &&
      this.hasLegalCapacity() &&
      this.hasMinimumWitnesses() &&
      this._hasTestatorSignature
    );
  }

  // Getters
  get id(): string {
    return this._id;
  }
  get title(): string {
    return this._title;
  }
  get testatorId(): string {
    return this._testatorId;
  }
  get type(): WillType {
    return this._type;
  }
  get status(): WillStatus {
    return this._status;
  }
  get legalCapacityStatus(): LegalCapacityStatus {
    return this._legalCapacityStatus;
  }
  get legalCapacityAssessment(): Record<string, any> | null {
    return this._legalCapacityAssessment ? { ...this._legalCapacityAssessment } : null;
  }
  get legalCapacityAssessedBy(): string | null {
    return this._legalCapacityAssessedBy;
  }
  get legalCapacityAssessedAt(): Date | null {
    return this._legalCapacityAssessedAt;
  }
  get medicalCertificationId(): string | null {
    return this._medicalCertificationId;
  }
  get willDate(): Date {
    return new Date(this._willDate);
  }
  get lastModified(): Date {
    return new Date(this._lastModified);
  }
  get versionNumber(): number {
    return this._versionNumber;
  }
  get supersedes(): string | null {
    return this._supersedes;
  }
  get activatedAt(): Date | null {
    return this._activatedAt;
  }
  get activatedBy(): string | null {
    return this._activatedBy;
  }
  get executedAt(): Date | null {
    return this._executedAt;
  }
  get executedBy(): string | null {
    return this._executedBy;
  }
  get isRevoked(): boolean {
    return this._isRevoked;
  }
  get revokedAt(): Date | null {
    return this._revokedAt;
  }
  get revokedBy(): string | null {
    return this._revokedBy;
  }
  get revocationMethod(): RevocationMethod | null {
    return this._revocationMethod;
  }
  get revocationReason(): string | null {
    return this._revocationReason;
  }
  get funeralWishes(): Record<string, any> | null {
    return this._funeralWishes ? { ...this._funeralWishes } : null;
  }
  get burialLocation(): string | null {
    return this._burialLocation;
  }
  get cremationInstructions(): string | null {
    return this._cremationInstructions;
  }
  get organDonation(): boolean {
    return this._organDonation;
  }
  get organDonationDetails(): string | null {
    return this._organDonationDetails;
  }
  get residuaryClause(): string | null {
    return this._residuaryClause;
  }
  get digitalAssetInstructions(): Record<string, any> | null {
    return this._digitalAssetInstructions ? { ...this._digitalAssetInstructions } : null;
  }
  get specialInstructions(): string | null {
    return this._specialInstructions;
  }
  get requiresWitnesses(): boolean {
    return this._requiresWitnesses;
  }
  get witnessCount(): number {
    return this._witnessCount;
  }
  get hasAllWitnesses(): boolean {
    return this._hasAllWitnesses;
  }
  get minimumWitnessesRequired(): number {
    return this._minimumWitnessesRequired;
  }
  get isHolographic(): boolean {
    return this._isHolographic;
  }
  get isWrittenInTestatorsHand(): boolean {
    return this._isWrittenInTestatorsHand;
  }
  get hasTestatorSignature(): boolean {
    return this._hasTestatorSignature;
  }
  get signatureWitnessed(): boolean {
    return this._signatureWitnessed;
  }
  get meetsKenyanFormalities(): boolean {
    return this._meetsKenyanFormalities;
  }
  get storageLocation(): WillStorageLocation | null {
    return this._storageLocation;
  }
  get storageDetails(): string | null {
    return this._storageDetails;
  }
  get isEncrypted(): boolean {
    return this._isEncrypted;
  }
  get encryptionKeyId(): string | null {
    return this._encryptionKeyId;
  }
  get probateCaseNumber(): string | null {
    return this._probateCaseNumber;
  }
  get courtRegistry(): string | null {
    return this._courtRegistry;
  }
  get grantOfProbateIssued(): boolean {
    return this._grantOfProbateIssued;
  }
  get grantOfProbateDate(): Date | null {
    return this._grantOfProbateDate;
  }
  get hasDependantProvision(): boolean {
    return this._hasDependantProvision;
  }
  get dependantProvisionDetails(): string | null {
    return this._dependantProvisionDetails;
  }
  get courtApprovedProvision(): boolean {
    return this._courtApprovedProvision;
  }
  get isActiveRecord(): boolean {
    return this._isActiveRecord;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }
  get assetIds(): string[] {
    return [...this._assetIds];
  }
  get beneficiaryIds(): string[] {
    return [...this._beneficiaryIds];
  }
  get witnessIds(): string[] {
    return [...this._witnessIds];
  }
  get executorIds(): string[] {
    return [...this._executorIds];
  }
}
