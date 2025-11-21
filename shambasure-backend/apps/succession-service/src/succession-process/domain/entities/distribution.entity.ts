import { AggregateRoot } from '@nestjs/cqrs';
import { DistributionStatus, BequestType } from '@prisma/client';
import { ShareType } from '../../../common/types/kenyan-law.types';
import { EntitlementCreatedEvent } from '../events/entitlement-created.event';
import { AssetTransferredEvent } from '../events/asset-transferred.event';
import { DistributionShare } from '../value-objects/distribution-share.vo';

export class Distribution extends AggregateRoot {
  private id: string;
  private estateId: string;

  // Who
  private beneficiaryId: string; // Maps to userId or familyMemberId
  private isSystemUser: boolean; // Tracks which ID field to use

  // What
  private assetId: string | null; // Null implies Residuary/Cash pool
  private share: DistributionShare; // Value Object for % and Type

  // Status
  private status: DistributionStatus;
  private transferDate: Date | null;
  private transferNotes: string | null;

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    estateId: string,
    beneficiaryId: string,
    isSystemUser: boolean,
    share: DistributionShare,
    assetId: string | null,
  ) {
    super();
    this.id = id;
    this.estateId = estateId;
    this.beneficiaryId = beneficiaryId;
    this.isSystemUser = isSystemUser;
    this.share = share;
    this.assetId = assetId;

    this.status = 'PENDING';
    this.transferDate = null;
    this.transferNotes = null;

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY
  // --------------------------------------------------------------------------

  static create(
    id: string,
    estateId: string,
    beneficiaryId: string,
    isSystemUser: boolean,
    sharePercentage: number,
    shareType: ShareType,
    assetId?: string,
  ): Distribution {
    const share = new DistributionShare(sharePercentage, shareType);

    const distribution = new Distribution(
      id,
      estateId,
      beneficiaryId,
      isSystemUser,
      share,
      assetId || null,
    );

    distribution.apply(
      new EntitlementCreatedEvent(
        id,
        estateId,
        beneficiaryId,
        assetId || null,
        sharePercentage,
        shareType,
      ),
    );

    return distribution;
  }

  static reconstitute(props: any): Distribution {
    // Map DB BequestType to our Domain ShareType if necessary
    // For now assuming direct mapping or conversion logic in mapper
    const share = new DistributionShare(
      Number(props.sharePercent),
      props.shareType, // "LIFE_INTEREST" etc.
    );

    const dist = new Distribution(
      props.id,
      props.estateId,
      props.beneficiaryUserId || props.beneficiaryFamilyMemberId,
      !!props.beneficiaryUserId,
      share,
      props.assetId,
    );

    dist.status = props.status;
    dist.transferDate = props.distributedAt ? new Date(props.distributedAt) : null;
    dist.transferNotes = props.notes || null;
    dist.createdAt = new Date(props.createdAt);
    dist.updatedAt = new Date(props.updatedAt);

    return dist;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Mark the physical transfer as initiated (e.g., Lodged at Lands Office).
   */
  startTransfer(): void {
    if (this.status !== 'PENDING') return;
    this.status = 'IN_PROGRESS';
    this.updatedAt = new Date();
  }

  /**
   * Complete the transfer (Title Deed issued / Cash sent).
   */
  completeTransfer(date: Date, notes?: string): void {
    if (this.status === 'COMPLETED') return; // Idempotent

    if (this.status === 'DISPUTED') {
      throw new Error('Cannot distribute a disputed entitlement.');
    }

    // Logic: Life Interest cannot be "Fully Transferred" in fee simple,
    // but the "Registration of Life Interest" can be completed.

    this.status = 'COMPLETED';
    this.transferDate = date;
    if (notes) this.transferNotes = notes;
    this.updatedAt = new Date();

    this.apply(
      new AssetTransferredEvent(this.id, this.estateId, this.assetId || 'RESIDUARY', date),
    );
  }

  /**
   * Flag this entitlement as disputed (e.g. "He is not a child of the deceased").
   */
  markDisputed(): void {
    this.status = 'DISPUTED';
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId() {
    return this.id;
  }
  getShare() {
    return this.share;
  }
  getStatus() {
    return this.status;
  }
  getBeneficiaryId() {
    return this.beneficiaryId;
  }
  getAssetId() {
    return this.assetId;
  }
}
