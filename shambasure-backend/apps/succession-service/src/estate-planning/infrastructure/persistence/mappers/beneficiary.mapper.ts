import { BeneficiaryAssignment as PrismaBeneficiary } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  BeneficiaryAssignment,
  BeneficiaryIdentity,
} from '../../../domain/entities/beneficiary.entity';
import { SharePercentage } from '../../../domain/value-objects/share-percentage.vo';
import { AssetValue } from '../../../domain/value-objects/asset-value.vo';

export class BeneficiaryMapper {
  static toPersistence(domain: BeneficiaryAssignment): PrismaBeneficiary {
    const identity = domain.getIdentity();
    const share = domain.getSharePercent();
    const amount = domain.getSpecificAmount();

    return {
      id: domain.getId(),
      willId: domain.getWillId(),
      assetId: domain.getAssetId(),

      // Identity Flattening
      beneficiaryId: identity.userId || null,
      familyMemberId: identity.familyMemberId || null,
      externalBeneficiaryName: identity.externalName || null,
      externalBeneficiaryContact: null, // Not strictly in VO, defaults to null

      // Bequest Details
      bequestType: domain.getBequestType(),
      sharePercent: share ? new Decimal(share.getValue()) : new Decimal(0),
      specificAmount: amount ? new Decimal(amount.getAmount()) : null,

      // Conditions
      hasCondition: domain.getHasCondition(),
      conditionType: domain.getConditionType(),
      conditionDetails: domain.getConditionDetails(),

      // Alternate (Logic handled in aggregate, placeholder here)
      alternateBeneficiaryId: null,
      alternateSharePercent: null,

      // Status
      distributionStatus: domain.getDistributionStatus(),
      distributedAt: domain.getDistributedAt(),
      distributionNotes: null,
      priority: domain.getPriority(),

      createdAt: new Date(), // Usually handled by DB default
      updatedAt: new Date(),
    } as unknown as PrismaBeneficiary; // Cast needed for Decimal compatibility
  }

  static toDomain(raw: PrismaBeneficiary): BeneficiaryAssignment {
    // Reconstruct Identity
    // Note: We infer relationship from external data context if needed,
    // or it might be loaded via a join (not available in raw mapper).
    const identity: BeneficiaryIdentity = {
      userId: raw.beneficiaryId || undefined,
      familyMemberId: raw.familyMemberId || undefined,
      externalName: raw.externalBeneficiaryName || undefined,
      // relationship: fetched separately or stored in future schema update
    };

    // Reconstruct Value Objects
    const sharePercent =
      raw.sharePercent && Number(raw.sharePercent) > 0
        ? new SharePercentage(Number(raw.sharePercent))
        : null;

    // Note: Prisma Schema for BeneficiaryAssignment specificAmount is just a Decimal.
    // We assume default currency (KES) or fetching from Asset context.
    // ideally schema should have specificAmountCurrency.
    const specificAmount = raw.specificAmount
      ? new AssetValue(Number(raw.specificAmount), 'KES')
      : null;

    const assignment = BeneficiaryAssignment.reconstitute({
      id: raw.id,
      willId: raw.willId,
      assetId: raw.assetId,
      identity: identity, // Pass the constructed identity object
      bequestType: raw.bequestType,
      priority: raw.priority,

      sharePercent: sharePercent ? sharePercent.getValue() : null, // Pass raw value to reconstitute
      specificAmount: specificAmount,

      hasCondition: raw.hasCondition,
      conditionType: raw.conditionType,
      conditionDetails: raw.conditionDetails,

      distributionStatus: raw.distributionStatus,
      distributedAt: raw.distributedAt,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });

    return assignment;
  }
}
