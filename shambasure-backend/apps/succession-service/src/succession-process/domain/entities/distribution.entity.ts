import { AggregateRoot } from '@nestjs/cqrs';
import { DistributionStatus } from '@prisma/client';

import { ShareType } from '../../../common/types/kenyan-law.types';
import { AssetTransferredEvent } from '../events/asset-transferred.event';
import { DistributionDeferredEvent } from '../events/distribution-deferred.event';
import { DistributionDisputedEvent } from '../events/distribution-disputed.event';
import { DistributionStatusChangedEvent } from '../events/distribution-status-changed.event';
import { EntitlementCreatedEvent } from '../events/entitlement-created.event';
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
    | {
        percentage: number;
        type: ShareType;
        beneficiaryType?: 'SPOUSE' | 'CHILD' | 'DEPENDANT' | 'OTHER';
        condition?: string;
      };
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
      if (options.externalBeneficiaryName)
        distribution.externalBeneficiaryName = options.externalBeneficiaryName;
      if (options.externalBeneficiaryContact)
        distribution.externalBeneficiaryContact = options.externalBeneficiaryContact;
      if (options.legalDescription) distribution.legalDescription = options.legalDescription;
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
    if (
      !props.id ||
      !props.estateId ||
      !props.beneficiaryId ||
      !props.beneficiaryType ||
      !props.share
    ) {
      throw new Error('Missing required properties for Distribution reconstitution');
    }

    let share: DistributionShare;
    if (props.share instanceof DistributionShare) {
      share = props.share;
    } else {
      // Prefer stored beneficiaryType, fallback to mapping from generic type
      const shareBeneficiaryType =
        props.share.beneficiaryType || Distribution.mapBeneficiaryType(props.beneficiaryType);

      share = new DistributionShare(
        Number(props.share.percentage),
        props.share.type,
        shareBeneficiaryType,
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

    distribution.transferDate = props.transferDate ? new Date(props.transferDate) : null;
    distribution.disputeDate = props.disputeDate ? new Date(props.disputeDate) : null;
    distribution.deferredUntil = props.deferredUntil ? new Date(props.deferredUntil) : null;
    distribution.createdAt = new Date(props.createdAt);
    distribution.updatedAt = new Date(props.updatedAt);

    return distribution;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  startTransfer(initiatedBy: string): void {
    if (this.status !== 'PENDING' && this.status !== 'DEFERRED')
      throw new Error('Only pending or deferred distributions can start transfer.');
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

  completeTransfer(
    date: Date,
    transferMethod: TransferMethod,
    options?: { notes?: string; reference?: string; transferValue?: number; completedBy?: string },
  ): void {
    if (this.status === 'COMPLETED') return;
    if (this.status === 'DISPUTED') throw new Error('Cannot distribute a disputed entitlement.');
    if (this.status === 'DEFERRED' && this.deferredUntil && date < this.deferredUntil)
      throw new Error('Cannot complete transfer before deferral period ends.');

    this.validateKenyanTransferMethod(transferMethod, options?.reference);

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

  private validateKenyanTransferMethod(method: TransferMethod, reference?: string): void {
    const methodRequirements: Record<
      TransferMethod,
      { requiresReference: boolean; description: string }
    > = {
      TITLE_DEED: {
        requiresReference: true,
        description: 'Lands Registry Title Deed reference required',
      },
      CASH_TRANSFER: { requiresReference: true, description: 'Bank/M-Pesa reference required' },
      SHARE_CERTIFICATE: {
        requiresReference: true,
        description: 'Share certificate number required',
      },
      OTHER: { requiresReference: false, description: 'Documentation recommended' },
    };
    const requirement = methodRequirements[method];
    if (requirement.requiresReference && !reference) {
      throw new Error(`${requirement.description} for transfer method: ${method}`);
    }
  }

  markDisputed(reason: string, disputedBy: string): void {
    if (this.status === 'COMPLETED') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      if (this.transferDate && this.transferDate < sixMonthsAgo) {
        throw new Error('Disputes must be filed within 6 months of distribution under Kenyan law.');
      }
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

  resolveDispute(resolution: string, resolvedBy: string): void {
    if (this.status !== 'DISPUTED') throw new Error('Can only resolve disputed distributions.');
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

  defer(reason: string, untilDate: Date, deferredBy: string): void {
    if (this.status !== 'PENDING') throw new Error('Only pending distributions can be deferred.');
    if (reason.toLowerCase().includes('minor')) {
      const maxMinorAgeDate = new Date();
      maxMinorAgeDate.setFullYear(maxMinorAgeDate.getFullYear() + 21);
      if (untilDate > maxMinorAgeDate)
        throw new Error('Deferral for minors cannot extend beyond age 21.');
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

  updateLegalDescription(description: string): void {
    if (this.status === 'COMPLETED')
      throw new Error('Cannot update legal description for completed transfers.');
    this.legalDescription = description;
    this.updatedAt = new Date();
  }

  calculateStampDuty(): number {
    if (!this.assetId || !this.transferValue) return 0;
    const transferValue = this.transferValue;
    let stampDuty = 0;
    // Simplified Kenyan rates
    if (transferValue <= 100000) {
      stampDuty = transferValue * 0.01;
    } else if (transferValue <= 1000000) {
      stampDuty = 1000 + (transferValue - 100000) * 0.02;
    } else {
      stampDuty = 19000 + (transferValue - 1000000) * 0.04;
    }
    return Math.max(stampDuty, 100);
  }

  validateStampDutyPaid(stampDutyReceiptNumber: string, paidAmount: number): void {
    if (this.transferMethod !== 'TITLE_DEED')
      throw new Error('Stamp duty validation only applies to property transfers.');
    const calculatedDuty = this.calculateStampDuty();
    if (paidAmount < calculatedDuty)
      throw new Error(`Paid stamp duty (${paidAmount}) is less than required (${calculatedDuty})`);
    this.transferNotes =
      `${this.transferNotes || ''} | Stamp Duty: KES ${paidAmount}, Receipt: ${stampDutyReceiptNumber}`.trim();
    this.updatedAt = new Date();
  }

  requiresCourtConfirmation(totalEstateValue?: number): boolean {
    let distributionValue: number;
    if (this.transferValue) {
      distributionValue = this.transferValue;
    } else if (totalEstateValue) {
      distributionValue = totalEstateValue * (this.share.getPercentage() / 100);
    } else {
      return false;
    }
    return distributionValue >= 5000000;
  }

  generateLegalDescription(propertyDetails: {
    parcelNumber: string;
    location: string;
    area: string;
  }): string {
    this.legalDescription = `ALL THAT piece of land known as ${propertyDetails.parcelNumber} situated at ${propertyDetails.location} measuring approximately ${propertyDetails.area} as transferred under Grant of Representation ${this.estateId}`;
    return this.legalDescription;
  }

  validateKenyanCompliance(): string[] {
    const issues: string[] = [];
    if (this.share.getBeneficiaryType() === 'SPOUSE' && this.share.getPercentage() < 20)
      issues.push('Spousal entitlement appears below recommended minimum share');
    if (this.share.getBeneficiaryType() === 'CHILD' && !this.deferredUntil)
      issues.push('Minor child beneficiary should have deferred distribution');
    if (this.transferMethod === 'TITLE_DEED' && !this.legalDescription)
      issues.push('Property transfer requires legal description');
    return issues;
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  private static mapBeneficiaryType(
    beneficiaryType: BeneficiaryType,
  ): 'SPOUSE' | 'CHILD' | 'DEPENDANT' | 'OTHER' {
    const mapping: Record<BeneficiaryType, 'SPOUSE' | 'CHILD' | 'DEPENDANT' | 'OTHER'> = {
      USER: 'OTHER',
      FAMILY_MEMBER: 'OTHER',
      EXTERNAL: 'OTHER',
    };
    return mapping[beneficiaryType];
  }

  updateBeneficiaryCategory(category: 'SPOUSE' | 'CHILD' | 'DEPENDANT' | 'OTHER'): void {
    if (this.status === 'COMPLETED')
      throw new Error('Cannot update beneficiary category for completed distributions.');
    this.share = new DistributionShare(
      this.share.getPercentage(),
      this.share.getType(),
      category,
      this.share.getCondition(),
    );
    this.updatedAt = new Date();
  }

  canProceed(): boolean {
    return this.status === 'PENDING' || (this.status === 'DEFERRED' && this.isDeferralPeriodOver());
  }

  isDeferralPeriodOver(): boolean {
    if (!this.deferredUntil) return true;
    return new Date() >= this.deferredUntil;
  }

  isLifeInterest(): boolean {
    return this.share.isLifeInterest();
  }
  hasConditions(): boolean {
    return this.share.getCondition() !== undefined;
  }

  getBeneficiaryDisplayName(): string {
    return this.externalBeneficiaryName || `Beneficiary ${this.beneficiaryId.substring(0, 8)}`;
  }

  // Getters
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
