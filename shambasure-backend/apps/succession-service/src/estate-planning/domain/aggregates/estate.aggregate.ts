import { AggregateRoot } from '@nestjs/cqrs';
import { CaseStatus, DistributionStatus, GrantStatus, GrantType } from '@prisma/client';

import { EstateCreatedEvent } from '../events/estate-created.event';
import { EstateDistributionCompletedEvent } from '../events/estate-distribution-completed.event';
import { EstateGrantIssuedEvent } from '../events/estate-grant-issued.event';
import { EstateInventoryVerifiedEvent } from '../events/estate-inventory-verified.event';
import { EstateSolvencyDeterminedEvent } from '../events/estate-solvency-determined.event';

/**
 * Estate Inventory Item (Post-Death Asset Recording)
 */
export interface EstateInventoryItem {
  id: string;
  assetId: string | null; // Linked to pre-death Asset if available
  description: string;
  estimatedValue: number;
  currency: string;
  ownedByDeceased: boolean;
}

/**
 * Creditor Claim Summary
 */
export interface CreditorClaimSummary {
  id: string;
  creditorName: string;
  amountClaimed: number;
  currency: string;
  status: string;
  priority: string;
}

/**
 * Estate Financial Summary
 */
export interface EstateFinancialSummary {
  totalAssets: number;
  totalLiabilities: number;
  netEstateValue: number;
  currency: string;
  isSolvent: boolean;
  assetCount: number;
  claimCount: number;
}

/**
 * Estate Aggregate Root (Post-Death Succession)
 *
 * Manages the estate administration process AFTER the testator has died.
 * This aggregate handles probate, asset distribution, debt settlement,
 * and compliance with Kenyan succession law.
 *
 * Legal Context:
 * - Law of Succession Act (Cap 160)
 * - Section 6: Jurisdiction of High Court
 * - Section 34-42: Intestacy Rules
 * - Section 45-66: Grant of Representation
 * - Section 83: Duties of Personal Representatives
 * - Sixth Schedule: Priority of Debts
 *
 * Lifecycle:
 * 1. Estate Created (on death)
 * 2. Inventory Compiled
 * 3. Debts/Claims Filed
 * 4. Grant of Representation Issued
 * 5. Assets Distributed
 * 6. Estate Closed
 *
 * This is distinct from WillAggregate (pre-death planning).
 */
export class EstateAggregate extends AggregateRoot {
  // Core Identity
  private readonly _id: string;
  private readonly _deceasedUserId: string | null; // If deceased was registered user
  private _deceasedName: string;
  private _dateOfDeath: Date | null;

  private _deathCertificateNumber: string | null;

  // Estate Status
  private _status: DistributionStatus;
  private _administrationType: GrantType | null;

  // Financial Summary
  private _estateValue: number | null;
  private _currency: string;

  // Administration
  private _administratorId: string | null; // Executor or Administrator User ID
  private _primaryCourtStation: string | null;

  // Probate Case
  private _probateCaseNumber: string | null;

  // Grant of Representation
  private _grantType: GrantType | null;
  private _grantNumber: string | null;
  private _grantStatus: GrantStatus | null;

  // Tax Compliance
  private _taxComplianceCertificateNumber: string | null;
  private _estateDutyPaid: boolean;

  private _administrationCompletedAt: Date | null;
  private _closedAt: Date | null;

  // Aggregate State (IDs only for consistency boundary)
  private _willIds: Set<string> = new Set();
  private _inventoryItemIds: Set<string> = new Set();
  private _creditorClaimIds: Set<string> = new Set();
  private _beneficiaryEntitlementIds: Set<string> = new Set();

  // Timestamps
  private _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    deceasedName: string,
    dateOfDeath: Date | null,
    deceasedUserId: string | null,
    currency: string = 'KES',
  ) {
    super();

    if (!id?.trim()) throw new Error('Estate ID is required');
    if (!deceasedName?.trim()) throw new Error('Deceased name is required');

    this._id = id;
    this._deceasedName = deceasedName.trim();
    this._dateOfDeath = dateOfDeath;
    this._deceasedUserId = deceasedUserId;
    this._currency = currency;

    // Defaults
    this._status = DistributionStatus.PENDING;
    this._administrationType = null;
    this._estateValue = null;
    this._administratorId = null;
    this._primaryCourtStation = null;
    this._probateCaseNumber = null;
    this._grantType = null;
    this._grantNumber = null;
    this._grantStatus = null;
    this._deathCertificateNumber = null;
    this._taxComplianceCertificateNumber = null;
    this._estateDutyPaid = false;
    this._administrationCompletedAt = null;
    this._closedAt = null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  /**
   * Creates a new estate upon death of a person.
   */
  static create(
    id: string,
    deceasedName: string,
    dateOfDeath: Date,
    deceasedUserId?: string,
    deathCertificateNumber?: string,
    placeOfDeath?: string,
  ): EstateAggregate {
    const estate = new EstateAggregate(id, deceasedName, dateOfDeath, deceasedUserId || null);

    if (deathCertificateNumber) {
      estate._deathCertificateNumber = deathCertificateNumber;
    }

    if (placeOfDeath) {
      /* empty */
    }

    estate.apply(
      new EstateCreatedEvent(
        estate._id,
        estate._deceasedName,
        estate._dateOfDeath,
        estate._createdAt,
      ),
    );

    return estate;
  }

  static reconstitute(props: {
    id: string;
    deceasedUserId: string | null;
    deceasedName: string;
    dateOfDeath: Date | null;
    status: DistributionStatus;
    administrationType: GrantType | null;
    estateValue: number | null;
    currency: string;
    administratorId: string | null;
    primaryCourtStation: string | null;
    courtFileReference: string | null;
    probateCaseNumber: string | null;
    probateCaseStatus: CaseStatus | null;
    grantType: GrantType | null;
    grantNumber: string | null;
    grantStatus: GrantStatus | null;
    grantIssuedAt: Date | string | null;
    deceasedDateOfBirth: Date | string | null;
    deceasedIdNumber: string | null;
    deceasedKraPin: string | null;
    placeOfDeath: string | null;
    deathCertificateNumber: string | null;
    burialPermitNumber: string | null;
    taxComplianceCertificateNumber: string | null;
    taxComplianceCertificateDate: Date | string | null;
    estateDutyPaid: boolean;
    estateDutyAmount: number | null;
    administrationStartedAt: Date | string | null;
    administrationCompletedAt: Date | string | null;
    estimatedCompletionDate: Date | string | null;
    closedAt: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    willIds?: string[];
    inventoryItemIds?: string[];
    creditorClaimIds?: string[];
    beneficiaryEntitlementIds?: string[];
  }): EstateAggregate {
    const estate = new EstateAggregate(
      props.id,
      props.deceasedName,
      props.dateOfDeath ? new Date(props.dateOfDeath) : null,
      props.deceasedUserId,
      props.currency,
    );

    estate._status = props.status;
    estate._administrationType = props.administrationType;
    estate._estateValue = props.estateValue;
    estate._administratorId = props.administratorId;
    estate._primaryCourtStation = props.primaryCourtStation;
    estate._probateCaseNumber = props.probateCaseNumber;
    estate._grantType = props.grantType;
    estate._grantNumber = props.grantNumber;
    estate._grantStatus = props.grantStatus;
    estate._deathCertificateNumber = props.deathCertificateNumber;
    estate._taxComplianceCertificateNumber = props.taxComplianceCertificateNumber;
    estate._estateDutyPaid = props.estateDutyPaid;
    estate._administrationCompletedAt = props.administrationCompletedAt
      ? new Date(props.administrationCompletedAt)
      : null;
    estate._closedAt = props.closedAt ? new Date(props.closedAt) : null;
    estate._createdAt = new Date(props.createdAt);
    estate._updatedAt = new Date(props.updatedAt);

    if (props.willIds) {
      estate._willIds = new Set(props.willIds);
    }
    if (props.inventoryItemIds) {
      estate._inventoryItemIds = new Set(props.inventoryItemIds);
    }
    if (props.creditorClaimIds) {
      estate._creditorClaimIds = new Set(props.creditorClaimIds);
    }
    if (props.beneficiaryEntitlementIds) {
      estate._beneficiaryEntitlementIds = new Set(props.beneficiaryEntitlementIds);
    }

    return estate;
  }

  // --------------------------------------------------------------------------
  // DECEASED PERSON DETAILS
  // --------------------------------------------------------------------------

  updateDeceasedDetails(details: {
    dateOfBirth?: Date;
    idNumber?: string;
    kraPin?: string;
    placeOfDeath?: string;
    burialPermitNumber?: string;
  }): void {
    if (details.dateOfBirth)
      if (details.idNumber)
        if (details.kraPin)
          if (details.placeOfDeath) if (details.burialPermitNumber) this.markAsUpdated();
  }

  // --------------------------------------------------------------------------
  // WILL LINKAGE
  // --------------------------------------------------------------------------

  /**
   * Links a will to this estate.
   * Typically the deceased's ACTIVE will at time of death.
   */
  linkWill(willId: string): void {
    if (this._willIds.has(willId)) {
      return; // Idempotent
    }

    this._willIds.add(willId);
    this.markAsUpdated();
  }

  getWillIds(): string[] {
    return Array.from(this._willIds);
  }

  hasWill(): boolean {
    return this._willIds.size > 0;
  }

  // --------------------------------------------------------------------------
  // ESTATE INVENTORY (Section 83 - PR Duties)
  // --------------------------------------------------------------------------

  addInventoryItem(itemId: string): void {
    if (this._inventoryItemIds.has(itemId)) {
      return; // Idempotent
    }

    this._inventoryItemIds.add(itemId);
    this.markAsUpdated();
  }

  removeInventoryItem(itemId: string): void {
    this._inventoryItemIds.delete(itemId);
    this.markAsUpdated();
  }

  getInventoryItemIds(): string[] {
    return Array.from(this._inventoryItemIds);
  }

  getInventoryItemCount(): number {
    return this._inventoryItemIds.size;
  }

  /**
   * Marks inventory as verified after valuation and audit.
   */
  verifyInventory(totalValue: number, verifiedBy: string): void {
    if (this._inventoryItemIds.size === 0) {
      throw new Error('Cannot verify empty inventory');
    }

    this._estateValue = totalValue;
    this.markAsUpdated();

    this.apply(
      new EstateInventoryVerifiedEvent(
        this._id,
        this._inventoryItemIds.size,
        totalValue,
        this._currency,
        verifiedBy,
        new Date(),
      ),
    );
  }

  // --------------------------------------------------------------------------
  // CREDITOR CLAIMS MANAGEMENT
  // --------------------------------------------------------------------------

  addCreditorClaim(claimId: string): void {
    if (this._creditorClaimIds.has(claimId)) {
      return; // Idempotent
    }

    this._creditorClaimIds.add(claimId);
    this.markAsUpdated();
  }

  getCreditorClaimIds(): string[] {
    return Array.from(this._creditorClaimIds);
  }

  getCreditorClaimCount(): number {
    return this._creditorClaimIds.size;
  }

  hasOutstandingClaims(): boolean {
    // This check requires loading actual claim entities at application service level
    // Here we just track that claims exist
    return this._creditorClaimIds.size > 0;
  }

  // --------------------------------------------------------------------------
  // BENEFICIARY ENTITLEMENTS
  // --------------------------------------------------------------------------

  addBeneficiaryEntitlement(entitlementId: string): void {
    if (this._beneficiaryEntitlementIds.has(entitlementId)) {
      return; // Idempotent
    }

    this._beneficiaryEntitlementIds.add(entitlementId);
    this.markAsUpdated();
  }

  getBeneficiaryEntitlementIds(): string[] {
    return Array.from(this._beneficiaryEntitlementIds);
  }

  getBeneficiaryCount(): number {
    return this._beneficiaryEntitlementIds.size;
  }

  // --------------------------------------------------------------------------
  // ESTATE ADMINISTRATION WORKFLOW
  // --------------------------------------------------------------------------

  /**
   * Appoints an administrator/executor to manage the estate.
   * Section 51: Appointment of Personal Representatives.
   */
  appointAdministrator(administratorId: string, grantType: GrantType): void {
    if (this._administratorId) {
      throw new Error('Administrator already appointed');
    }

    this._administratorId = administratorId;
    this._grantType = grantType;
    this._administrationType = grantType;
    this.markAsUpdated();
  }

  /**
   * Records probate case filing.
   * Section 6: High Court jurisdiction over estates.
   */
  fileProbateCase(caseNumber: string, courtStation: string): void {
    if (!this._administratorId) {
      throw new Error('Administrator must be appointed before filing probate case');
    }

    this._probateCaseNumber = caseNumber;
    this._primaryCourtStation = courtStation;
    this.markAsUpdated();
  }

  /**
   * Updates probate case status.
   */
  updateProbateCaseStatus(): void {
    if (!this._probateCaseNumber) {
      throw new Error('No probate case filed');
    }

    this.markAsUpdated();
  }

  /**
   * Issues grant of representation.
   * Section 45-66: Grants of Probate and Administration.
   */
  issueGrant(
    grantNumber: string,
    grantType: GrantType,
    issuedAt: Date,
    courtStation: string,
  ): void {
    if (!this._administratorId) {
      throw new Error('Administrator must be appointed before issuing grant');
    }

    if (this._grantNumber) {
      throw new Error('Grant already issued. Use amendGrant() to modify existing grant.');
    }

    this._grantNumber = grantNumber;
    this._grantType = grantType;
    this._grantStatus = GrantStatus.ISSUED;
    this._primaryCourtStation = courtStation;
    this.markAsUpdated();

    this.apply(
      new EstateGrantIssuedEvent(
        this._id,
        grantNumber,
        grantType,
        this._administratorId,
        issuedAt,
        courtStation,
      ),
    );
  }

  /**
   * Confirms the grant after the confirmation hearing.
   * Section 80: Confirmation of grants.
   */
  confirmGrant(): void {
    if (!this._grantNumber) {
      throw new Error('No grant to confirm');
    }

    if (this._grantStatus !== GrantStatus.ISSUED) {
      throw new Error(`Cannot confirm grant in status: ${this._grantStatus}`);
    }

    this._grantStatus = GrantStatus.CONFIRMED;
    this.markAsUpdated();
  }

  /**
   * Revokes a grant per Section 76.
   */
  revokeGrant(): void {
    if (!this._grantNumber) {
      throw new Error('No grant to revoke');
    }

    this._grantStatus = GrantStatus.REVOKED;
    this.markAsUpdated();
  }

  /**
   * Records tax compliance certificate from KRA.
   */
  recordTaxCompliance(certificateNumber: string): void {
    this._taxComplianceCertificateNumber = certificateNumber;
    this.markAsUpdated();
  }

  /**
   * Records estate duty payment.
   */
  recordEstateDutyPayment(): void {
    this._estateDutyPaid = true;
    this.markAsUpdated();
  }

  // --------------------------------------------------------------------------
  // SOLVENCY & FINANCIAL ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Determines estate solvency.
   * Sixth Schedule: If liabilities exceed assets, estate is insolvent.
   */
  determineSolvency(
    totalAssets: number,
    totalLiabilities: number,
  ): { isSolvent: boolean; netValue: number; shortfall: number } {
    const netValue = totalAssets - totalLiabilities;
    const isSolvent = netValue >= 0;
    const shortfall = isSolvent ? 0 : Math.abs(netValue);

    this._estateValue = netValue;
    this.markAsUpdated();

    this.apply(
      new EstateSolvencyDeterminedEvent(
        this._id,
        isSolvent,
        totalAssets,
        totalLiabilities,
        netValue,
        shortfall,
      ),
    );

    return { isSolvent, netValue, shortfall };
  }

  /**
   * Updates estate valuation.
   */
  updateEstateValue(value: number): void {
    this._estateValue = value;
    this.markAsUpdated();
  }

  // --------------------------------------------------------------------------
  // DISTRIBUTION & CLOSURE
  // --------------------------------------------------------------------------

  /**
   * Marks estate as in distribution phase.
   */
  beginDistribution(): void {
    if (this._status !== DistributionStatus.PENDING) {
      throw new Error(`Cannot begin distribution from status: ${this._status}`);
    }

    if (!this._grantNumber || this._grantStatus !== GrantStatus.CONFIRMED) {
      throw new Error('Grant must be confirmed before distribution');
    }

    if (this._inventoryItemIds.size === 0) {
      throw new Error('Inventory must be compiled before distribution');
    }

    this._status = DistributionStatus.IN_PROGRESS;
    this.markAsUpdated();
  }

  /**
   * Marks distribution as completed.
   */
  completeDistribution(completedBy: string): void {
    if (this._status !== DistributionStatus.IN_PROGRESS) {
      throw new Error('Distribution not in progress');
    }

    this._status = DistributionStatus.COMPLETED;
    this._administrationCompletedAt = new Date();
    this.markAsUpdated();

    this.apply(
      new EstateDistributionCompletedEvent(
        this._id,
        this._administratorId!,
        completedBy,
        this._administrationCompletedAt,
      ),
    );
  }

  /**
   * Closes the estate after all duties completed.
   * Section 83: Personal Representative duties must be fulfilled.
   */
  closeEstate(finalAccountsApproved: boolean): void {
    if (this._status !== DistributionStatus.COMPLETED) {
      throw new Error('Distribution must be completed before closing estate');
    }

    if (!finalAccountsApproved) {
      throw new Error('Final accounts must be approved by court before closure');
    }

    if (!this._estateDutyPaid && this._estateValue && this._estateValue > 0) {
      throw new Error('Estate duty must be paid before closure (if applicable)');
    }

    this._closedAt = new Date();
    this.markAsUpdated();
  }

  /**
   * Sets estimated completion date for estate administration.
   */
  setEstimatedCompletion(): void {
    this.markAsUpdated();
  }

  // --------------------------------------------------------------------------
  // VALIDATION & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Validates estate is ready for grant application.
   */
  validateForGrantApplication(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this._deathCertificateNumber) {
      issues.push('Death certificate number required');
    }

    if (!this._administratorId) {
      issues.push('Administrator not appointed');
    }

    if (this._inventoryItemIds.size === 0) {
      issues.push('Estate inventory not compiled');
    }

    if (this._estateValue === null) {
      issues.push('Estate value not determined');
    }

    if (!this.hasWill() && this._grantType !== GrantType.LETTERS_OF_ADMINISTRATION) {
      issues.push('No will found. Administration type should be LETTERS_OF_ADMINISTRATION');
    }

    if (this.hasWill() && this._grantType !== GrantType.PROBATE) {
      issues.push('Will exists. Administration type should be PROBATE');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validates estate is ready for distribution.
   */
  validateForDistribution(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this._grantNumber) {
      issues.push('Grant of representation not issued');
    }

    if (this._grantStatus !== GrantStatus.CONFIRMED) {
      issues.push('Grant not confirmed');
    }

    if (this._creditorClaimIds.size > 0) {
      issues.push(
        'Outstanding creditor claims exist (application service must verify all settled)',
      );
    }

    if (!this._taxComplianceCertificateNumber) {
      issues.push('Tax compliance certificate not obtained');
    }

    if (this._beneficiaryEntitlementIds.size === 0) {
      issues.push('No beneficiary entitlements defined');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // --------------------------------------------------------------------------
  // AGGREGATE STATE QUERIES
  // --------------------------------------------------------------------------

  isPending(): boolean {
    return this._status === DistributionStatus.PENDING;
  }

  isInProgress(): boolean {
    return this._status === DistributionStatus.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this._status === DistributionStatus.COMPLETED;
  }

  isClosed(): boolean {
    return this._closedAt !== null;
  }

  hasGrantIssued(): boolean {
    return this._grantNumber !== null;
  }

  hasGrantConfirmed(): boolean {
    return this._grantStatus === GrantStatus.CONFIRMED;
  }

  isTestate(): boolean {
    return this.hasWill();
  }

  isIntestate(): boolean {
    return !this.hasWill();
  }

  /**
   * Summary for display and reporting.
   */
  getSummary(): {
    estateId: string;
    deceasedName: string;
    dateOfDeath: Date | null;
    status: DistributionStatus;
    administrationType: GrantType | null;
    grantNumber: string | null;
    grantStatus: GrantStatus | null;
    estateValue: number | null;
    currency: string;
    administratorId: string | null;
    courtStation: string | null;
    probateCaseNumber: string | null;
    isTestate: boolean;
    hasInventory: boolean;
    inventoryItemCount: number;
    creditorClaimCount: number;
    beneficiaryCount: number;
    isReadyForDistribution: boolean;
    isClosed: boolean;
  } {
    const distributionValidation = this.validateForDistribution();

    return {
      estateId: this._id,
      deceasedName: this._deceasedName,
      dateOfDeath: this._dateOfDeath,
      status: this._status,
      administrationType: this._administrationType,
      grantNumber: this._grantNumber,
      grantStatus: this._grantStatus,
      estateValue: this._estateValue,
      currency: this._currency,
      administratorId: this._administratorId,
      courtStation: this._primaryCourtStation,
      probateCaseNumber: this._probateCaseNumber,
      isTestate: this.isTestate(),
      hasInventory: this._inventoryItemIds.size > 0,
      inventoryItemCount: this._inventoryItemIds.size,
      creditorClaimCount: this._creditorClaimIds.size,
      beneficiaryCount: this._beneficiaryEntitlementIds.size,
      isReadyForDistribution: distributionValidation.isValid,
      isClosed: this.isClosed(),
    };
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }

  get deceasedUserId(): string | null {
    return this._deceasedUserId;
  }

  get deceasedName(): string {
    return this._deceasedName;
  }

  get dateOfDeath(): Date | null {
    return this._dateOfDeath;
  }

  get status(): DistributionStatus {
    return this._status;
  }

  get administrationType(): GrantType | null {
    return this._administrationType;
  }

  get estateValue(): number | null {
    return this._estateValue;
  }

  get currency(): string {
    return this._currency;
  }

  get administratorId(): string | null {
    return this._administratorId;
  }

  get grantNumber(): string | null {
    return this._grantNumber;
  }

  get grantStatus(): GrantStatus | null {
    return this._grantStatus;
  }

  get probateCaseNumber(): string | null {
    return this._probateCaseNumber;
  }

  get primaryCourtStation(): string | null {
    return this._primaryCourtStation;
  }

  get taxComplianceCertificateNumber(): string | null {
    return this._taxComplianceCertificateNumber;
  }

  get estateDutyPaid(): boolean {
    return this._estateDutyPaid;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get closedAt(): Date | null {
    return this._closedAt;
  }
}
