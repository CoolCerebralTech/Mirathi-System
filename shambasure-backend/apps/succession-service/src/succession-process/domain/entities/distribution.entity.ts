import { AggregateRoot } from '@nestjs/cqrs';
import { DistributionStatus } from '@prisma/client';
import { ShareType } from '../../../common/types/kenyan-law.types';
import { EntitlementCreatedEvent } from '../events/entitlement-created.event';
import { AssetTransferredEvent } from '../events/asset-transferred.event';
import { DistributionDisputedEvent } from '../events/distribution-disputed.event';
import { DistributionStatusChangedEvent } from '../events/distribution-status-changed.event';
import { DistributionDeferredEvent } from '../events/distribution-deferred.event';
import { DistributionShare } from '../value-objects/distribution-share.vo';

export type BeneficiaryType = 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';
export type TransferMethod = 'TITLE_DEED' | 'CASH_TRANSFER' | 'SHARE_CERTIFICATE' | 'OTHER';

// Safe interface for reconstitution
export interface DistributionProps {
  id: string;
  estateId: string;
  beneficiaryId: string;
  beneficiaryType: BeneficiaryType;
  externalBeneficiaryName?: string | null;
  externalBeneficiaryContact?: string | null;
  assetId?: string | null;
  share:
    | DistributionShare
    | { percentage: number; type: ShareType; beneficiaryType?: string; condition?: string };
  status: DistributionStatus;
  transferDate?: Date | string | null;
  transferNotes?: string | null;
  transferMethod?: TransferMethod | null;
  transferReference?: string | null;
  transferValue?: number | null;
  disputeReason?: string | null;
  disputedBy?: string | null;
  disputeDate?: Date | string | null;
  deferralReason?: string | null;
  deferredUntil?: Date | string | null;
  legalDescription?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class Distribution extends AggregateRoot {
  private id: string;
  private estateId: string;

  // Beneficiary Information
  private beneficiaryId: string;
  private beneficiaryType: BeneficiaryType;
  private externalBeneficiaryName: string | null;
  private externalBeneficiaryContact: string | null;

  // Asset Information
  private assetId: string | null;
  private share: DistributionShare;

  // Status and Tracking
  private status: DistributionStatus;
  private transferDate: Date | null;
  private transferNotes: string | null;
  private transferMethod: TransferMethod | null;
  private transferReference: string | null;
  private transferValue: number | null;

  // Dispute Information
  private disputeReason: string | null;
  private disputedBy: string | null;
  private disputeDate: Date | null;

  // Deferral Information
  private deferralReason: string | null;
  private deferredUntil: Date | null;

  // Legal Documentation
  private legalDescription: string | null;

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    estateId: string,
    beneficiaryId: string,
    beneficiaryType: BeneficiaryType,
    share: DistributionShare,
    assetId: string | null,
  ) {
    super();
    this.id = id;
    this.estateId = estateId;
    this.beneficiaryId = beneficiaryId;
    this.beneficiaryType = beneficiaryType;
    this.share = share;
    this.assetId = assetId;

    this.status = 'PENDING';
    this.transferDate = null;
    this.transferNotes = null;
    this.transferMethod = null;
    this.transferReference = null;
    this.transferValue = null;
    this.disputeReason = null;
    this.disputedBy = null;
    this.disputeDate = null;
    this.deferralReason = null;
    this.deferredUntil = null;
    this.externalBeneficiaryName = null;
    this.externalBeneficiaryContact = null;
    this.legalDescription = null;

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    estateId: string,
    beneficiaryId: string,
    beneficiaryType: BeneficiaryType,
    sharePercentage: number,
    shareType: ShareType,
    options?: {
      assetId?: string;
      externalBeneficiaryName?: string;
      externalBeneficiaryContact?: string;
      condition?: string;
      legalDescription?: string;
    },
  ): Distribution {
    const share = new DistributionShare(
      sharePercentage,
      shareType,
      this.mapBeneficiaryType(beneficiaryType),
      options?.condition,
    );

    const distribution = new Distribution(
      id,
      estateId,
      beneficiaryId,
      beneficiaryType,
      share,
      options?.assetId || null,
    );

    if (options) {
      if (options.externalBeneficiaryName) {
        distribution.externalBeneficiaryName = options.externalBeneficiaryName;
      }
      if (options.externalBeneficiaryContact) {
        distribution.externalBeneficiaryContact = options.externalBeneficiaryContact;
      }
      if (options.legalDescription) {
        distribution.legalDescription = options.legalDescription;
      }
    }

    distribution.apply(
      new EntitlementCreatedEvent(
        id,
        estateId,
        beneficiaryId,
        beneficiaryType === 'USER',
        options?.assetId || null,
        sharePercentage,
        shareType,
        beneficiaryType,
        options?.condition,
      ),
    );

    return distribution;
  }

  static reconstitute(props: DistributionProps): Distribution {
    // Validate required fields
    if (
      !props.id ||
      !props.estateId ||
      !props.beneficiaryId ||
      !props.beneficiaryType ||
      !props.share
    ) {
      throw new Error('Missing required properties for Distribution reconstitution');
    }

    // Reconstruct DistributionShare safely
    let share: DistributionShare;
    if (props.share instanceof DistributionShare) {
      share = props.share;
    } else {
      share = new DistributionShare(
        Number(props.share.percentage),
        props.share.type,
        this.mapBeneficiaryType(props.beneficiaryType),
        props.share.condition,
      );
    }

    const distribution = new Distribution(
      props.id,
      props.estateId,
      props.beneficiaryId,
      props.beneficiaryType,
      share,
      props.assetId || null,
    );

    // Safe property assignments
    distribution.status = props.status;
    distribution.externalBeneficiaryName = props.externalBeneficiaryName ?? null;
    distribution.externalBeneficiaryContact = props.externalBeneficiaryContact ?? null;
    distribution.transferNotes = props.transferNotes ?? null;
    distribution.transferMethod = props.transferMethod ?? null;
    distribution.transferReference = props.transferReference ?? null;
    distribution.transferValue = props.transferValue ?? null;
    distribution.disputeReason = props.disputeReason ?? null;
    distribution.disputedBy = props.disputedBy ?? null;
    distribution.deferralReason = props.deferralReason ?? null;
    distribution.legalDescription = props.legalDescription ?? null;

    // Safe date handling
    if (props.transferDate) {
      distribution.transferDate = new Date(props.transferDate);
    } else {
      distribution.transferDate = null;
    }

    if (props.disputeDate) {
      distribution.disputeDate = new Date(props.disputeDate);
    } else {
      distribution.disputeDate = null;
    }

    if (props.deferredUntil) {
      distribution.deferredUntil = new Date(props.deferredUntil);
    } else {
      distribution.deferredUntil = null;
    }

    distribution.createdAt = new Date(props.createdAt);
    distribution.updatedAt = new Date(props.updatedAt);

    return distribution;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Mark the physical transfer as initiated (e.g., Lodged at Lands Office)
   */
  startTransfer(initiatedBy: string): void {
    if (this.status !== 'PENDING' && this.status !== 'DEFERRED') {
      throw new Error('Only pending or deferred distributions can start transfer.');
    }

    const oldStatus = this.status;
    this.status = 'IN_PROGRESS';
    this.updatedAt = new Date();

    this.apply(
      new DistributionStatusChangedEvent(
        this.id,
        this.estateId,
        oldStatus,
        this.status,
        'Transfer process initiated',
        initiatedBy,
      ),
    );
  }

  /**
   * Complete the transfer (Title Deed issued / Cash sent)
   */
  completeTransfer(
    date: Date,
    transferMethod: TransferMethod,
    options?: {
      notes?: string;
      reference?: string;
      transferValue?: number;
      completedBy?: string;
    },
  ): void {
    if (this.status === 'COMPLETED') return; // Idempotent

    if (this.status === 'DISPUTED') {
      throw new Error('Cannot distribute a disputed entitlement.');
    }

    if (this.status === 'DEFERRED' && this.deferredUntil && date < this.deferredUntil) {
      throw new Error('Cannot complete transfer before deferral period ends.');
    }

    const oldStatus = this.status;
    this.status = 'COMPLETED';
    this.transferDate = date;
    this.transferMethod = transferMethod;

    if (options) {
      if (options.notes) this.transferNotes = options.notes;
      if (options.reference) this.transferReference = options.reference;
      if (options.transferValue) this.transferValue = options.transferValue;
    }

    this.updatedAt = new Date();

    this.apply(
      new AssetTransferredEvent(
        this.id,
        this.estateId,
        this.assetId || 'RESIDUARY',
        date,
        transferMethod,
        options?.reference,
        options?.transferValue,
      ),
    );

    this.apply(
      new DistributionStatusChangedEvent(
        this.id,
        this.estateId,
        oldStatus,
        this.status,
        'Transfer completed successfully',
        options?.completedBy,
      ),
    );
  }

  /**
   * Flag this entitlement as disputed
   */
  markDisputed(reason: string, disputedBy: string): void {
    if (this.status === 'COMPLETED') {
      throw new Error('Cannot dispute a completed distribution.');
    }

    const oldStatus = this.status;
    this.status = 'DISPUTED';
    this.disputeReason = reason;
    this.disputedBy = disputedBy;
    this.disputeDate = new Date();
    this.updatedAt = new Date();

    this.apply(
      new DistributionDisputedEvent(this.id, this.estateId, reason, disputedBy, this.disputeDate),
    );

    this.apply(
      new DistributionStatusChangedEvent(
        this.id,
        this.estateId,
        oldStatus,
        this.status,
        `Distribution disputed: ${reason}`,
        disputedBy,
      ),
    );
  }

  /**
   * Resolve dispute and return to previous status
   */
  resolveDispute(resolution: string, resolvedBy: string): void {
    if (this.status !== 'DISPUTED') {
      throw new Error('Can only resolve disputed distributions.');
    }

    // Return to previous logical status (simplified - could track previous status)
    const newStatus = this.transferDate ? 'COMPLETED' : 'PENDING';
    const oldStatus = this.status;

    this.status = newStatus;
    this.disputeReason = `${this.disputeReason} - RESOLVED: ${resolution}`;
    this.updatedAt = new Date();

    this.apply(
      new DistributionStatusChangedEvent(
        this.id,
        this.estateId,
        oldStatus,
        this.status,
        `Dispute resolved: ${resolution}`,
        resolvedBy,
      ),
    );
  }

  /**
   * Defer distribution (for minors, conditional bequests, etc.)
   */
  defer(reason: string, untilDate: Date, deferredBy: string): void {
    if (this.status !== 'PENDING') {
      throw new Error('Only pending distributions can be deferred.');
    }

    const oldStatus = this.status;
    this.status = 'DEFERRED';
    this.deferralReason = reason;
    this.deferredUntil = untilDate;
    this.updatedAt = new Date();

    this.apply(
      new DistributionDeferredEvent(this.id, this.estateId, reason, untilDate, deferredBy),
    );

    this.apply(
      new DistributionStatusChangedEvent(
        this.id,
        this.estateId,
        oldStatus,
        this.status,
        `Distribution deferred until ${untilDate.toDateString()}: ${reason}`,
        deferredBy,
      ),
    );
  }

  /**
   * Update legal description for property transfers
   */
  updateLegalDescription(description: string): void {
    if (this.status === 'COMPLETED') {
      throw new Error('Cannot update legal description for completed transfers.');
    }

    this.legalDescription = description;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // VALIDATION & HELPER METHODS
  // --------------------------------------------------------------------------

  private static mapBeneficiaryType(
    beneficiaryType: BeneficiaryType,
  ): 'SPOUSE' | 'CHILD' | 'DEPENDANT' | 'OTHER' {
    const mapping: Record<BeneficiaryType, 'SPOUSE' | 'CHILD' | 'DEPENDANT' | 'OTHER'> = {
      USER: 'OTHER',
      FAMILY_MEMBER: 'OTHER', // This should be refined based on actual relationship
      EXTERNAL: 'OTHER',
    };
    return mapping[beneficiaryType];
  }

  /**
   * Check if distribution can proceed (no disputes, not deferred)
   */
  canProceed(): boolean {
    return this.status === 'PENDING' || (this.status === 'DEFERRED' && this.isDeferralPeriodOver());
  }

  /**
   * Check if deferral period has ended
   */
  isDeferralPeriodOver(): boolean {
    if (!this.deferredUntil) return true;
    return new Date() >= this.deferredUntil;
  }

  /**
   * Check if this is a life interest distribution
   */
  isLifeInterest(): boolean {
    return this.share.isLifeInterest();
  }

  /**
   * Check if this is a conditional distribution
   */
  hasConditions(): boolean {
    return this.share.getCondition() !== undefined;
  }

  /**
   * Get beneficiary display name
   */
  getBeneficiaryDisplayName(): string {
    if (this.externalBeneficiaryName) {
      return this.externalBeneficiaryName;
    }
    return `Beneficiary ${this.beneficiaryId.substring(0, 8)}`;
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getShare(): DistributionShare {
    return this.share;
  }
  getStatus(): DistributionStatus {
    return this.status;
  }
  getBeneficiaryId(): string {
    return this.beneficiaryId;
  }
  getAssetId(): string | null {
    return this.assetId;
  }
  getEstateId(): string {
    return this.estateId;
  }
  getBeneficiaryType(): BeneficiaryType {
    return this.beneficiaryType;
  }
  getExternalBeneficiaryName(): string | null {
    return this.externalBeneficiaryName;
  }
  getExternalBeneficiaryContact(): string | null {
    return this.externalBeneficiaryContact;
  }
  getTransferDate(): Date | null {
    return this.transferDate;
  }
  getTransferNotes(): string | null {
    return this.transferNotes;
  }
  getTransferMethod(): TransferMethod | null {
    return this.transferMethod;
  }
  getTransferReference(): string | null {
    return this.transferReference;
  }
  getTransferValue(): number | null {
    return this.transferValue;
  }
  getDisputeReason(): string | null {
    return this.disputeReason;
  }
  getDisputedBy(): string | null {
    return this.disputedBy;
  }
  getDisputeDate(): Date | null {
    return this.disputeDate;
  }
  getDeferralReason(): string | null {
    return this.deferralReason;
  }
  getDeferredUntil(): Date | null {
    return this.deferredUntil;
  }
  getLegalDescription(): string | null {
    return this.legalDescription;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Method to get all properties for persistence
  getProps(): DistributionProps {
    return {
      id: this.id,
      estateId: this.estateId,
      beneficiaryId: this.beneficiaryId,
      beneficiaryType: this.beneficiaryType,
      externalBeneficiaryName: this.externalBeneficiaryName,
      externalBeneficiaryContact: this.externalBeneficiaryContact,
      assetId: this.assetId,
      share: this.share,
      status: this.status,
      transferDate: this.transferDate,
      transferNotes: this.transferNotes,
      transferMethod: this.transferMethod,
      transferReference: this.transferReference,
      transferValue: this.transferValue,
      disputeReason: this.disputeReason,
      disputedBy: this.disputedBy,
      disputeDate: this.disputeDate,
      deferralReason: this.deferralReason,
      deferredUntil: this.deferredUntil,
      legalDescription: this.legalDescription,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
