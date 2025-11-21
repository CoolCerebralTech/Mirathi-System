// succession-service/src/succession-process/infrastructure/persistence/mappers/distribution.mapper.ts

import { BeneficiaryEntitlement as PrismaEntitlement } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Distribution } from '../../../domain/entities/distribution.entity';
import { DistributionShare } from '../../../domain/value-objects/distribution-share.vo';

export class DistributionMapper {

  static toPersistence(domain: Distribution): PrismaEntitlement {
    const share = domain.getShare();

    // Resolve Beneficiary Identity
    // Domain uses a single ID + flag, Schema uses two nullable columns
    const beneficiaryId = domain.getBeneficiaryId();
    const isSystemUser = (domain as any).isSystemUser;

    return {
      id: domain.getId(),
      estateId: (domain as any).estateId,
      
      // ID Mapping
      beneficiaryUserId: isSystemUser ? beneficiaryId : null,
      beneficiaryFamilyMemberId: !isSystemUser ? beneficiaryId : null,
      
      // Share VO Flattening
      sharePercent: new Decimal(share.getPercentage()),
      entitlementType: (domain as any).entitlementType || 'SPECIFIC', // Fallback
      
      // Logic for Life Interest
      lifeInterest: share.isLifeInterest(),
      // lifeInterestEndsAt: handled in domain logic if needed
      
      // Status
      distributionStatus: domain.getStatus(),
      distributedAt: (domain as any).transferDate || null,
      
      // Optional Asset Link
      // Note: Schema does not explicitly link 'Asset' in Entitlement, 
      // but if we added 'assetId' to schema as per entity design:
      // assetId: domain.getAssetId() || null, 

      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as PrismaEntitlement;
  }

  static toDomain(raw: PrismaEntitlement): Distribution {
    // 1. Reconstruct Share VO
    const shareType = raw.lifeInterest ? 'LIFE_INTEREST' : 'ABSOLUTE_INTEREST';
    
    // 2. Resolve Identity
    const beneficiaryId = raw.beneficiaryUserId || raw.beneficiaryFamilyMemberId;
    if (!beneficiaryId) throw new Error(`Invalid entitlement ${raw.id}: No beneficiary linked.`);

    return Distribution.reconstitute({
      id: raw.id,
      estateId: raw.estateId,
      beneficiaryUserId: raw.beneficiaryUserId,
      beneficiaryFamilyMemberId: raw.beneficiaryFamilyMemberId,
      
      sharePercent: Number(raw.sharePercent),
      shareType: shareType,
      
      // assetId: raw.assetId, // If column exists in schema
      
      status: raw.distributionStatus,
      distributedAt: raw.distributedAt,
      notes: null, // raw.notes if exists
      
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
