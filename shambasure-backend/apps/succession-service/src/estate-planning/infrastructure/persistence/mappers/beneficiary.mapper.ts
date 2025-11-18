import { BequestType, BequestConditionType, DistributionStatus } from '@prisma/client';
import { Beneficiary } from '../../../domain/entities/beneficiary.entity';
import { SharePercentage } from '../../../domain/value-objects/share-percentage.vo';
import { AssetValue } from '../../../domain/value-objects/asset-value.vo';

export class BeneficiaryMapper {
  static toDomain(prismaBeneficiary: any): Beneficiary {
    if (!prismaBeneficiary) return null;

    const beneficiaryInfo: any = {};

    if (prismaBeneficiary.beneficiaryId) {
      beneficiaryInfo.userId = prismaBeneficiary.beneficiaryId;
    } else if (prismaBeneficiary.familyMemberId) {
      beneficiaryInfo.familyMemberId = prismaBeneficiary.familyMemberId;
    } else {
      beneficiaryInfo.externalName = prismaBeneficiary.externalBeneficiaryName;
      beneficiaryInfo.externalContact = prismaBeneficiary.externalBeneficiaryContact;
    }

    beneficiaryInfo.relationship = prismaBeneficiary.relationship;

    const beneficiary = new Beneficiary(
      prismaBeneficiary.id,
      prismaBeneficiary.willId,
      prismaBeneficiary.assetId,
      beneficiaryInfo,
      prismaBeneficiary.bequestType as BequestType,
      prismaBeneficiary.priority,
    );

    // Set additional properties
    if (prismaBeneficiary.sharePercent) {
      beneficiary.updateShare(new SharePercentage(prismaBeneficiary.sharePercent.toNumber()));
    }

    if (prismaBeneficiary.specificAmount) {
      beneficiary.updateSpecificAmount(
        new AssetValue(
          prismaBeneficiary.specificAmount.toNumber(),
          'KES', // Default currency
        ),
      );
    }

    if (prismaBeneficiary.conditionType !== BequestConditionType.NONE) {
      beneficiary.addCondition(
        prismaBeneficiary.conditionType as BequestConditionType,
        prismaBeneficiary.conditionDetails,
      );
    }

    Object.assign(beneficiary, {
      alternateBeneficiaryId: prismaBeneficiary.alternateBeneficiaryId,
      alternateSharePercent: prismaBeneficiary.alternateSharePercent?.toNumber(),
      distributionStatus: prismaBeneficiary.distributionStatus as DistributionStatus,
      distributedAt: prismaBeneficiary.distributedAt,
      distributionNotes: prismaBeneficiary.distributionNotes,
      createdAt: prismaBeneficiary.createdAt,
      updatedAt: prismaBeneficiary.updatedAt,
    });

    return beneficiary;
  }

  static toPersistence(beneficiary: Beneficiary): any {
    const persistenceObj: any = {
      id: beneficiary.getId(),
      willId: beneficiary.getWillId(),
      assetId: beneficiary.getAssetId(),
      bequestType: beneficiary.getBequestType(),
      sharePercent: beneficiary.getSharePercentage()?.getValue(),
      specificAmount: beneficiary.getSpecificAmount()?.getAmount(),
      conditionType: beneficiary.getConditionType(),
      conditionDetails: beneficiary.getConditionDetails(),
      alternateBeneficiaryId: beneficiary.getAlternateBeneficiaryId(),
      alternateSharePercent: beneficiary.getAlternateShare()?.getValue(),
      distributionStatus: beneficiary.getDistributionStatus(),
      distributedAt: beneficiary.getDistributedAt(),
      distributionNotes: beneficiary.getDistributionNotes(),
      priority: beneficiary.getPriority(),
      createdAt: beneficiary.getCreatedAt(),
      updatedAt: beneficiary.getUpdatedAt(),
    };

    // Set beneficiary identification
    const beneficiaryInfo = beneficiary.getBeneficiaryInfo();
    if (beneficiaryInfo.userId) {
      persistenceObj.beneficiaryId = beneficiaryInfo.userId;
    } else if (beneficiaryInfo.familyMemberId) {
      persistenceObj.familyMemberId = beneficiaryInfo.familyMemberId;
    } else {
      persistenceObj.externalBeneficiaryName = beneficiaryInfo.externalName;
      persistenceObj.externalBeneficiaryContact = beneficiaryInfo.externalContact;
    }

    persistenceObj.relationship = beneficiaryInfo.relationship;

    return persistenceObj;
  }

  static toDomainList(prismaBeneficiaries: any[]): Beneficiary[] {
    return prismaBeneficiaries.map((beneficiary) => this.toDomain(beneficiary)).filter(Boolean);
  }
}
